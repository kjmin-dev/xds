//! The date picker: a field that opens a calendar of one month.
//!
//! The field is a select's box, and GPUI Component's popover holds the calendar as it holds a
//! select's list: it places it under the field, moves the focus into it, closes it on Escape
//! or a press outside and gives the focus back. The calendar is drawn here from the tokens.
//! GPUI Component's own date picker takes its look from its theme and has no arrow-key
//! movement, and GPUI Base's calendar keeps no focused day to move, so neither is used.
//!
//! What a key does, which month opens and how the weeks are laid out are plain functions of
//! dates, tested against the same table as the other clients, so the keyboard model cannot
//! drift from the web's.

use std::cell::{Cell, RefCell};
use std::collections::HashMap;
use std::rc::Rc;
use std::sync::OnceLock;

use acme_tokens as tokens;
use chrono::{Datelike, Local, Locale, Months, NaiveDate, Weekday};
use gpui_kit::base::FocusTrapElement;
use gpui_kit::component::{
    Selectable, ThemeStyled,
    popover::{Popover, PopoverState},
};
use gpui_kit::prelude::FluentBuilder;
use gpui_kit::{
    Anchor, AnyElement, App, Bounds, Element, ElementId, Entity, FocusHandle, GlobalElementId,
    InspectorElementId, InteractiveElement, IntoElement, KeyDownEvent, LayoutId, MouseButton,
    ParentElement, Pixels, RenderOnce, Role, SharedString, StatefulInteractiveElement,
    StyleRefinement, Styled, Window, accesskit, div, px,
};

use crate::components::{
    ControlSize, field_frame, field_label, field_note, field_outline, icon_button, shadow,
};
use crate::controls::{IconSize, focus_handle, icon};
use crate::theme::{TypographyExt, color, palette};

// ---------------------------------------------------------------- dates

/// What a key does to the focused day of the calendar.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum CalendarKey {
    Left,
    Right,
    Up,
    Down,
    PageUp,
    PageDown,
    ShiftPageUp,
    ShiftPageDown,
    Home,
    End,
}

/// `day` held inside `min`..`max`, where they are given.
pub(crate) fn clamp(day: NaiveDate, min: Option<NaiveDate>, max: Option<NaiveDate>) -> NaiveDate {
    let day = min.map_or(day, |min| day.max(min));
    max.map_or(day, |max| day.min(max))
}

fn first_of_month(day: NaiveDate) -> NaiveDate {
    day.with_day(1).unwrap_or(day)
}

fn last_of_month(day: NaiveDate) -> NaiveDate {
    first_of_month(day)
        .checked_add_months(Months::new(1))
        .and_then(|next| next.pred_opt())
        .unwrap_or(day)
}

/// `day` moved by whole months. A day the shorter month lacks is held to its last day, as
/// `@internationalized/date` adds months on the web: January 31 and a month is February 28.
fn add_months(day: NaiveDate, months: i32) -> NaiveDate {
    let moved = if months >= 0 {
        day.checked_add_months(Months::new(months.unsigned_abs()))
    } else {
        day.checked_sub_months(Months::new(months.unsigned_abs()))
    };
    moved.unwrap_or(day)
}

/// Where `key` moves the focus from `day`, never past `min` or `max`.
pub(crate) fn move_focus(
    day: NaiveDate,
    key: CalendarKey,
    min: Option<NaiveDate>,
    max: Option<NaiveDate>,
) -> NaiveDate {
    let to = match key {
        CalendarKey::Left => day.pred_opt().unwrap_or(day),
        CalendarKey::Right => day.succ_opt().unwrap_or(day),
        CalendarKey::Up => day - chrono::Days::new(7),
        CalendarKey::Down => day + chrono::Days::new(7),
        CalendarKey::PageUp => add_months(day, -1),
        CalendarKey::PageDown => add_months(day, 1),
        CalendarKey::ShiftPageUp => add_months(day, -12),
        CalendarKey::ShiftPageDown => add_months(day, 12),
        CalendarKey::Home => first_of_month(day),
        CalendarKey::End => last_of_month(day),
    };
    clamp(to, min, max)
}

/// The day the calendar opens on, whose month it shows: the chosen day, or today when nothing
/// is chosen, held inside `min`..`max`.
pub(crate) fn initial_month(
    value: Option<NaiveDate>,
    today: NaiveDate,
    min: Option<NaiveDate>,
    max: Option<NaiveDate>,
) -> NaiveDate {
    clamp(value.unwrap_or(today), min, max)
}

/// The weeks of a month, each from `first_weekday` on. Days of the months around it are left
/// out, so the first and the last week have gaps.
pub(crate) fn month_weeks(
    year: i32,
    month: u32,
    first_weekday: Weekday,
) -> Vec<[Option<NaiveDate>; 7]> {
    let Some(first) = NaiveDate::from_ymd_opt(year, month, 1) else {
        return Vec::new();
    };
    let last = last_of_month(first);
    let lead =
        (first.weekday().num_days_from_monday() + 7 - first_weekday.num_days_from_monday()) % 7;
    let mut weeks = Vec::new();
    let mut week = [None; 7];
    let mut column = lead as usize;
    for day in first.iter_days().take_while(|day| *day <= last) {
        week[column] = Some(day);
        column += 1;
        if column == 7 {
            weeks.push(week);
            week = [None; 7];
            column = 0;
        }
    }
    if column > 0 {
        weeks.push(week);
    }
    weeks
}

