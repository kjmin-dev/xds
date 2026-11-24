//! The date range picker: a field that opens the date picker's calendar, where the first day
//! pressed starts a range and the second ends it, as booking apps choose a stay.
//!
//! The field, the popover, the keys and the grid are the date picker's (see `date_picker.rs`).
//! What is added here is what a range needs: which press starts and which ends it, how each
//! day is marked by the band between the ends, how many months fit side by side, and the
//! range as the field shows it. Those are plain functions of dates, tested against the same
//! tables as the other clients.

use std::rc::Rc;

use acme_tokens as tokens;
use chrono::{Datelike as _, NaiveDate, Weekday};
use gpui_kit::{
    AnyElement, App, ElementId, InteractiveElement as _, IntoElement, ParentElement as _,
    Refineable as _, RenderOnce, Role, SharedString, StatefulInteractiveElement as _,
    StyleRefinement, Styled, Window, div, px,
};

use crate::date_picker::{CalendarField, CalendarLocale, Choosing, NodeFlags, a11y_flags};
use crate::theme::{TypographyExt as _, color};

// ---------------------------------------------------------------- ranges

/// A range of days, from `start` to `end`, both included. With the same day at both ends it
/// is one day long.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct DateRange {
    pub start: NaiveDate,
    pub end: NaiveDate,
}

impl DateRange {
    /// # Panics
    ///
    /// If `end` is before `start`.
    pub fn new(start: NaiveDate, end: NaiveDate) -> Self {
        assert!(start <= end, "a range ends on or after its start");
        Self { start, end }
    }
}

pub(crate) type RangeHandler = Rc<dyn Fn(&DateRange, &mut Window, &mut App)>;

/// What a press on a day does to the range being chosen.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum RangeChoice {
    /// The day becomes the start of a new range, and the end is chosen next.
    Start,
    /// The day ends the range that has its start.
    End,
    /// Nothing: the length does not allow the day as the end.
    None,
}

/// What a press on `day` does while the calendar shows `draft`: nothing chosen or a whole range
/// starts a new one; with a start alone, a day before it starts again from there, a day the
/// length allows ends the range, and any other day does nothing. The length counts the days
/// from the start to the end, which are the nights of a stay.
pub(crate) fn range_day_choice(
    draft: &[NaiveDate],
    day: NaiveDate,
    min_length: u32,
    max_length: Option<u32>,
) -> RangeChoice {
    let [start] = draft else {
        return RangeChoice::Start;
    };
    let length = (day - *start).num_days();
    if length < 0 {
        RangeChoice::Start
    } else if length < i64::from(min_length)
        || max_length.is_some_and(|max| length > i64::from(max))
    {
        RangeChoice::None
    } else {
        RangeChoice::End
    }
}

/// The end the range would have if `day` were pressed now, shown while the pointer is over
/// `day` or the keyboard's focus is on it, or None when the press would not end a range.
pub(crate) fn preview_end(
    draft: &[NaiveDate],
    day: NaiveDate,
    min_length: u32,
    max_length: Option<u32>,
) -> Option<NaiveDate> {
    let [start] = draft else {
        return None;
    };
    (day > *start && range_day_choice(draft, day, min_length, max_length) == RangeChoice::End)
        .then_some(day)
}

/// How one side of a day's piece of the band ends.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum BandEdge {
    /// At the middle of the cell, under an end's circle: the band starts or stops there.
    Middle,
    /// Square at the cell's edge, where the band goes on into the next cell, or stops at the
    /// first or the last day of a month in the middle of a week.
    Flat,
    /// Rounded at the cell's edge, where a week's row ends the band.
    Round,
}

/// A day's piece of the band, from its leading side to its trailing side.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct Band {
    pub(crate) leading: BandEdge,
    pub(crate) trailing: BandEdge,
}

/// How a day is drawn in the calendar.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub(crate) struct DayMarks {
    /// The start of the range, or the chosen day of a date picker: a filled circle.
    pub(crate) start: bool,
    /// The end of the range, or the end the preview would make: a filled circle too.
    pub(crate) end: bool,
    /// Its piece of the band, between two ends that are not the same day. An end at the edge
    /// of its row has none.
    pub(crate) band: Option<Band>,
    /// Part of the preview, not of a range that was chosen.
    pub(crate) preview: bool,
}