// ---------------------------------------------------------------- locale

/// Which of the day, the month and the year a locale's dates start with.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum LeadingField {
    Month,
    Day,
    Year,
}

/// The names, the forms of a date and the first day of the week of a locale, so the grid
/// knows nothing of locales. They come from the glibc tables chrono formats with, which have
/// the names and a short numeric form but no medium form: that is made from the names in the
/// order of the short one ("Mar 10, 2026", "10 Mar 2026"), and from the short one itself where
/// it starts with the year and spells its fields ("2026년 3월 10일").
#[derive(Debug, Clone, Copy)]
pub(crate) struct CalendarLocale {
    locale: Locale,
    order: LeadingField,
    first_weekday: Weekday,
}

/// The table to use for a language when the system's region has none of its own, as `en-KR`
/// has not. Most languages have one under their own code as the region (`de_DE`); these do
/// not.
const LANGUAGE_DEFAULTS: [(&str, &str); 14] = [
    ("ar", "ar_EG"),
    ("cs", "cs_CZ"),
    ("da", "da_DK"),
    ("el", "el_GR"),
    ("en", "en_US"),
    ("he", "he_IL"),
    ("hi", "hi_IN"),
    ("ja", "ja_JP"),
    ("ko", "ko_KR"),
    ("nb", "nb_NO"),
    ("no", "nb_NO"),
    ("sv", "sv_SE"),
    ("uk", "uk_UA"),
    ("zh", "zh_CN"),
];

impl CalendarLocale {
    /// The locale the system runs in, read once.
    pub(crate) fn system() -> Self {
        static SYSTEM: OnceLock<CalendarLocale> = OnceLock::new();
        *SYSTEM.get_or_init(|| Self::from_tag(&sys_locale::get_locale().unwrap_or_default()))
    }

    /// The locale for a BCP 47 tag (`en-US`, `zh-Hans-CN`) or a POSIX name (`ko_KR.UTF-8`).
    /// The tag's own table first, then its language's, then the POSIX one: English names
    /// and Sunday.
    pub(crate) fn from_tag(tag: &str) -> Self {
        let tag = tag.split(['.', '@']).next().unwrap_or_default();
        let mut parts = tag.split(['-', '_']);
        let language = parts.next().unwrap_or_default().to_ascii_lowercase();
        let region = parts
            .rfind(|part| {
                (part.len() == 2 && part.chars().all(|c| c.is_ascii_alphabetic()))
                    || (part.len() == 3 && part.chars().all(|c| c.is_ascii_digit()))
            })
            .map(str::to_ascii_uppercase);
        let fallback = LANGUAGE_DEFAULTS
            .iter()
            .find(|(code, _)| *code == language)
            .map_or_else(
                || format!("{language}_{}", language.to_ascii_uppercase()),
                |(_, name)| (*name).to_string(),
            );
        let locale = region
            .map(|region| format!("{language}_{region}"))
            .into_iter()
            .chain([fallback])
            .find_map(|name| Locale::try_from(name.as_str()).ok())
            .unwrap_or(Locale::POSIX);
        Self::new(locale)
    }

    fn new(locale: Locale) -> Self {
        let short = pure_rust_locales::locale_match!(locale => LC_TIME::D_FMT);
        let at = |fields: &[&str]| {
            fields
                .iter()
                .filter_map(|field| short.find(field))
                .min()
                .unwrap_or(usize::MAX)
        };
        let (day, month, year) = (at(&["%d", "%e"]), at(&["%m"]), at(&["%Y", "%y"]));
        let order = if year < month && year < day {
            LeadingField::Year
        } else if day < month {
            LeadingField::Day
        } else {
            LeadingField::Month
        };
        // glibc numbers the days of the week from its base day, which is a Sunday
        // (1997-11-30) in every table; a table that does not say starts on that day.
        let first = pure_rust_locales::locale_match!(locale => LC_TIME::FIRST_WEEKDAY);
        let from_monday = (first.unwrap_or(1) - 1 + 6).rem_euclid(7);
        let first_weekday = Weekday::try_from(from_monday as u8).unwrap_or(Weekday::Sun);
        Self {
            locale,
            order,
            first_weekday,
        }
    }

    pub(crate) fn first_weekday(&self) -> Weekday {
        self.first_weekday
    }

    /// The short form with its numbers unpadded and the full year: "%Y년 %-m월 %-d일".
    fn spelled_short(&self) -> String {
        pure_rust_locales::locale_match!(self.locale => LC_TIME::D_FMT)
            .replace("%m", "%-m")
            .replace("%d", "%-d")
            .replace("%e", "%-d")
            .replace("%y", "%Y")
    }

    fn format(&self, day: NaiveDate, pattern: &str) -> String {
        day.format_localized(pattern, self.locale)
            .to_string()
            .trim()
            .to_string()
    }

    /// The form the field shows: "Mar 10, 2026".
    pub(crate) fn medium(&self, day: NaiveDate) -> String {
        match self.order {
            LeadingField::Month => self.format(day, "%b %-d, %Y"),
            LeadingField::Day => self.format(day, "%-d %b %Y"),
            LeadingField::Year => self.format(day, &self.spelled_short()),
        }
    }

    /// The name of a day, in full: "Tuesday, March 10, 2026".
    pub(crate) fn long(&self, day: NaiveDate) -> String {
        match self.order {
            LeadingField::Month => self.format(day, "%A, %B %-d, %Y"),
            LeadingField::Day => self.format(day, "%A %-d %B %Y"),
            LeadingField::Year => self.format(day, &format!("{} %A", self.spelled_short())),
        }
    }

    /// The month and year the calendar shows: "March 2026", "2026년 3월".
    pub(crate) fn month_year(&self, day: NaiveDate) -> String {
        if self.order == LeadingField::Year {
            // The short form up to the month and the word that follows it, where it has one
            // ("%Y년 %-m월"). A form of bare numbers ("%Y-%m-%d") has none, and takes the name.
            let short = self.spelled_short();
            if let Some(at) = short.find("%-m") {
                let rest = &short[at + 3..];
                let word = rest
                    .char_indices()
                    .take_while(|(_, c)| c.is_alphabetic())
                    .last()
                    .map(|(index, c)| index + c.len_utf8());
                if let Some(word) = word {
                    return self.format(day, &short[..at + 3 + word]);
                }
            }
            return self.format(day, "%Y %B");
        }
        self.format(day, "%B %Y")
    }

    /// The days of the week from the first, each with its initial and its full name. glibc
    /// has no narrow names, so the initial is the first letter of the short one.
    pub(crate) fn weekdays(&self) -> [(String, String); 7] {
        let short = pure_rust_locales::locale_match!(self.locale => LC_TIME::ABDAY);
        let long = pure_rust_locales::locale_match!(self.locale => LC_TIME::DAY);
        let mut day = self.first_weekday;
        std::array::from_fn(|_| {
            let index = day.num_days_from_sunday() as usize;
            day = day.succ();
            let initial = short[index].trim().chars().take(1).collect::<String>();
            (initial.to_uppercase(), long[index].to_string())
        })
    }
}

// ---------------------------------------------------------------- disabled

/// Marks an element's accessibility node disabled. GPUI has no setter for it, and GPUI Base
/// keeps its own wrapper to itself; this one adds no layout node, focus stop or node of its
/// own.
struct Disabled<E> {
    inner: E,
    disabled: bool,
}

fn a11y_disabled<E: Element>(inner: E, disabled: bool) -> Disabled<E> {
    Disabled { inner, disabled }
}

impl<E: Element> IntoElement for Disabled<E> {
    type Element = Self;

    fn into_element(self) -> Self {
        self
    }
}

impl<E: Element> Element for Disabled<E> {
    type RequestLayoutState = E::RequestLayoutState;
    type PrepaintState = E::PrepaintState;

    fn id(&self) -> Option<ElementId> {
        self.inner.id()
    }

    fn source_location(&self) -> Option<&'static std::panic::Location<'static>> {
        self.inner.source_location()
    }

    fn request_layout(
        &mut self,
        id: Option<&GlobalElementId>,
        inspector: Option<&InspectorElementId>,
        window: &mut Window,
        cx: &mut App,
    ) -> (LayoutId, Self::RequestLayoutState) {
        self.inner.request_layout(id, inspector, window, cx)
    }

    fn prepaint(
        &mut self,
        id: Option<&GlobalElementId>,
        inspector: Option<&InspectorElementId>,
        bounds: Bounds<Pixels>,
        layout: &mut Self::RequestLayoutState,
        window: &mut Window,
        cx: &mut App,
    ) -> Self::PrepaintState {
        self.inner
            .prepaint(id, inspector, bounds, layout, window, cx)
    }

    fn paint(
        &mut self,
        id: Option<&GlobalElementId>,
        inspector: Option<&InspectorElementId>,
        bounds: Bounds<Pixels>,
        layout: &mut Self::RequestLayoutState,
        prepaint: &mut Self::PrepaintState,
        window: &mut Window,
        cx: &mut App,
    ) {
        self.inner
            .paint(id, inspector, bounds, layout, prepaint, window, cx);
    }

    fn a11y_role(&self) -> Option<Role> {
        self.inner.a11y_role()
    }

    fn write_a11y_info(&self, node: &mut accesskit::Node) {
        self.inner.write_a11y_info(node);
        if self.disabled {
            node.set_disabled();
        }
    }

    fn a11y_synthetic_children(
        &mut self,
        prepaint: &mut Self::PrepaintState,
        builder: &mut gpui_kit::A11ySubtreeBuilder,
    ) {
        self.inner.a11y_synthetic_children(prepaint, builder);
    }
}

// ---------------------------------------------------------------- date picker

type DateHandler = Rc<dyn Fn(&NaiveDate, &mut Window, &mut App)>;

/// A field for choosing one day. Closed, it looks like a select: the same label, box,
/// description and error, with the chosen day in the locale's medium form. Pressed, or on
/// Enter or Space, it opens a calendar of one month under it, with the focus on the chosen
/// day, or on today when nothing is chosen. The arrow keys move a day or a week, Page Up and
/// Page Down a month (with Shift a year), Home and End to the first and the last day of the
/// month, never past `min` or `max`; Tab goes between the month buttons and the day and stays
/// in the calendar. Choosing a day calls `on_change` and closes it; Escape or a press outside
/// closes it too, and the focus goes back to the field.
///
/// Names, the medium form and the first day of the week follow the system's locale.
#[derive(IntoElement)]
pub struct DatePicker {
    id: ElementId,
    label: SharedString,
    value: Option<NaiveDate>,
    min: Option<NaiveDate>,
    max: Option<NaiveDate>,
    placeholder: Option<SharedString>,
    description: Option<SharedString>,
    error: Option<SharedString>,
    disabled: bool,
    previous_label: SharedString,
    next_label: SharedString,
    on_change: Option<DateHandler>,
    default_open: bool,
}