impl DayMarks {
    pub(crate) fn chosen(chosen: bool) -> Self {
        Self {
            start: chosen,
            end: chosen,
            ..Self::default()
        }
    }

    /// Whether the day is selected for assistive technology: every day of the range, and the
    /// start alone, but not a preview.
    pub(crate) const fn selected(self) -> bool {
        (self.start || self.end || self.band.is_some()) && !self.preview
    }
}

/// How `day` is marked while the calendar shows `draft` (a whole range, or a start alone with
/// `preview` as the end it would have). The band runs from the middle of the start to the
/// middle of the end, is rounded where a week's row ends it, and is square where it goes on.
pub(crate) fn day_marks(
    day: NaiveDate,
    draft: &[NaiveDate],
    preview: Option<NaiveDate>,
    first_weekday: Weekday,
) -> DayMarks {
    let (start, end, previewing) = match *draft {
        [start, end] => (start, Some(end), false),
        [start] => match preview {
            Some(preview) if preview > start => (start, Some(preview), true),
            _ => (start, None, false),
        },
        _ => return DayMarks::default(),
    };
    let last = end.unwrap_or(start);
    if day < start || day > last {
        return DayMarks::default();
    }
    let column =
        (day.weekday().num_days_from_monday() + 7 - first_weekday.num_days_from_monday()) % 7;
    let edge = |row_ends: bool| {
        if row_ends {
            BandEdge::Round
        } else {
            BandEdge::Flat
        }
    };
    // An end at the edge of its row has nothing of the band beside it in that row.
    let alone = (day == start && column == 6) || (day == last && column == 0);
    let band = (start < last && !alone).then(|| Band {
        leading: if day == start {
            BandEdge::Middle
        } else {
            edge(column == 0)
        },
        trailing: if day == last {
            BandEdge::Middle
        } else {
            edge(column == 6)
        },
    });
    DayMarks {
        start: day == start,
        end: end == Some(day),
        band,
        preview: previewing && day > start,
    }
}

/// The narrowest window, in pixels, that shows two months side by side; the web libraries
/// switch at the same width.
const TWO_MONTHS_FROM: f32 = 640.0;

/// How many months the calendar shows in a window `width` pixels wide.
pub(crate) fn months_for_width(width: f32) -> u32 {
    if width >= TWO_MONTHS_FROM { 2 } else { 1 }
}

/// The range as the field shows it: both days in the medium form, joined by an en dash. chrono
/// has no formatter for an interval, which would leave out what the two days share, as the
/// web's `formatRange` does ("Mar 10 – 14, 2026").
pub(crate) fn format_range(range: DateRange, locale: CalendarLocale) -> String {
    format!(
        "{} \u{2013} {}",
        locale.medium(range.start),
        locale.medium(range.end)
    )
}

// ---------------------------------------------------------------- the calendar's part

/// What the calendar needs to choose a range.
pub(crate) struct RangeChoosing {
    pub(crate) value: Option<DateRange>,
    pub(crate) min_length: u32,
    pub(crate) max_length: Option<u32>,
    pub(crate) start_label: SharedString,
    pub(crate) end_label: SharedString,
    pub(crate) on_change: Option<RangeHandler>,
}

impl RangeChoosing {
    /// The range that was given, as the days the calendar marks.
    pub(crate) fn committed(&self) -> Vec<NaiveDate> {
        self.value
            .map_or_else(Vec::new, |range| vec![range.start, range.end])
    }

    pub(crate) fn preview(&self, draft: &[NaiveDate], day: NaiveDate) -> Option<NaiveDate> {
        preview_end(draft, day, self.min_length, self.max_length)
    }

    /// A day's name for assistive technology: its long form, after the name of the end it is.
    pub(crate) fn day_name(&self, marks: DayMarks, long: &str) -> SharedString {
        let mut name = String::new();
        if marks.start {
            name.push_str(&self.start_label);
            name.push_str(", ");
        }
        if marks.end && !marks.preview {
            name.push_str(&self.end_label);
            name.push_str(", ");
        }
        name.push_str(long);
        name.into()
    }