impl DatePicker {
    /// The label is drawn above the field and names it, and the calendar, for assistive
    /// technology.
    pub fn new(id: impl Into<ElementId>, label: impl Into<SharedString>) -> Self {
        Self {
            id: id.into(),
            label: label.into(),
            value: None,
            min: None,
            max: None,
            placeholder: None,
            description: None,
            error: None,
            disabled: false,
            previous_label: "Previous month".into(),
            next_label: "Next month".into(),
            on_change: None,
            default_open: false,
        }
    }

    /// The chosen day. Nothing is chosen unless this is set.
    pub fn value(mut self, value: NaiveDate) -> Self {
        self.value = Some(value);
        self
    }

    /// The first day that can be chosen.
    pub fn min(mut self, min: NaiveDate) -> Self {
        self.min = Some(min);
        self
    }

    /// The last day that can be chosen.
    pub fn max(mut self, max: NaiveDate) -> Self {
        self.max = Some(max);
        self
    }

    /// Shown in the field while nothing is chosen.
    pub fn placeholder(mut self, placeholder: impl Into<SharedString>) -> Self {
        self.placeholder = Some(placeholder.into());
        self
    }

    pub fn description(mut self, description: impl Into<SharedString>) -> Self {
        self.description = Some(description.into());
        self
    }

    /// Replaces the description while there is one.
    pub fn error(mut self, error: Option<impl Into<SharedString>>) -> Self {
        self.error = error.map(Into::into);
        self
    }

    pub fn disabled(mut self, disabled: bool) -> Self {
        self.disabled = disabled;
        self
    }

    /// Names the button that shows the month before, for assistive technology. English
    /// unless the app passes its own.
    pub fn previous_label(mut self, label: impl Into<SharedString>) -> Self {
        self.previous_label = label.into();
        self
    }

    /// Names the button that shows the month after.
    pub fn next_label(mut self, label: impl Into<SharedString>) -> Self {
        self.next_label = label.into();
        self
    }

    /// Called with the day that was chosen. The picker does not choose by itself: the handler
    /// decides. Takes a reference, like the handlers of GPUI Component, so `cx.listener` fits.
    pub fn on_change(
        mut self,
        handler: impl Fn(&NaiveDate, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_change = Some(Rc::new(handler));
        self
    }

    /// Whether the calendar is open when the picker first appears, for a screenshot of the
    /// design preview. After that it opens and closes itself.
    pub(crate) fn default_open(mut self, open: bool) -> Self {
        self.default_open = open;
        self
    }
}

/// The box of a date picker, which opens its calendar. The popover tells it through
/// `Selectable` whether the calendar is open, which it tells assistive technology.
#[derive(IntoElement)]
struct DateField {
    id: ElementId,
    label: SharedString,
    shown: Option<SharedString>,
    placeholder: Option<SharedString>,
    note: Option<SharedString>,
    invalid: bool,
    disabled: bool,
    open: bool,
}

impl Selectable for DateField {
    fn selected(mut self, selected: bool) -> Self {
        self.open = selected;
        self
    }

    fn is_selected(&self) -> bool {
        self.open
    }
}

impl RenderOnce for DateField {
    fn render(self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let c = palette(cx);
        let radius = px(tokens::RADIUS_MD);
        let focus = focus_handle(&self.id, window, cx);
        let focused = !self.disabled && focus.is_focused(window);
        let (text, text_color) = match self.shown {
            Some(shown) => (shown, c.field_text),
            None => (self.placeholder.unwrap_or_default(), c.field_placeholder),
        };
        // Named by what it shows and then the label, as React Aria names its trigger.
        let name: SharedString = if text.is_empty() {
            self.label.clone()
        } else {
            format!("{text}, {}", self.label).into()
        };
        let frame = field_frame(self.invalid, self.disabled, focused, radius, window, cx)
            .id(self.id)
            // A button that opens a dialog, and says whether it is open.
            .role(Role::Button)
            .aria_label(name)
            .aria_expanded(self.open)
            .when_some(self.note, |frame, note| frame.aria_description(note))
            .when(!self.disabled, |frame| {
                // Unlike a select's box, this one takes the focus on a press, before the
                // calendar takes it, so the popover gives it back here when the calendar closes
                // however it was opened, as on the web.
                frame.track_focus(&focus.tab_index(0).tab_stop(true))
            })
            .items_center()
            .gap(px(tokens::SPACE_2))
            .h(ControlSize::Md.height())
            .px(px(tokens::SPACE_3))
            .child(
                div()
                    .flex_1()
                    .min_w_0()
                    .truncate()
                    .typography(tokens::TYPOGRAPHY_BODY)
                    .text_color(color(text_color))
                    .child(text),
            )
            .child(
                icon(tokens::Icon::Calendar, IconSize::Sm).text_color(color(c.field_placeholder)),
            );
        field_outline(self.invalid, radius, c, a11y_disabled(frame, self.disabled)).w_full()
    }
}

/// What a calendar keeps while it is open: the day with the focus, and a focus handle for
/// each day it shows. The handles are made outside the calendar, where the field is built, so
/// the popover can give the focus to the day it opens on.
#[derive(Default)]
struct CalendarState {
    /// Unset until a key or a month button moves away from the day the calendar opened on.
    active: Cell<Option<NaiveDate>>,
    days: RefCell<HashMap<NaiveDate, FocusHandle>>,
}

impl CalendarState {
    fn handle(&self, day: NaiveDate, cx: &mut App) -> FocusHandle {
        self.days
            .borrow_mut()
            .entry(day)
            .or_insert_with(|| cx.focus_handle())
            .clone()
    }

    /// Keeps the handles of the month of `shown` and of the day the calendar opens on, and
    /// drops the rest.
    fn keep(&self, shown: NaiveDate, opening: NaiveDate, cx: &mut App) {
        let (first, last) = (first_of_month(shown), last_of_month(shown));
        self.days
            .borrow_mut()
            .retain(|day, _| (first..=last).contains(day) || *day == opening);
        for day in first.iter_days().take_while(|day| *day <= last) {
            self.handle(day, cx);
        }
        self.handle(opening, cx);
    }

    /// Moves the focus to `day`, and the calendar to its month.
    fn focus(&self, day: NaiveDate, window: &mut Window, cx: &mut App) {
        let handle = self.handle(day, cx);
        self.active.set(Some(day));
        handle.focus(window, cx);
        window.refresh();
    }
}

/// What the calendar is drawn from, shared with the popover, which draws it whenever it draws.
struct Calendar {
    id: ElementId,
    label: SharedString,
    value: Option<NaiveDate>,
    min: Option<NaiveDate>,
    max: Option<NaiveDate>,
    today: NaiveDate,
    opening: NaiveDate,
    locale: CalendarLocale,
    previous_label: SharedString,
    next_label: SharedString,
    on_change: Option<DateHandler>,
    state: Rc<CalendarState>,
}

impl Calendar {
    fn active(&self) -> NaiveDate {
        self.state.active.get().unwrap_or(self.opening)
    }

    /// Calls `on_change` with `day` and closes the calendar, which gives the focus back to
    /// the field.
    fn choose(
        &self,
        day: NaiveDate,
        popover: &Entity<PopoverState>,
        window: &mut Window,
        cx: &mut App,
    ) {
        if clamp(day, self.min, self.max) != day {
            return;
        }
        if let Some(on_change) = &self.on_change {
            on_change(&day, window, cx);
        }
        popover.update(cx, |popover, cx| popover.dismiss(window, cx));
    }

    fn render(
        self: &Rc<Self>,
        popover: Entity<PopoverState>,
        window: &mut Window,
        cx: &mut App,
    ) -> AnyElement {
        let c = palette(cx);
        let active = self.active();
        let month = first_of_month(active);
        let heading = self.locale.month_year(active);
        let earlier = self.min.is_some_and(|min| month <= min);
        let later = self.max.is_some_and(|max| last_of_month(active) >= max);
        let shift = |months: i32| {
            let calendar = self.clone();
            move |_: &gpui_kit::ClickEvent, window: &mut Window, _: &mut App| {
                let to = clamp(
                    add_months(calendar.active(), months),
                    calendar.min,
                    calendar.max,
                );
                calendar.state.active.set(Some(to));
                window.refresh();
            }
        };
        // Small ghost buttons at the ends, each centered over its column of days, and the
        // month between them, as the web libraries lay it out.
        let header = div()
            .flex()
            .items_center()
            .justify_between()
            .px(px((tokens::POINTER.calendar_day
                - tokens::POINTER.control_sm)
                / 2.0))
            .child(
                icon_button(
                    (self.id.clone(), "previous"),
                    tokens::Icon::ChevronLeft,
                    self.previous_label.clone(),
                    cx,
                )
                .control_size(ControlSize::Sm)
                .disabled(earlier)
                .on_click(shift(-1)),
            )
            .child(
                div()
                    .id((self.id.clone(), "heading"))
                    .role(Role::Heading)
                    .aria_label(heading.clone())
                    .typography(tokens::TYPOGRAPHY_BODY_STRONG)
                    .text_color(color(c.date_picker_heading))
                    .child(heading.clone()),
            )
            .child(
                icon_button(
                    (self.id.clone(), "next"),
                    tokens::Icon::ChevronRight,
                    self.next_label.clone(),
                    cx,
                )
                .control_size(ControlSize::Sm)
                .disabled(later)
                .on_click(shift(1)),
            );

        let side = px(tokens::POINTER.calendar_day);
        let weekdays = div()
            .id((self.id.clone(), "weekdays"))
            .role(Role::Row)
            .flex()
            .children(self.locale.weekdays().into_iter().enumerate().map(
                |(column, (initial, name))| {
                    div()
                        .id((self.id.clone(), format!("weekday-{column}")))
                        .role(Role::ColumnHeader)
                        .aria_label(name)
                        .flex()
                        .justify_center()
                        .w(side)
                        .py(px(tokens::SPACE_1))
                        .typography(tokens::TYPOGRAPHY_FOOTNOTE)
                        .text_color(color(c.date_picker_weekday))
                        .child(initial)
                },
            ));
        let weeks = month_weeks(month.year(), month.month(), self.locale.first_weekday());
        let rows = weeks.iter().enumerate().map(|(row, week)| {
            div()
                .id((self.id.clone(), format!("week-{row}")))
                .role(Role::Row)
                .flex()
                .children(week.iter().enumerate().map(|(column, day)| match day {
                    Some(day) => self.day(*day, active, row, column, &popover, window, cx),
                    None => div().flex_none().size(side).into_any_element(),
                }))
        });
        let calendar = self.clone();
        let grid = div()
            .id((self.id.clone(), "grid"))
            .role(Role::Grid)
            .aria_label(heading)
            .aria_row_count(weeks.len() + 1)
            .aria_column_count(7)
            .flex()
            .flex_col()
            .child(weekdays)
            .children(rows)
            .on_key_down(move |event: &KeyDownEvent, window, cx| {
                let modifiers = &event.keystroke.modifiers;
                if modifiers.control || modifiers.alt || modifiers.platform || modifiers.function {
                    return;
                }
                // GPUI lays out left to right only, so Left is always the day before.
                let key = match (event.keystroke.key.as_str(), modifiers.shift) {
                    ("left", false) => CalendarKey::Left,
                    ("right", false) => CalendarKey::Right,
                    ("up", false) => CalendarKey::Up,
                    ("down", false) => CalendarKey::Down,
                    ("pageup", false) => CalendarKey::PageUp,
                    ("pagedown", false) => CalendarKey::PageDown,
                    ("pageup", true) => CalendarKey::ShiftPageUp,
                    ("pagedown", true) => CalendarKey::ShiftPageDown,
                    ("home", false) => CalendarKey::Home,
                    ("end", false) => CalendarKey::End,
                    _ => return,
                };
                cx.stop_propagation();
                let to = move_focus(calendar.active(), key, calendar.min, calendar.max);
                calendar.state.focus(to, window, cx);
            });

        let trap = focus_handle(&(self.id.clone(), "trap").into(), window, cx);
        div()
            .id((self.id.clone(), "calendar"))
            // GPUI Base makes the popover's content a dialog, which it does not let us name;
            // this names what is inside it.
            .role(Role::Group)
            .aria_label(self.label.clone())
            .flex()
            .flex_col()
            .gap(px(tokens::SPACE_2))
            .p(px(tokens::SPACE_3))
            .rounded(px(tokens::RADIUS_LG))
            .border(px(tokens::BORDER_WIDTH_THIN))
            .border_color(color(c.border_default))
            .bg(color(c.date_picker_background))
            .shadow(shadow(tokens::SHADOW_RAISED))
            .child(header)
            .child(grid)
            // The popover lets Tab leave for the page behind, which would leave the calendar
            // open with nothing in it focused.
            .focus_trap((self.id.clone(), "trap"), &trap)
            .into_any_element()
    }