    /// The two ends above the months, "Check-in: Mar 10, 2026" and "Check-out: –" until the end
    /// is chosen, read out when they change.
    pub(crate) fn summary(
        &self,
        id: &ElementId,
        draft: &[NaiveDate],
        locale: CalendarLocale,
        t: &tokens::Theme,
        c: &tokens::Colors,
    ) -> AnyElement {
        let shown = |day: Option<&NaiveDate>| {
            day.map_or_else(|| "\u{2013}".to_owned(), |day| locale.medium(*day))
        };
        let start = format!("{}: {}", self.start_label, shown(draft.first()));
        let end = format!("{}: {}", self.end_label, shown(draft.get(1)));
        let summary = div()
            .id((id.clone(), "summary"))
            .role(Role::Status)
            .aria_label(format!("{start}, {end}"))
            .flex()
            .justify_between()
            .gap(px(t.space.s3))
            .typography(t.typography.footnote)
            .text_color(color(c.date_picker_weekday))
            .child(start)
            .child(end);
        a11y_flags(
            summary,
            NodeFlags {
                polite: true,
                ..NodeFlags::default()
            },
        )
        .into_any_element()
    }
}

// ---------------------------------------------------------------- date range picker

/// A field for choosing a range of days, a start and an end, as for a stay or a trip. Closed,
/// it looks like a [`DatePicker`](crate::DatePicker) and shows both days. Pressed, or on Enter
/// or Space, it opens the calendar under it on the start, or on today while nothing is chosen:
/// two months side by side where the window is at least 640 pixels wide, one otherwise.
///
/// The first day pressed starts the range, and the second ends it if the length allows,
/// which calls `on_change` and closes the calendar. A day before the start starts again from
/// there; days the length does not allow as the end cannot be pressed. Until the end is
/// pressed, the band runs from the start to the day under the pointer or with the focus.
/// The keys are the date picker's; Enter or Space on a day presses it, and on the start moves
/// the focus to the next day. Escape or a press outside closes the calendar and drops a start
/// without an end, and the focus goes back to the field.
#[derive(IntoElement)]
pub struct DateRangePicker {
    style: StyleRefinement,
    id: ElementId,
    label: SharedString,
    value: Option<DateRange>,
    min: Option<NaiveDate>,
    max: Option<NaiveDate>,
    min_length: u32,
    max_length: Option<u32>,
    placeholder: Option<SharedString>,
    description: Option<SharedString>,
    error: Option<SharedString>,
    disabled: bool,
    start_label: SharedString,
    end_label: SharedString,
    previous_label: SharedString,
    next_label: SharedString,
    on_change: Option<RangeHandler>,
    default_open: bool,
}

impl DateRangePicker {
    /// The label is drawn above the field and names it, and the calendar, for assistive
    /// technology.
    pub fn new(id: impl Into<ElementId>, label: impl Into<SharedString>) -> Self {
        Self {
            style: StyleRefinement::default(),
            id: id.into(),
            label: label.into(),
            value: None,
            min: None,
            max: None,
            min_length: 0,
            max_length: None,
            placeholder: None,
            description: None,
            error: None,
            disabled: false,
            start_label: "Start".into(),
            end_label: "End".into(),
            previous_label: "Previous month".into(),
            next_label: "Next month".into(),
            on_change: None,
            default_open: false,
        }
    }

    /// The chosen range. Nothing is chosen unless this is set.
    pub const fn value(mut self, value: DateRange) -> Self {
        self.value = Some(value);
        self
    }

    /// The first day that can be chosen.
    pub const fn min(mut self, min: NaiveDate) -> Self {
        self.min = Some(min);
        self
    }

    /// The last day that can be chosen.
    pub const fn max(mut self, max: NaiveDate) -> Self {
        self.max = Some(max);
        self
    }

    /// The fewest days the end can be after the start: 1 for a stay of at least one night.
    /// With 0, the default, the start can be the end too.
    pub const fn min_length(mut self, days: u32) -> Self {
        self.min_length = days;
        self
    }