    #[allow(clippy::too_many_arguments)]
    fn day(
        self: &Rc<Self>,
        day: NaiveDate,
        active: NaiveDate,
        row: usize,
        column: usize,
        popover: &Entity<PopoverState>,
        window: &mut Window,
        cx: &mut App,
    ) -> AnyElement {
        let c = palette(cx);
        let enabled = clamp(day, self.min, self.max) == day;
        let selected = self.value == Some(day);
        let today = day == self.today;
        let focus = self.state.handle(day, cx);
        let focused = enabled && focus.is_focused(window);
        let (text, rest, hover, pressed) = if !enabled {
            (c.date_picker_disabled_text, None, None, None)
        } else if selected {
            (
                c.date_picker_selected_text,
                Some(c.date_picker_selected_background),
                Some(c.date_picker_selected_background_hover),
                Some(c.date_picker_selected_background_pressed),
            )
        } else {
            (
                if today {
                    c.date_picker_today_text
                } else {
                    c.date_picker_day_text
                },
                None,
                Some(c.date_picker_day_background_hover),
                Some(c.date_picker_day_background_pressed),
            )
        };
        let group: SharedString = format!("day-{day}").into();
        let inset = px(tokens::SPACE_0_5);
        let circle = div()
            .id("circle")
            .size_full()
            .flex()
            .items_center()
            .justify_center()
            .rounded(px(tokens::RADIUS_FULL))
            // Today is told by a ring and bolder figures, so not by color alone.
            .typography(if today {
                tokens::TYPOGRAPHY_BODY_STRONG
            } else {
                tokens::TYPOGRAPHY_BODY
            })
            .text_color(color(text))
            .when(today && !selected, |circle| {
                circle
                    .border(px(tokens::BORDER_WIDTH_THIN))
                    .border_color(color(c.date_picker_today_border))
            })
            .when_some(rest, |circle, fill| circle.bg(color(fill)))
            // The keyboard's place in the calendar looks like the pointer's.
            .when_some(hover.filter(|_| focused), |circle, fill| {
                circle.bg(color(fill))
            })
            .when_some(hover, |circle, fill| {
                circle.group_hover(group.clone(), move |style| style.bg(color(fill)))
            })
            .when_some(pressed, |circle, fill| {
                circle.group_active(group.clone(), move |style| style.bg(color(fill)))
            })
            .when(focused, |circle| circle.focus_ring_style(window, cx))
            .child(day.day().to_string());
        let cell = div()
            .id((self.id.clone(), day.to_string()))
            .group(group)
            .role(Role::GridCell)
            .aria_label(self.locale.long(day))
            .aria_selected(selected)
            .aria_row_index(row + 2)
            .aria_column_index(column + 1)
            .flex_none()
            .size(px(tokens::POINTER.calendar_day))
            .p(inset)
            .child(circle)
            .when(enabled, |cell| {
                let calendar = self.clone();
                let popover = popover.clone();
                cell.track_focus(&focus.tab_index(0).tab_stop(day == active))
                    // A press chooses and closes, so the day does not take the focus first.
                    .on_mouse_down(MouseButton::Left, |_, window, _| window.prevent_default())
                    .on_click(move |_, window, cx| calendar.choose(day, &popover, window, cx))
            });
        a11y_disabled(cell, !enabled).into_any_element()
    }
}

impl RenderOnce for DatePicker {
    fn render(self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let c = palette(cx);
        let locale = CalendarLocale::system();
        let today = Local::now().date_naive();
        let field = DateField {
            id: (self.id.clone(), "field").into(),
            label: self.label.clone(),
            shown: self.value.map(|day| locale.medium(day).into()),
            placeholder: self.placeholder,
            note: self.error.clone().or(self.description.clone()),
            invalid: self.error.is_some(),
            disabled: self.disabled,
            open: false,
        };
        let control = if self.disabled {
            field.into_any_element()
        } else {
            let state = window
                .use_keyed_state((self.id.clone(), "calendar"), cx, |_, _| {
                    Rc::new(CalendarState::default())
                })
                .read(cx)
                .clone();
            let opening = initial_month(self.value, today, self.min, self.max);
            state.keep(state.active.get().unwrap_or(opening), opening, cx);
            let focus = state.handle(opening, cx);
            let calendar = Rc::new(Calendar {
                id: self.id.clone(),
                label: self.label.clone(),
                value: self.value,
                min: self.min,
                max: self.max,
                today,
                opening,
                locale,
                previous_label: self.previous_label,
                next_label: self.next_label,
                on_change: self.on_change,
                state: state.clone(),
            });
            Popover::new(self.id.clone())
                // The surface is drawn by the calendar, from its own tokens.
                .appearance(false)
                .anchor(Anchor::TopLeft)
                .offset(px(tokens::SPACE_1))
                .default_open(self.default_open)
                .trigger_style(StyleRefinement::default().w_full())
                .track_focus(&focus)
                // Each opening starts again from the chosen day.
                .on_open_change(move |_, _, _| state.active.set(None))
                .trigger(field)
                .content(move |_, window, cx| {
                    let popover = cx.entity();
                    calendar.render(popover, window, cx)
                })
                .into_any_element()
        };
        div()
            .flex()
            .flex_col()
            .gap(px(tokens::SPACE_1))
            .w_full()
            .child(field_label(self.label, self.disabled, c))
            .child(control)
            .children(field_note(self.error, self.description, c))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn date(text: &str) -> NaiveDate {
        text.parse().unwrap()
    }

    // The table every client that draws its own calendar tests its keys with, copied from the
    // plan (section 8.2) so the keyboard model cannot drift from the web's:
    //
    // | From | Key | min..max | To | On the web |
    // | --- | --- | --- | --- | --- |
    // | 2026-03-10 | Right / Left / Down / Up | 03-05..04-20 | 03-11 / 03-09 / 03-17 / 03-03 → **03-05** (clamped) | checks 2 and 6, both libraries |
    // | 2026-03-10 | Page Down / Page Up | 03-05..04-20 | 04-10 / 03-05 (clamped) | checks 2 and 6 |
    // | 2026-04-05 | Page Down | 03-05..04-20 | 04-20 (clamped) | check 6 |
    // | 2026-04-20 | Shift+Page Up | 03-05..04-20 | 03-05 (clamped) | check 6 |
    // | 2026-03-10 | Shift+Page Down | none | 2027-03-10 | not checked |
    // | 2026-01-31 | Page Down | none | 2026-02-28 (the day held to the month's last, as `@internationalized/date` adds months) | not checked |
    // | 2024-02-29 | Shift+Page Down | none | 2025-02-28 | not checked |
    // | 2026-03-10 | Home / End | 03-05..04-20 | 03-05 / 03-31 | check 2 |
    // | 2026-04-15 | End | 03-05..04-20 | 04-20 | not checked |
    // | nothing chosen, today 2026-11-14 | open | 03-05..04-20 | focus 04-20, month April 2026 (today held into the range) | not checked; add to D2 |
    // | March 2026, first weekday Sunday / Monday | weeks | | first row starts at column 0 / 6 (March 1 is a Sunday) | Sunday by the en-US locale |

    fn range() -> (Option<NaiveDate>, Option<NaiveDate>) {
        (Some(date("2026-03-05")), Some(date("2026-04-20")))
    }

    fn moved(
        from: &str,
        key: CalendarKey,
        (min, max): (Option<NaiveDate>, Option<NaiveDate>),
    ) -> NaiveDate {
        move_focus(date(from), key, min, max)
    }

    #[test]
    fn arrows_move_a_day_or_a_week_and_stop_at_min() {
        assert_eq!(
            moved("2026-03-10", CalendarKey::Right, range()),
            date("2026-03-11")
        );
        assert_eq!(
            moved("2026-03-10", CalendarKey::Left, range()),
            date("2026-03-09")
        );
        assert_eq!(
            moved("2026-03-10", CalendarKey::Down, range()),
            date("2026-03-17")
        );
        assert_eq!(
            moved("2026-03-10", CalendarKey::Up, range()),
            date("2026-03-05")
        );
    }

    #[test]
    fn page_keys_move_a_month_and_stop_at_min() {
        assert_eq!(
            moved("2026-03-10", CalendarKey::PageDown, range()),
            date("2026-04-10")
        );
        assert_eq!(
            moved("2026-03-10", CalendarKey::PageUp, range()),
            date("2026-03-05")
        );
    }

    #[test]
    fn page_down_stops_at_max() {
        assert_eq!(
            moved("2026-04-05", CalendarKey::PageDown, range()),
            date("2026-04-20")
        );
    }

    #[test]
    fn shift_page_up_stops_at_min() {
        assert_eq!(
            moved("2026-04-20", CalendarKey::ShiftPageUp, range()),
            date("2026-03-05")
        );
    }

    #[test]
    fn shift_page_down_moves_a_year() {
        assert_eq!(
            moved("2026-03-10", CalendarKey::ShiftPageDown, (None, None)),
            date("2027-03-10")
        );
    }

    #[test]
    fn a_month_on_holds_the_day_to_the_shorter_months_last() {
        assert_eq!(
            moved("2026-01-31", CalendarKey::PageDown, (None, None)),
            date("2026-02-28")
        );
        assert_eq!(
            moved("2024-02-29", CalendarKey::ShiftPageDown, (None, None)),
            date("2025-02-28")
        );
    }

    #[test]
    fn home_and_end_go_to_the_ends_of_the_month_within_min_and_max() {
        assert_eq!(
            moved("2026-03-10", CalendarKey::Home, range()),
            date("2026-03-05")
        );
        assert_eq!(
            moved("2026-03-10", CalendarKey::End, range()),
            date("2026-03-31")
        );
        assert_eq!(
            moved("2026-04-15", CalendarKey::End, range()),
            date("2026-04-20")
        );
    }

    #[test]
    fn with_nothing_chosen_it_opens_on_today_held_into_the_range() {
        let (min, max) = range();
        let opening = initial_month(None, date("2026-11-14"), min, max);
        assert_eq!(opening, date("2026-04-20"));
        assert_eq!((opening.year(), opening.month()), (2026, 4));
    }

    #[test]
    fn the_first_week_starts_on_the_first_weekday() {
        let sunday = month_weeks(2026, 3, Weekday::Sun);
        assert_eq!(sunday[0][0], Some(date("2026-03-01")));
        let monday = month_weeks(2026, 3, Weekday::Mon);
        assert_eq!(monday[0][6], Some(date("2026-03-01")));
        assert!(monday[0][..6].iter().all(Option::is_none));
    }

    #[test]
    fn every_day_of_the_month_is_in_its_weeks_once() {
        let days: Vec<_> = month_weeks(2026, 3, Weekday::Mon)
            .into_iter()
            .flatten()
            .flatten()
            .collect();
        assert_eq!(days.len(), 31);
        assert_eq!(days.first(), Some(&date("2026-03-01")));
        assert_eq!(days.last(), Some(&date("2026-03-31")));
    }

    #[test]
    fn clamp_holds_a_day_inside_the_range() {
        let (min, max) = range();
        assert_eq!(clamp(date("2026-01-01"), min, max), date("2026-03-05"));
        assert_eq!(clamp(date("2026-12-01"), min, max), date("2026-04-20"));
        assert_eq!(clamp(date("2026-03-10"), min, max), date("2026-03-10"));
        assert_eq!(clamp(date("1900-01-01"), None, None), date("1900-01-01"));
    }

    #[test]
    fn locales_name_the_day_and_start_the_week() {
        let us = CalendarLocale::from_tag("en-US");
        let day = date("2026-03-10");
        assert_eq!(us.medium(day), "Mar 10, 2026");
        assert_eq!(us.long(day), "Tuesday, March 10, 2026");
        assert_eq!(us.month_year(day), "March 2026");
        assert_eq!(us.first_weekday(), Weekday::Sun);
        assert_eq!(us.weekdays()[0], ("S".to_string(), "Sunday".to_string()));

        let korean = CalendarLocale::from_tag("ko-KR");
        assert_eq!(korean.medium(day), "2026년 3월 10일");
        assert_eq!(korean.month_year(day), "2026년 3월");
        assert_eq!(korean.long(day), "2026년 3월 10일 화요일");

        let british = CalendarLocale::from_tag("en_GB.UTF-8");
        assert_eq!(british.medium(day), "10 Mar 2026");
        assert_eq!(british.first_weekday(), Weekday::Mon);
        assert_eq!(british.weekdays()[0].1, "Monday");
    }

    #[test]
    fn an_unknown_region_falls_back_to_the_language_and_then_to_sunday() {
        // This Mac's own locale: English in Korea, which glibc has no table for.
        let english_in_korea = CalendarLocale::from_tag("en-KR");
        assert_eq!(english_in_korea.medium(date("2026-03-10")), "Mar 10, 2026");
        assert_eq!(english_in_korea.first_weekday(), Weekday::Sun);

        assert_eq!(
            CalendarLocale::from_tag("fr-KR").first_weekday(),
            Weekday::Mon
        );
        assert_eq!(
            CalendarLocale::from_tag("zh-Hans-CN").month_year(date("2026-03-10")),
            "2026年3月"
        );

        let unknown = CalendarLocale::from_tag("xx");
        assert_eq!(unknown.first_weekday(), Weekday::Sun);
        assert_eq!(unknown.medium(date("2026-03-10")), "Mar 10, 2026");
        assert_eq!(CalendarLocale::from_tag("").first_weekday(), Weekday::Sun);
    }
}