    /// The most days the end can be after the start. There is no limit unless this is set.
    pub const fn max_length(mut self, days: u32) -> Self {
        self.max_length = Some(days);
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

    pub const fn disabled(mut self, disabled: bool) -> Self {
        self.disabled = disabled;
        self
    }

    /// Names the first day, in the calendar's summary and for assistive technology: "Check-in".
    /// English unless the app passes its own.
    pub fn start_label(mut self, label: impl Into<SharedString>) -> Self {
        self.start_label = label.into();
        self
    }

    /// Names the last day, as `start_label` names the first: "Check-out".
    pub fn end_label(mut self, label: impl Into<SharedString>) -> Self {
        self.end_label = label.into();
        self
    }

    /// Names the button that shows the months before, for assistive technology.
    pub fn previous_label(mut self, label: impl Into<SharedString>) -> Self {
        self.previous_label = label.into();
        self
    }

    /// Names the button that shows the months after.
    pub fn next_label(mut self, label: impl Into<SharedString>) -> Self {
        self.next_label = label.into();
        self
    }

    /// Called with the range once its end is pressed, and not before. The picker does not
    /// choose by itself: the handler decides.
    pub fn on_change(
        mut self,
        handler: impl Fn(&DateRange, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_change = Some(Rc::new(handler));
        self
    }

    /// Whether the calendar is open when the picker first appears, for a screenshot of the
    /// design preview. After that it opens and closes itself.
    pub(crate) const fn default_open(mut self, open: bool) -> Self {
        self.default_open = open;
        self
    }
}

impl DateRangePicker {
    fn draw(self, window: &mut Window, cx: &mut App) -> impl IntoElement + Styled {
        let locale = CalendarLocale::system();
        CalendarField {
            id: self.id,
            label: self.label,
            shown: self.value.map(|range| format_range(range, locale).into()),
            chosen: self.value.map(|range| range.start),
            min: self.min,
            max: self.max,
            placeholder: self.placeholder,
            description: self.description,
            error: self.error,
            disabled: self.disabled,
            previous_label: self.previous_label,
            next_label: self.next_label,
            default_open: self.default_open,
            choosing: Choosing::Range(RangeChoosing {
                value: self.value,
                min_length: self.min_length,
                max_length: self.max_length,
                start_label: self.start_label,
                end_label: self.end_label,
                on_change: self.on_change,
            }),
        }
        .render(window, cx)
    }
}

impl Styled for DateRangePicker {
    fn style(&mut self) -> &mut StyleRefinement {
        &mut self.style
    }
}

impl RenderOnce for DateRangePicker {
    fn render(mut self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let style = std::mem::take(&mut self.style);
        let mut root = self.draw(window, cx);
        root.style().refine(&style);
        root
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn date(text: &str) -> NaiveDate {
        text.parse().unwrap()
    }

    fn days(texts: &[&str]) -> Vec<NaiveDate> {
        texts.iter().map(|text| date(text)).collect()
    }

    // The table every client that draws its own range calendar tests its presses with, copied
    // from the plan (section 8.2) so that none of them drifts from the web's:
    //
    // | Draft | Day | minLength..maxLength | Choice | On the web |
    // | --- | --- | --- | --- | --- |
    // | none | 2026-03-20 | 2..14 | start | check 2 |
    // | 2026-03-10 – 2026-03-14 (whole) | 2026-03-10 | 2..14 | start | check 4 |
    // | 2026-03-20 | 2026-03-15 | 2..14 | start (before the start) | check 3 |
    // | 2026-03-10 | 2026-03-10 | 2..14 | none | check 4 |
    // | 2026-03-10 | 2026-03-11 | 2..14 | none (one night) | check 4 |
    // | 2026-03-10 | 2026-03-12 | 2..14 | end | check 4 |
    // | 2026-03-10 | 2026-03-24 | 2..14 | end (14 nights) | check 4 |
    // | 2026-03-10 | 2026-03-25 | 2..14 | none (15 nights) | check 4 |
    // | 2026-11-16 | 2026-11-16 | 0..none | end (one-day range) | check 5 |
    // | 2026-03-28 | 2026-04-03 | 2..14 | end, across months | check 10 |
    // | 2026-02-27 | 2026-03-01 | 1..none | end (2 nights over February's end) | not checked |
    // | 2024-12-30 | 2025-01-02 | 0..none | end (across a year) | not checked |
    /// A draft, a day, the length's bounds and what a press on the day does.
    type Row<'a> = (&'a [&'a str], &'a str, (u32, Option<u32>), RangeChoice);

    #[test]
    fn a_press_starts_ends_or_does_nothing_as_the_table_says() {
        let stay = (2, Some(14));
        let open = (0, None);
        let rows: [Row; 12] = [
            (&[], "2026-03-20", stay, RangeChoice::Start),
            (
                &["2026-03-10", "2026-03-14"],
                "2026-03-10",
                stay,
                RangeChoice::Start,
            ),
            (&["2026-03-20"], "2026-03-15", stay, RangeChoice::Start),
            (&["2026-03-10"], "2026-03-10", stay, RangeChoice::None),
            (&["2026-03-10"], "2026-03-11", stay, RangeChoice::None),
            (&["2026-03-10"], "2026-03-12", stay, RangeChoice::End),
            (&["2026-03-10"], "2026-03-24", stay, RangeChoice::End),
            (&["2026-03-10"], "2026-03-25", stay, RangeChoice::None),
            (&["2026-11-16"], "2026-11-16", open, RangeChoice::End),
            (&["2026-03-28"], "2026-04-03", stay, RangeChoice::End),
            (&["2026-02-27"], "2026-03-01", (1, None), RangeChoice::End),
            (&["2024-12-30"], "2025-01-02", open, RangeChoice::End),
        ];
        for (draft, day, (min_length, max_length), choice) in rows {
            assert_eq!(
                range_day_choice(&days(draft), date(day), min_length, max_length),
                choice,
                "draft {draft:?}, day {day}"
            );
        }
    }

    // And the marks table (band shape, first weekday Sunday):
    //
    // | Range | Day | Mark |
    // | --- | --- | --- |
    // | 03-10..03-14 | 03-10 | start (band on the trailing half) |
    // | 03-10..03-14 | 03-12 | middle |
    // | 03-10..03-14 | 03-14 | end (Saturday: band on the leading half, rounded) |
    // | 03-14..03-17 | 03-15 | middle, row start (Sunday: rounded leading edge) |
    // | 03-10..03-10 | 03-10 | single (no band) |
    // | 03-28..04-03 | 03-31 | middle, last day of the month (flat) |
    // | draft 03-10, preview 03-13 | 03-12 | preview middle |
    fn marks(range: &[&str], day: &str, preview: Option<&str>) -> DayMarks {
        day_marks(date(day), &days(range), preview.map(date), Weekday::Sun)
    }

    #[expect(
        clippy::unnecessary_wraps,
        reason = "written as the optional band the marks hold, so a test compares the two directly"
    )]
    const fn band(leading: BandEdge, trailing: BandEdge) -> Option<Band> {
        Some(Band { leading, trailing })
    }

    #[test]
    fn the_band_runs_from_the_middle_of_the_start_to_the_middle_of_the_end() {
        let range = ["2026-03-10", "2026-03-14"];
        assert_eq!(
            marks(&range, "2026-03-10", None),
            DayMarks {
                start: true,
                end: false,
                band: band(BandEdge::Middle, BandEdge::Flat),
                preview: false,
            }
        );
        assert_eq!(
            marks(&range, "2026-03-12", None),
            DayMarks {
                band: band(BandEdge::Flat, BandEdge::Flat),
                ..DayMarks::default()
            }
        );
        // A Saturday, at the end of its row: the end's circle covers where the band stops.
        assert_eq!(
            marks(&range, "2026-03-14", None),
            DayMarks {
                start: false,
                end: true,
                band: band(BandEdge::Flat, BandEdge::Middle),
                preview: false,
            }
        );
        assert_eq!(marks(&range, "2026-03-15", None), DayMarks::default());
        assert!(marks(&range, "2026-03-12", None).selected());
    }

    #[test]
    fn the_band_is_rounded_where_a_row_starts_or_ends_it() {
        let range = ["2026-03-14", "2026-03-17"];
        assert_eq!(
            marks(&range, "2026-03-15", None).band,
            band(BandEdge::Round, BandEdge::Flat)
        );
        // A range from Friday to Monday: the Saturday ends its row.
        assert_eq!(
            marks(&["2026-03-13", "2026-03-16"], "2026-03-14", None).band,
            band(BandEdge::Flat, BandEdge::Round)
        );
        // Weeks from Monday: the same Sunday ends its row instead.
        assert_eq!(
            day_marks(date("2026-03-15"), &days(&range), None, Weekday::Mon).band,
            band(BandEdge::Flat, BandEdge::Round)
        );
        // A start on a Saturday and an end on a Sunday have no band beside them in their row:
        // it starts on the next row, and ended on the row before.
        let weekend = ["2026-03-28", "2026-04-05"];
        assert_eq!(marks(&weekend, "2026-03-28", None).band, None);
        assert!(marks(&weekend, "2026-03-28", None).start);
        assert_eq!(marks(&weekend, "2026-04-05", None).band, None);
        assert_eq!(
            marks(&weekend, "2026-03-29", None).band,
            band(BandEdge::Round, BandEdge::Flat)
        );
    }

    #[test]
    fn a_one_day_range_has_no_band() {
        assert_eq!(
            marks(&["2026-03-10", "2026-03-10"], "2026-03-10", None),
            DayMarks {
                start: true,
                end: true,
                band: None,
                preview: false,
            }
        );
    }

    #[test]
    fn the_band_stays_square_at_the_end_of_a_month_in_the_middle_of_a_week() {
        // March 31 is a Tuesday: the band goes on in April's grid.
        assert_eq!(
            marks(&["2026-03-28", "2026-04-03"], "2026-03-31", None).band,
            band(BandEdge::Flat, BandEdge::Flat)
        );
        assert_eq!(
            marks(&["2026-03-28", "2026-04-03"], "2026-04-01", None).band,
            band(BandEdge::Flat, BandEdge::Flat)
        );
    }

    #[test]
    fn a_preview_marks_the_range_it_would_make_without_selecting_it() {
        let draft = ["2026-03-10"];
        let middle = marks(&draft, "2026-03-12", Some("2026-03-13"));
        assert_eq!(
            middle,
            DayMarks {
                band: band(BandEdge::Flat, BandEdge::Flat),
                preview: true,
                ..DayMarks::default()
            }
        );
        assert!(!middle.selected());
        let end = marks(&draft, "2026-03-13", Some("2026-03-13"));
        assert!(end.end && end.preview && !end.selected());
        // The start is chosen, and selected, whatever the preview.
        let start = marks(&draft, "2026-03-10", Some("2026-03-13"));
        assert!(start.start && !start.end && start.selected());
        // A start alone, with nothing to preview: no band and no end.
        assert_eq!(
            marks(&draft, "2026-03-10", None),
            DayMarks {
                start: true,
                ..DayMarks::default()
            }
        );
    }

    #[test]
    fn only_a_day_that_would_end_the_range_is_previewed() {
        let draft = days(&["2026-03-10"]);
        assert_eq!(
            preview_end(&draft, date("2026-03-12"), 2, Some(14)),
            Some(date("2026-03-12"))
        );
        // One night, fifteen nights, the start itself and a day before it.
        for day in ["2026-03-11", "2026-03-25", "2026-03-10", "2026-03-09"] {
            assert_eq!(preview_end(&draft, date(day), 2, Some(14)), None, "{day}");
        }
        // Nothing previews while a whole range is shown.
        assert_eq!(
            preview_end(
                &days(&["2026-03-10", "2026-03-14"]),
                date("2026-03-20"),
                0,
                None
            ),
            None
        );
    }

    #[test]
    fn two_months_show_from_640_pixels() {
        assert_eq!(months_for_width(639.0), 1);
        assert_eq!(months_for_width(640.0), 2);
        assert_eq!(months_for_width(960.0), 2);
    }

    #[test]
    fn the_field_joins_both_days_in_the_medium_form() {
        let range = DateRange::new(date("2026-03-10"), date("2026-03-14"));
        assert_eq!(
            format_range(range, CalendarLocale::from_tag("en-US")),
            "Mar 10, 2026 \u{2013} Mar 14, 2026"
        );
        assert_eq!(
            format_range(range, CalendarLocale::from_tag("ko-KR")),
            "2026년 3월 10일 \u{2013} 2026년 3월 14일"
        );
    }

    #[test]
    #[should_panic(expected = "a range ends on or after its start")]
    fn a_range_cannot_end_before_it_starts() {
        DateRange::new(date("2026-03-14"), date("2026-03-10"));
    }
}
