//! The design preview: every token and every component, in one scrolling window.
//!
//! The desktop app opens it with `acme --design`. It is the desktop counterpart of the
//! `/design` route of the web and mobile apps, and shows the same things in the same order.

use std::cell::Cell;
use std::path::PathBuf;
use std::rc::Rc;
use std::str::FromStr;
use std::sync::Arc;
use std::time::Duration;

use acme_tokens as tokens;
use chrono::NaiveDate;
use gpui_kit::base::ElementExt as _;
use gpui_kit::component::{
    Disableable as _,
    input::{InputState, TextareaState},
};
use gpui_kit::prelude::FluentBuilder as _;
use gpui_kit::{
    App, AppContext as _, Bounds, ClickEvent, Context, Div, Entity, Image, ImageFormat,
    InteractiveElement as _, IntoElement, ObjectFit, ParentElement as _, Pixels, Render, Role,
    ScrollHandle, SharedString, StatefulInteractiveElement as _, Styled as _, StyledImage as _,
    Window, WindowBounds, WindowOptions, div, img, point, px, relative, size,
};

use crate::{
    Accordion, AccordionItem, Avatar, AvatarSize, AvatarStack, Badge, BadgeTone, Banner,
    BannerTone, ButtonVariant, Chip, ChipBar, ControlSize, CountBadge, DatePicker, DateRange,
    DateRangePicker, Dialog, EmptyState, IconSize, ListRow, MediaCard, MediaCardLayout, Menu,
    MenuAlign, MenuItem, Person, ProgressBar, RadioGroup, RadioOption, SearchField, SectionHeader,
    SegmentedControl, Select, SelectOption, Sidebar, SidebarItem, SidebarSection, Skeleton,
    SkeletonShape, Slider, SpinnerSize, TabItem, Tabs, TextField, TextVariant, Thumbnail,
    ThumbnailRatio, Toast, TooltipPlacement, TypographyExt as _, button, card, checkbox, color,
    divider, icon, icon_button, icon_filled, mode, palette, set_mode, spinner, switch, text, theme,
    tooltip,
};

/// Component colors are shown by the components that use them, not as swatches.
const COMPONENT_COLORS: [&str; 28] = [
    "button-",
    "field-",
    "badge-",
    "banner-",
    "card-",
    "switch-",
    "checkbox-",
    "segmented-",
    "avatar-",
    "progress-",
    "list-row-",
    "top-bar-",
    "tab-bar-",
    "sheet-",
    "chip-",
    "tabs-",
    "menu-",
    "date-picker-",
    "dialog-",
    "toast-",
    "tooltip-",
    "skeleton-",
    "radio-",
    "slider-",
    "thumbnail-",
    "sidebar-",
    "empty-state-",
    "accordion-",
];

/// An overlay the preview shows open from the start, for a script that takes screenshots and
/// cannot press anything: `acme --design --open menu`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PreviewOverlay {
    Menu,
    Select,
    DatePicker,
    DateRange,
    Dialog,
    Toast,
    Tooltip,
}

impl PreviewOverlay {
    pub const ALL: [Self; 7] = [
        Self::Menu,
        Self::Select,
        Self::DatePicker,
        Self::DateRange,
        Self::Dialog,
        Self::Toast,
        Self::Tooltip,
    ];

    /// The overlay's name, as `--open` and the web's `?open=` take it.
    pub const fn name(self) -> &'static str {
        match self {
            Self::Menu => "menu",
            Self::Select => "select",
            Self::DatePicker => "datepicker",
            Self::DateRange => "daterange",
            Self::Dialog => "dialog",
            Self::Toast => "toast",
            Self::Tooltip => "tooltip",
        }
    }
}

impl FromStr for PreviewOverlay {
    type Err = String;

    fn from_str(name: &str) -> Result<Self, Self::Err> {
        Self::ALL
            .into_iter()
            .find(|overlay| overlay.name() == name)
            .ok_or_else(|| {
                format!(
                    "there is no overlay called `{name}`: use menu, select, datepicker, daterange, \
                 dialog, toast or tooltip"
                )
            })
    }
}

const BILLING: [(&str, &str, &str); 3] = [
    ("monthly", "Monthly", "Pay as you go, and stop at any time."),
    ("yearly", "Yearly", "Two months free, paid once a year."),
    ("team", "Team", "Five people or more, paid per seat."),
];

const DELIVERY: [(&str, &str); 3] = [
    ("standard", "Standard"),
    ("express", "Express"),
    ("pickup", "Pick up in store"),
];

const COUNTRIES: [(&str, &str); 6] = [
    ("br", "Brazil"),
    ("ca", "Canada"),
    ("fr", "France"),
    ("de", "Germany"),
    ("jp", "Japan"),
    ("kr", "South Korea"),
];

/// More than the list shows at once, so it scrolls, with the chosen one near the end.
const TIME_ZONES: [(&str, &str, &str); 12] = [
    ("honolulu", "Honolulu", "UTC−10"),
    ("los-angeles", "Los Angeles", "UTC−8"),
    ("denver", "Denver", "UTC−7"),
    ("chicago", "Chicago", "UTC−6"),
    ("new-york", "New York", "UTC−5"),
    ("sao-paulo", "São Paulo", "UTC−3"),
    ("london", "London", "UTC+0"),
    ("berlin", "Berlin", "UTC+1"),
    ("dubai", "Dubai", "UTC+4"),
    ("delhi", "Delhi", "UTC+5:30"),
    ("seoul", "Seoul", "UTC+9"),
    ("sydney", "Sydney", "UTC+10"),
];

const LANGUAGES: [(&str, &str); 4] = [
    ("en", "English"),
    ("ko", "한국어"),
    ("ja", "日本語"),
    ("de", "Deutsch"),
];

const QUESTIONS: [(&str, &str, &str); 3] = [
    (
        "cancel",
        "Can I cancel at any time?",
        "Yes. Your plan stays active until the end of the period you paid for, and nothing is charged after that.",
    ),
    (
        "devices",
        "How many devices can I use?",
        "Up to five at once. Signing in on a sixth signs out the one used least recently.",
    ),
    (
        "offline",
        "Can I watch offline?",
        "Download a video from its menu, and it stays on the device for thirty days.",
    ),
];

const SETTINGS: [(&str, &str, &str, &str); 3] = [
    (
        "playback",
        "Playback",
        "Autoplay and quality",
        "Autoplay starts the next video when one ends. Quality follows the connection unless it is set here.",
    ),
    (
        "captions",
        "Captions",
        "Shown for every video",
        "Captions are drawn in the language of the app when the video has them.",
    ),
    (
        "privacy",
        "Privacy",
        "History is kept",
        "What you watch is kept for recommendations. Pause the history to stop it.",
    ),
];

/// A place of the sidebar: the value, the label, the icon and a count.
type Place = (&'static str, &'static str, tokens::Icon, i64);

/// The places of the sidebar, in sections under an optional title.
const PLACES: [(Option<&str>, &[Place]); 3] = [
    (
        None,
        &[
            ("home", "Home", tokens::Icon::House, 0),
            ("explore", "Explore", tokens::Icon::Compass, 0),
            (
                "subscriptions",
                "Subscriptions",
                tokens::Icon::ListVideo,
                12,
            ),
        ],
    ),
    (
        Some("Library"),
        &[
            ("history", "History", tokens::Icon::History, 0),
            ("later", "Watch later", tokens::Icon::Clock, 4),
            ("liked", "Liked videos", tokens::Icon::ThumbsUp, 128),
        ],
    ),
    (
        Some("More"),
        &[
            ("settings", "Settings", tokens::Icon::Settings, 0),
            ("help", "Help", tokens::Icon::CircleHelp, 0),
        ],
    ),
];

fn places() -> Vec<SidebarSection> {
    PLACES
        .iter()
        .map(|(title, items)| {
            let section = SidebarSection::new(items.iter().map(|(value, label, glyph, count)| {
                SidebarItem::new(*value, *label, *glyph).count(*count)
            }));
            match title {
                Some(title) => section.title(*title),
                None => section,
            }
        })
        .collect()
}

const FILTERS: [(&str, &str, tokens::Icon); 7] = [
    ("open", "Open", tokens::Icon::Flag),
    ("mine", "Assigned to me", tokens::Icon::User),
    ("mentions", "Mentions", tokens::Icon::MessageSquare),
    ("review", "Needs review", tokens::Icon::Eye),
    ("blocked", "Blocked", tokens::Icon::Ban),
    ("done", "Done this week", tokens::Icon::CheckCheck),
    ("archived", "Archived", tokens::Icon::History),
];

const PAGES: [(&str, &str, tokens::Icon); 5] = [
    ("overview", "Overview", tokens::Icon::House),
    ("activity", "Activity", tokens::Icon::Bell),
    ("members", "Members", tokens::Icon::Users),
    ("billing", "Billing", tokens::Icon::CreditCard),
    ("settings", "Settings", tokens::Icon::Settings),
];

/// The first `count` pages as tabs, with or without their icons.
fn pages(count: usize, icons: bool) -> Vec<TabItem> {
    PAGES
        .into_iter()
        .take(count)
        .map(|(value, label, glyph)| {
            let item = TabItem::new(value, label);
            if icons { item.icon(glyph) } else { item }
        })
        .collect()
}

const FOLDERS: [(&str, tokens::Icon); 3] = [
    ("Inbox", tokens::Icon::Mail),
    ("Starred", tokens::Icon::Star),
    ("Scheduled", tokens::Icon::Clock),
];

const PLANS: [(&str, &str); 2] = [
    ("Monthly", "Pay as you go, and stop at any time."),
    ("Yearly", "Two months free, paid once a year."),
];

const TEAM: [&str; 7] = [
    "Ada Lovelace",
    "Grace Hopper",
    "Katherine Johnson",
    "Alan Turing",
    "Hedy Lamarr",
    "Edsger Dijkstra",
    "Barbara Liskov",
];

fn rgb(color: tokens::Color) -> String {
    format!("rgb({},{},{})", color.r, color.g, color.b)
}

/// The pictures of the preview are drawn here, from the light palette in both modes as a
/// photograph would be, so the preview shows the same thing with no network.
fn picture(svg: String) -> Arc<Image> {
    Arc::new(Image::from_bytes(ImageFormat::Svg, svg.into_bytes()))
}

fn portrait(t: &tokens::Theme) -> Arc<Image> {
    let c = &t.light;
    picture(format!(
        r#"<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 120 120"><rect width="120" height="120" fill="{wall}"/><circle cx="60" cy="48" r="22" fill="{face}"/><path d="M14 120c0-28 20-44 46-44s46 16 46 44z" fill="{coat}"/></svg>"#,
        wall = rgb(c.accent_subtle_pressed),
        face = rgb(c.background_base),
        coat = rgb(c.accent_default),
    ))
}

fn landscape(t: &tokens::Theme) -> Arc<Image> {
    let c = &t.light;
    picture(format!(
        r#"<svg xmlns="http://www.w3.org/2000/svg" width="640" height="320" viewBox="0 0 320 160"><rect width="320" height="160" fill="{sky}"/><circle cx="236" cy="52" r="24" fill="{sun}"/><path d="M0 160V104l70-48 64 40 46-26 140 90z" fill="{far}"/><path d="M0 160v-30l96-44 104 52 120-36v58z" fill="{near}"/></svg>"#,
        sky = rgb(c.accent_subtle),
        sun = rgb(c.status_warning),
        far = rgb(c.accent_subtle_pressed),
        near = rgb(c.accent_default),
    ))
}

const VIEWS: [&str; 3] = ["Day", "Week", "Month"];

const VARIANTS: [(&str, ButtonVariant); 4] = [
    ("primary", ButtonVariant::Primary),
    ("secondary", ButtonVariant::Secondary),
    ("ghost", ButtonVariant::Ghost),
    ("danger", ButtonVariant::Danger),
];

const fn spaces(t: &tokens::Theme) -> [(&'static str, f32); 13] {
    [
        ("0.5", t.space.s0_5),
        ("1", t.space.s1),
        ("1.5", t.space.s1_5),
        ("2", t.space.s2),
        ("2.5", t.space.s2_5),
        ("3", t.space.s3),
        ("4", t.space.s4),
        ("5", t.space.s5),
        ("6", t.space.s6),
        ("8", t.space.s8),
        ("10", t.space.s10),
        ("12", t.space.s12),
        ("16", t.space.s16),
    ]
}

const fn radii(t: &tokens::Theme) -> [(&'static str, f32); 5] {
    [
        ("sm", t.radius.sm),
        ("md", t.radius.md),
        ("lg", t.radius.lg),
        ("xl", t.radius.xl),
        ("full", t.radius.full),
    ]
}

pub struct DesignPreview {
    email: Entity<InputState>,
    code: Entity<InputState>,
    organization: Entity<InputState>,
    search: Entity<InputState>,
    weight: Entity<InputState>,
    handle: Entity<InputState>,
    about: Entity<TextareaState>,
    message: Entity<TextareaState>,
    notifications: bool,
    remember: bool,
    view: usize,
    liked: bool,
    saved: bool,
    banner_open: bool,
    folder: usize,
    plan: usize,
    portrait: Arc<Image>,
    landscape: Arc<Image>,
    search_projects: Entity<InputState>,
    search_people: Entity<InputState>,
    search_files: Entity<InputState>,
    searched: Option<SharedString>,
    pinned: bool,
    filters: Vec<&'static str>,
    page: SharedString,
    density: &'static str,
    chosen: SharedString,
    confirming: bool,
    asking: bool,
    copy_name: Entity<InputState>,
    toast_open: bool,
    draft_deleted: bool,
    billing: SharedString,
    delivery: Option<SharedString>,
    country: Option<SharedString>,
    time_zone: SharedString,
    due_date: NaiveDate,
    start_date: Option<NaiveDate>,
    stay: DateRange,
    leave: Option<DateRange>,
    volume: f32,
    speed: f32,
    faq: Vec<SharedString>,
    settings_open: Vec<SharedString>,
    place: SharedString,
    opened: SharedString,
    /// The overlay a script asked to see open. See `open_scripted`.
    overlay: Option<PreviewOverlay>,
    /// How far down the page the control of that overlay was drawn, for a script that did not
    /// say where to scroll: the preview starts there, so that the overlay is in the window.
    overlay_top: Rc<Cell<Option<Pixels>>>,
    find_overlay: bool,
    overlay_scrolled_to: Option<Pixels>,
    /// Where to scroll to once the page has been laid out. See `open_scrolled`.
    start_at: Option<f32>,
    /// Held here because the position GPUI keeps for an untracked scroll area jumped when
    /// something in the page was clicked.
    scroll: ScrollHandle,
}

impl DesignPreview {
    pub fn new(window: &mut Window, cx: &mut Context<Self>) -> Self {
        let t = theme(cx);
        let mut field = |placeholder: &'static str| {
            cx.new(|cx| InputState::new(window, cx).placeholder(placeholder))
        };
        let email = field("name@example.com");
        let code = field("000000");
        let organization = field("Acme Inc.");
        let search = field("Search messages");
        let weight = field("0.0");
        let handle = cx.new(|cx| {
            InputState::new(window, cx)
                .placeholder("name")
                .default_value("ada")
        });
        let mut area = |placeholder: &'static str, value: &'static str| {
            cx.new(|cx| {
                TextareaState::new(window, cx)
                    .placeholder(placeholder)
                    .default_value(value)
            })
        };
        let about = area(
            "A few words about you",
            "Mathematician. I write programs for a machine that is not built yet.",
        );
        let message = area("Write a message", "");
        let mut search_field = |placeholder: &'static str, value: &'static str| {
            cx.new(|cx| {
                InputState::new(window, cx)
                    .placeholder(placeholder)
                    .default_value(value)
            })
        };
        let search_projects = search_field("Search projects", "");
        let search_people = search_field("Search people", "Ada Lovelace");
        let search_files = search_field("Unavailable offline", "");
        let copy_name =
            cx.new(|cx| InputState::new(window, cx).default_value("Weekly report, my copy"));
        Self {
            email,
            code,
            organization,
            search,
            weight,
            handle,
            about,
            message,
            notifications: true,
            remember: true,
            view: 1,
            liked: true,
            saved: true,
            banner_open: true,
            folder: 0,
            plan: 1,
            portrait: portrait(t),
            landscape: landscape(t),
            search_projects,
            search_people,
            search_files,
            searched: None,
            pinned: true,
            filters: vec!["open", "review"],
            page: "overview".into(),
            density: "comfortable",
            chosen: "Nothing chosen yet.".into(),
            confirming: false,
            asking: false,
            copy_name,
            toast_open: false,
            draft_deleted: true,
            billing: "yearly".into(),
            delivery: None,
            country: None,
            time_zone: "seoul".into(),
            due_date: day(2026, 3, 10),
            start_date: None,
            stay: DateRange::new(day(2026, 3, 10), day(2026, 3, 14)),
            leave: None,
            volume: 60.0,
            speed: 1.25,
            faq: vec!["cancel".into()],
            settings_open: vec!["playback".into(), "captions".into()],
            place: "home".into(),
            opened: "Press a card.".into(),
            overlay: None,
            overlay_top: Rc::new(Cell::new(None)),
            find_overlay: false,
            overlay_scrolled_to: None,
            start_at: None,
            scroll: ScrollHandle::new(),
        }
    }

    /// Opens the preview in a window of its own.
    pub fn open(cx: &mut App) {
        Self::open_scripted(0.0, None, cx);
    }

    /// Opens the preview already scrolled `offset` pixels down. A script that takes
    /// screenshots cannot scroll, so it asks for the part it wants.
    pub fn open_scrolled(offset: f32, cx: &mut App) {
        Self::open_scripted(offset, None, cx);
    }

    /// Opens the preview scrolled `offset` pixels down, with `overlay` open. A menu, a select's
    /// list and a tooltip open beside their control, so without an offset the preview starts at
    /// that control. A toast opened this way stays until it is closed, so a capture does not race
    /// its timer.
    ///
    /// # Panics
    ///
    /// When the window cannot open.
    pub fn open_scripted(offset: f32, overlay: Option<PreviewOverlay>, cx: &mut App) {
        let options = WindowOptions {
            window_bounds: Some(WindowBounds::Windowed(Bounds::centered(
                None,
                size(px(960.0), px(820.0)),
                cx,
            ))),
            ..Default::default()
        };
        gpui_kit::open_window(options, cx, |window, cx| {
            cx.new(|cx| Self::scripted(offset, overlay, window, cx))
        })
        .expect("the design preview window could not open");
        cx.activate(true);
    }

    /// The preview as [`open_scripted`](Self::open_scripted) shows it, for a window the caller
    /// opens: a program that draws the preview off screen.
    pub fn scripted(
        offset: f32,
        overlay: Option<PreviewOverlay>,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) -> Self {
        let mut preview = Self::new(window, cx);
        preview.start_at = (offset > 0.0).then_some(offset);
        preview.overlay = overlay;
        preview.confirming = overlay == Some(PreviewOverlay::Dialog);
        preview.toast_open = overlay == Some(PreviewOverlay::Toast);
        preview.find_overlay = preview.start_at.is_none()
            && matches!(
                overlay,
                Some(
                    PreviewOverlay::Menu
                        | PreviewOverlay::Select
                        | PreviewOverlay::DatePicker
                        | PreviewOverlay::DateRange
                        | PreviewOverlay::Tooltip
                )
            );
        preview
    }

    /// Scrolls the page `offset` pixels down, once it has been laid out.
    pub fn scroll_to(&mut self, offset: f32, cx: &mut Context<Self>) {
        self.start_at = Some(offset);
        cx.notify();
    }

    /// How far the page scrolls, once it has been laid out: zero before then.
    pub fn scroll_height(&self) -> Pixels {
        self.scroll.max_offset().y
    }

    /// Notes how far down the page `element` is drawn, when it is the control of the overlay
    /// a script asked for.
    fn mark_overlay(&self, overlay: PreviewOverlay, element: Div) -> Div {
        if self.overlay != Some(overlay) {
            return element;
        }
        let top = self.overlay_top.clone();
        let scroll = self.scroll.clone();
        element.on_prepaint(move |bounds, _, _| {
            top.set(Some(
                bounds.top() - scroll.bounds().top() - scroll.offset().y,
            ));
        })
    }
}

/// A day of the preview's fixtures.
const fn day(year: i32, month: u32, day: u32) -> NaiveDate {
    NaiveDate::from_ymd_opt(year, month, day).expect("a fixture day is a real day")
}

fn row(t: &tokens::Theme) -> Div {
    div().flex().flex_wrap().items_center().gap(px(t.space.s3))
}

fn section(title: &'static str, t: &tokens::Theme) -> Div {
    div()
        .flex()
        .flex_col()
        .gap(px(t.space.s4))
        .child(text(title).variant(TextVariant::Title))
}

/// A row with its name on the left, as in a specification sheet.
fn labelled(label: impl Into<SharedString>, secondary: tokens::Color, t: &tokens::Theme) -> Div {
    row(t).child(
        div()
            .flex_none()
            .w(px(120.0))
            .typography(t.typography.detail)
            .text_color(color(secondary))
            .child(label.into()),
    )
}

impl Render for DesignPreview {
    fn render(&mut self, window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let t = theme(cx);
        if self.find_overlay {
            // The first frames can be laid out before the window has its size, with the
            // control further down than it ends up, so the page follows the control until two
            // frames agree on where it is.
            match (self.overlay_top.get(), self.overlay_scrolled_to) {
                (Some(top), Some(scrolled_to)) if (top - scrolled_to).abs() < px(1.0) => {
                    self.find_overlay = false;
                }
                (Some(top), _) => {
                    self.overlay_scrolled_to = Some(top);
                    // Some room above the control, which a tooltip on top of it needs.
                    self.start_at = Some((f32::from(top) - t.space.s16).max(0.0));
                    window.request_animation_frame();
                }
                (None, _) => window.request_animation_frame(),
            }
        }
        // The page has no height until it has been drawn once, and a scroll position set before
        // then is clamped to the top. So wait for a frame that knows how far it can scroll.
        if let Some(offset) = self.start_at {
            if self.scroll.max_offset().y > px(0.0) {
                self.scroll.set_offset(point(px(0.0), px(-offset)));
                self.start_at = None;
            } else {
                window.request_animation_frame();
            }
        }
        let colors = palette(cx);
        let secondary = colors.text_secondary;
        let dark = mode(cx) == tokens::Mode::Dark;

        let header = row(t)
            .justify_between()
            .child(text("Acme design system").variant(TextVariant::Display))
            .child(
                button("toggle-mode", if dark { "Light mode" } else { "Dark mode" })
                    .variant(ButtonVariant::Ghost)
                    .control_size(ControlSize::Sm)
                    .on_click(move |_, _, cx| {
                        let next = if dark {
                            tokens::Mode::Light
                        } else {
                            tokens::Mode::Dark
                        };
                        set_mode(next, cx);
                        cx.refresh_windows();
                    }),
            );

        // Semantic colors, grouped by the first word of their name.
        let mut groups: Vec<(&str, Vec<(&str, tokens::Color)>)> = Vec::new();
        for (name, value) in colors.entries() {
            if COMPONENT_COLORS
                .iter()
                .any(|prefix| name.starts_with(prefix))
            {
                continue;
            }
            let group = name.split('-').next().unwrap_or(name);
            match groups.last_mut() {
                Some((last, entries)) if *last == group => entries.push((name, value)),
                _ => groups.push((group, vec![(name, value)])),
            }
        }
        let color_groups = groups.into_iter().map(|(group, entries)| {
            let swatches = entries.into_iter().map(|(name, value)| {
                row(t)
                    .w(px(210.0))
                    .gap(px(t.space.s2))
                    .child(
                        div()
                            .flex_none()
                            .size(px(28.0))
                            .rounded(px(t.radius.sm))
                            .border(px(t.border.width_thin))
                            .border_color(color(colors.border_default))
                            .bg(color(value)),
                    )
                    .child(
                        div()
                            .typography(t.typography.footnote)
                            .text_color(color(secondary))
                            .child(name),
                    )
            });
            div()
                .flex()
                .flex_col()
                .gap(px(t.space.s2))
                .child(
                    text(group)
                        .variant(TextVariant::Label)
                        .text_color(color(secondary)),
                )
                .child(row(t).gap(px(t.space.s2)).children(swatches))
        });

        let texts = TextVariant::ALL.map(|variant| {
            labelled(
                format!("{} {}", variant.name(), variant.typography(t).size),
                secondary,
                t,
            )
            .child(text("다람쥐 헌 쳇바퀴에 타고파. The quick brown fox 123").variant(variant))
        });

        let spaces = spaces(t).map(|(name, value)| {
            div()
                .flex()
                .flex_col()
                .items_center()
                .gap(px(t.space.s1))
                .child(div().size(px(value)).bg(color(colors.accent_default)))
                .child(
                    text(name)
                        .variant(TextVariant::Footnote)
                        .text_color(color(secondary)),
                )
        });
        let radii = radii(t).map(|(name, value)| {
            div()
                .flex()
                .items_center()
                .justify_center()
                .size(px(48.0))
                .rounded(px(value))
                .border(px(t.border.width_thin))
                .border_color(color(colors.border_strong))
                .typography(t.typography.footnote)
                .text_color(color(secondary))
                .child(name)
        });
        let sizes = format!(
            "Pointer {}/{}/{}, touch {}/{}/{}. The desktop app uses the pointer sizes.",
            t.pointer.control_sm,
            t.pointer.control_md,
            t.pointer.control_lg,
            t.touch.control_sm,
            t.touch.control_md,
            t.touch.control_lg,
        );

        let buttons = VARIANTS.map(|(name, variant)| {
            labelled(name, secondary, t)
                .child(
                    button((name, 0usize), "Save")
                        .variant(variant)
                        .control_size(ControlSize::Sm),
                )
                .child(
                    button((name, 1usize), "Save")
                        .variant(variant)
                        .control_size(ControlSize::Md),
                )
                .child(
                    button((name, 2usize), "Save")
                        .variant(variant)
                        .control_size(ControlSize::Lg),
                )
                .child(
                    button((name, 3usize), "Disabled")
                        .variant(variant)
                        .control_size(ControlSize::Md)
                        .disabled(true),
                )
                .child(
                    button((name, 4usize), "Saving")
                        .variant(variant)
                        .control_size(ControlSize::Md)
                        .loading(true),
                )
        });
        let icon_buttons = labelled("icons", secondary, t)
            .child(
                button("icon-sm", "New")
                    .variant(ButtonVariant::Primary)
                    .control_size(ControlSize::Sm)
                    .icon_start(tokens::Icon::Plus),
            )
            .child(
                button("icon-md", "Filter")
                    .variant(ButtonVariant::Secondary)
                    .control_size(ControlSize::Md)
                    .icon_start(tokens::Icon::ListFilter),
            )
            .child(
                button("icon-lg", "Continue")
                    .variant(ButtonVariant::Primary)
                    .control_size(ControlSize::Lg)
                    .icon_end(tokens::Icon::ArrowRight),
            )
            .child(
                button("icon-both", "Search")
                    .variant(ButtonVariant::Ghost)
                    .control_size(ControlSize::Md)
                    .icon_start(tokens::Icon::Search)
                    .icon_end(tokens::Icon::ChevronRight),
            )
            .child(
                button("icon-disabled", "Filter")
                    .variant(ButtonVariant::Secondary)
                    .control_size(ControlSize::Md)
                    .icon_start(tokens::Icon::ListFilter)
                    .disabled(true),
            )
            .child(
                // The spinner stands where the icon was, so this one is as wide as "Filter".
                button("icon-loading", "Filter")
                    .variant(ButtonVariant::Secondary)
                    .control_size(ControlSize::Md)
                    .icon_start(tokens::Icon::ListFilter)
                    .loading(true),
            );
        let toggles = labelled("selected", secondary, t)
            .child(
                button("like", "Like")
                    .variant(ButtonVariant::Secondary)
                    .control_size(ControlSize::Md)
                    .icon_start(tokens::Icon::Heart)
                    .selected(self.liked)
                    .on_click(cx.listener(|this, _, _, cx| {
                        this.liked = !this.liked;
                        cx.notify();
                    })),
            )
            .child(
                button("like-off", "Like")
                    .variant(ButtonVariant::Secondary)
                    .control_size(ControlSize::Md)
                    .icon_start(tokens::Icon::Heart)
                    .selected(false),
            )
            .child(
                button("save", "Save")
                    .variant(ButtonVariant::Ghost)
                    .control_size(ControlSize::Md)
                    .icon_start(tokens::Icon::Bookmark)
                    .selected(self.saved)
                    .on_click(cx.listener(|this, _, _, cx| {
                        this.saved = !this.saved;
                        cx.notify();
                    })),
            )
            .child(
                button("save-off", "Save")
                    .variant(ButtonVariant::Ghost)
                    .control_size(ControlSize::Md)
                    .icon_start(tokens::Icon::Bookmark)
                    .selected(false),
            )
            .child(
                button("like-disabled", "Like")
                    .variant(ButtonVariant::Secondary)
                    .control_size(ControlSize::Md)
                    .icon_start(tokens::Icon::Heart)
                    .selected(true)
                    .disabled(true),
            )
            .child(
                // Primary and danger buttons keep their look and only report the state.
                button("follow", "Following")
                    .variant(ButtonVariant::Primary)
                    .control_size(ControlSize::Md)
                    .icon_start(tokens::Icon::UserCheck)
                    .selected(true),
            );

        let icon_button_rows = VARIANTS.map(|(name, variant)| {
            let settings = |index: usize, label: &'static str| {
                icon_button((name, index), tokens::Icon::Settings, label).variant(variant)
            };
            labelled(format!("icon, {name}"), secondary, t)
                .child(settings(10, "Settings, sm").control_size(ControlSize::Sm))
                .child(settings(11, "Settings, md"))
                .child(settings(12, "Settings, lg").control_size(ControlSize::Lg))
                .child(settings(13, "Disabled").disabled(true))
                .child(settings(14, "Loading").loading(true))
        });
        let icon_toggles = labelled("icon, selected", secondary, t)
            .child(
                icon_button("icon-pin", tokens::Icon::Pin, "Pin")
                    .selected(self.pinned)
                    .on_click(cx.listener(|this, _, _, cx| {
                        this.pinned = !this.pinned;
                        cx.notify();
                    })),
            )
            .child(icon_button("icon-pin-off", tokens::Icon::Pin, "Pin").selected(false))
            .child(
                icon_button("icon-star", tokens::Icon::Star, "Star")
                    .variant(ButtonVariant::Secondary)
                    .selected(true),
            )
            .child(
                icon_button("icon-star-off", tokens::Icon::Star, "Star")
                    .variant(ButtonVariant::Secondary)
                    .selected(false),
            )
            .child(
                icon_button("icon-like-sm", tokens::Icon::Heart, "Like")
                    .control_size(ControlSize::Sm)
                    .selected(true),
            )
            .child(
                icon_button("icon-like-lg", tokens::Icon::Heart, "Like")
                    .control_size(ControlSize::Lg)
                    .selected(true),
            )
            .child(
                icon_button("icon-save-disabled", tokens::Icon::Bookmark, "Save")
                    .selected(true)
                    .disabled(true),
            )
            .child(
                // Primary and danger buttons keep their look and only report the state.
                icon_button("icon-notify", tokens::Icon::Bell, "Notify")
                    .variant(ButtonVariant::Primary)
                    .selected(true),
            );
        let tooltips = self.mark_overlay(
            PreviewOverlay::Tooltip,
            labelled("tooltip", secondary, t)
                .child(
                    tooltip(
                        "tooltip-search",
                        "Search",
                        icon_button("tooltip-search-button", tokens::Icon::Search, "Search"),
                    )
                    .shortcut("⌘K")
                    .pinned(self.overlay == Some(PreviewOverlay::Tooltip)),
                )
                .child(
                    tooltip(
                        "tooltip-share",
                        "Share",
                        icon_button("tooltip-share-button", tokens::Icon::Share2, "Share")
                            .variant(ButtonVariant::Secondary),
                    )
                    .placement(TooltipPlacement::Bottom),
                )
                .child(tooltip(
                    "tooltip-export",
                    "Export as a spreadsheet",
                    button("tooltip-export-button", "Export")
                        .variant(ButtonVariant::Secondary)
                        .control_size(ControlSize::Md)
                        .icon_start(tokens::Icon::Download),
                ))
                .child(
                    text("Rest the pointer on a control, or focus it with the keyboard.")
                        .variant(TextVariant::Detail)
                        .text_color(color(secondary)),
                ),
        );

        let search_fields = [
            SearchField::new("search-projects", "Search projects", &self.search_projects)
                .on_submit(cx.listener(|this, query: &SharedString, _, cx| {
                    this.searched = Some(query.clone());
                    cx.notify();
                })),
            SearchField::new("search-people", "Search people", &self.search_people),
            SearchField::new("search-files", "Search files", &self.search_files).disabled(true),
        ];
        let searched = match &self.searched {
            Some(query) => format!("Searched for “{query}”."),
            None => "Enter searches.".to_owned(),
        };

        let state_chips = labelled("state", secondary, t).child(
            // A row of its own, so the chips that wrap line up with the first ones.
            row(t)
                .flex_1()
                .child(Chip::new("chip-unselected", "Unselected"))
                .child(Chip::new("chip-selected", "Selected").selected(true))
                .child(Chip::new("chip-icon", "With an icon").icon_start(tokens::Icon::Tag))
                .child(
                    Chip::new("chip-icon-selected", "Selected, with an icon")
                        .icon_start(tokens::Icon::Tag)
                        .selected(true),
                )
                .child(Chip::new("chip-disabled", "Disabled").disabled(true))
                .child(
                    Chip::new("chip-selected-disabled", "Selected, disabled")
                        .selected(true)
                        .disabled(true),
                ),
        );
        let filter_chips = FILTERS
            .into_iter()
            .enumerate()
            .map(|(index, (value, label, glyph))| {
                Chip::new(("filter", index), label)
                    .icon_start(glyph)
                    .selected(self.filters.contains(&value))
                    .on_click(cx.listener(move |this, _, _, cx| {
                        match this.filters.iter().position(|filter| *filter == value) {
                            Some(at) => {
                                this.filters.remove(at);
                            }
                            None => this.filters.push(value),
                        }
                        cx.notify();
                    }))
            })
            .collect::<Vec<_>>();

        let on_page = cx.listener(|this, value: &SharedString, _, cx| {
            this.page = value.clone();
            cx.notify();
        });
        let on_page = Rc::new(on_page);
        let tabs = |id: &'static str, label: &'static str, items: Vec<TabItem>| {
            let on_page = on_page.clone();
            Tabs::new(id, label, items)
                .on_change(move |value, window, cx| on_page(value, window, cx))
        };
        // The full-width row has the first three pages only.
        let short_page = if PAGES[..3]
            .iter()
            .any(|(value, _, _)| self.page.as_ref() == *value)
        {
            self.page.clone()
        } else {
            PAGES[0].0.into()
        };

        let choose = |label: &'static str| {
            cx.listener(move |this: &mut Self, _: &ClickEvent, _, cx| {
                this.chosen = format!("Chose {label}.").into();
                cx.notify();
            })
        };
        let density = |value: &'static str| {
            cx.listener(move |this: &mut Self, _: &ClickEvent, _, cx| {
                this.density = value;
                cx.notify();
            })
        };

        let delivery = || DELIVERY.map(|(value, label)| RadioOption::new(value, label));
        let radio_groups = labelled("radio", secondary, t)
            .items_start()
            .child(
                div().w(px(280.0)).child(
                    RadioGroup::new(
                        "billing",
                        "Billing",
                        BILLING.map(|(value, label, terms)| {
                            RadioOption::new(value, label).description(terms)
                        }),
                    )
                    .value(self.billing.clone())
                    .on_change(cx.listener(
                        |this, value: &SharedString, _, cx| {
                            this.billing = value.clone();
                            cx.notify();
                        },
                    )),
                ),
            )
            .child(
                div().w(px(220.0)).child(
                    RadioGroup::new("delivery", "Delivery", delivery())
                        .when_some(self.delivery.clone(), |group, value| group.value(value))
                        .error(
                            self.delivery
                                .is_none()
                                .then_some("Choose how the order reaches you."),
                        )
                        .on_change(cx.listener(|this, value: &SharedString, _, cx| {
                            this.delivery = Some(value.clone());
                            cx.notify();
                        })),
                ),
            )
            .child(
                div().w(px(180.0)).child(
                    RadioGroup::new("delivery-locked", "Delivery, locked", delivery())
                        .value("express")
                        .disabled(true),
                ),
            );

        let field = |select: Select| div().w(px(300.0)).child(select);
        let countries = || COUNTRIES.map(|(value, label)| SelectOption::new(value, label));
        let selects = self.mark_overlay(
            PreviewOverlay::Select,
            labelled("select", secondary, t).items_start().child(
                div()
                    .flex_1()
                    .flex()
                    .flex_wrap()
                    .gap(px(t.space.s4))
                    .child(field(
                        Select::new(
                            "time-zone",
                            "Time zone",
                            TIME_ZONES.map(|(value, label, offset)| {
                                SelectOption::new(value, label).description(offset)
                            }),
                        )
                        .value(self.time_zone.clone())
                        .description("Reminders follow it.")
                        .default_open(self.overlay == Some(PreviewOverlay::Select))
                        .on_change(cx.listener(
                            |this, value: &SharedString, _, cx| {
                                this.time_zone = value.clone();
                                cx.notify();
                            },
                        )),
                    ))
                    .child(field(
                        Select::new("country", "Country", countries())
                            .placeholder("Choose a country")
                            .when_some(self.country.clone(), |select, value| select.value(value))
                            .on_change(cx.listener(|this, value: &SharedString, _, cx| {
                                this.country = Some(value.clone());
                                cx.notify();
                            })),
                    ))
                    .child(field(
                        Select::new(
                            "language",
                            "Language",
                            LANGUAGES.map(|(value, label)| SelectOption::new(value, label)),
                        )
                        .placeholder("Choose a language")
                        .error(Some("Choose the language of the app.")),
                    ))
                    .child(field(
                        Select::new("region", "Region", countries())
                            .value("kr")
                            .description("Set by your organization.")
                            .disabled(true),
                    )),
            ),
        );
        // Fixed days, so the calendar opens on a month that holds no today and a capture of it
        // does not change from day to day.
        let date_pickers = self.mark_overlay(
            PreviewOverlay::DatePicker,
            labelled("date picker", secondary, t).items_start().child(
                div()
                    .flex_1()
                    .flex()
                    .flex_wrap()
                    .gap(px(t.space.s4))
                    .child(
                        div().w(px(300.0)).child(
                            DatePicker::new("due-date", "Due date")
                                .value(self.due_date)
                                .min(day(2026, 3, 5))
                                .max(day(2026, 4, 20))
                                .description("Within the current sprint.")
                                .default_open(self.overlay == Some(PreviewOverlay::DatePicker))
                                .on_change(cx.listener(|this, value: &NaiveDate, _, cx| {
                                    this.due_date = *value;
                                    cx.notify();
                                })),
                        ),
                    )
                    .child(
                        div().w(px(300.0)).child(
                            DatePicker::new("start-date", "Start date")
                                .when_some(self.start_date, |picker, value| picker.value(value))
                                .placeholder("Choose a day")
                                .error(
                                    self.start_date
                                        .is_none()
                                        .then_some("Choose when the project starts."),
                                )
                                .on_change(cx.listener(|this, value: &NaiveDate, _, cx| {
                                    this.start_date = Some(*value);
                                    cx.notify();
                                })),
                        ),
                    )
                    .child(
                        div().w(px(300.0)).child(
                            DatePicker::new("locked-date", "Locked")
                                .value(day(2026, 3, 10))
                                .disabled(true),
                        ),
                    ),
            ),
        );
        // The same fixed days as the date pickers': a stay inside March, and a leave with no
        // bounds and no minimum, where the same day twice is a range of one day.
        let date_range_pickers = self.mark_overlay(
            PreviewOverlay::DateRange,
            labelled("date range picker", secondary, t)
                .items_start()
                .child(
                    div()
                        .flex_1()
                        .flex()
                        .flex_wrap()
                        .gap(px(t.space.s4))
                        .child(
                            div().w(px(300.0)).child(
                                DateRangePicker::new("stay", "Stay")
                                    .value(self.stay)
                                    .min(day(2026, 3, 5))
                                    .max(day(2026, 4, 20))
                                    .min_length(2)
                                    .max_length(14)
                                    .start_label("Check-in")
                                    .end_label("Check-out")
                                    .description("Two nights at least.")
                                    .default_open(self.overlay == Some(PreviewOverlay::DateRange))
                                    .on_change(cx.listener(|this, value: &DateRange, _, cx| {
                                        this.stay = *value;
                                        cx.notify();
                                    })),
                            ),
                        )
                        .child(
                            div().w(px(300.0)).child(
                                DateRangePicker::new("leave", "Leave")
                                    .when_some(self.leave, |picker, value| picker.value(value))
                                    .placeholder("Choose the days")
                                    .error(
                                        self.leave
                                            .is_none()
                                            .then_some("Choose the days of your leave."),
                                    )
                                    .on_change(cx.listener(|this, value: &DateRange, _, cx| {
                                        this.leave = Some(*value);
                                        cx.notify();
                                    })),
                            ),
                        )
                        .child(
                            div().w(px(300.0)).child(
                                DateRangePicker::new("locked-range", "Locked range")
                                    .value(DateRange::new(day(2026, 3, 10), day(2026, 3, 14)))
                                    .disabled(true),
                            ),
                        ),
                ),
        );
        let sliders = labelled("slider", secondary, t)
            .items_start()
            .child(
                div().w(px(240.0)).child(
                    Slider::new("volume", "Volume", self.volume)
                        .show_value(true)
                        .on_change(cx.listener(|this, value: &f32, _, cx| {
                            this.volume = *value;
                            cx.notify();
                        })),
                ),
            )
            .child(
                div().w(px(240.0)).child(
                    Slider::new("speed", "Playback speed", self.speed)
                        .min(0.5)
                        .max(2.0)
                        .step(0.25)
                        .show_value(true)
                        .on_change(cx.listener(|this, value: &f32, _, cx| {
                            this.speed = *value;
                            cx.notify();
                        })),
                ),
            )
            .child(
                div().w(px(240.0)).child(
                    Slider::new("brightness", "Brightness", 40.0)
                        .show_value(true)
                        .disabled(true),
                ),
            );

        let picture = self.landscape.clone();
        let shot = |width: f32, caption: &'static str, thumbnail: Thumbnail| {
            div()
                .flex()
                .flex_col()
                .gap(px(t.space.s1))
                .w(px(width))
                .child(thumbnail)
                .child(
                    text(caption)
                        .variant(TextVariant::Footnote)
                        .text_color(color(secondary)),
                )
        };
        let ratios = labelled("ratio", secondary, t)
            .items_start()
            .child(shot(
                176.0,
                "16:9",
                Thumbnail::new("thumb-16x9")
                    .src(picture.clone())
                    .alt("Hills under a morning sun"),
            ))
            .child(shot(
                132.0,
                "4:3",
                Thumbnail::new("thumb-4x3")
                    .src(picture.clone())
                    .ratio(ThumbnailRatio::Ratio4x3),
            ))
            .child(shot(
                100.0,
                "1:1",
                Thumbnail::new("thumb-1x1")
                    .src(self.portrait.clone())
                    .ratio(ThumbnailRatio::Ratio1x1),
            ))
            .child(shot(
                90.0,
                "9:16",
                Thumbnail::new("thumb-9x16")
                    .src(picture.clone())
                    .ratio(ThumbnailRatio::Ratio9x16),
            ));
        let thumbnail_states = labelled("state", secondary, t)
            .items_start()
            .child(shot(
                176.0,
                "a picture that fails",
                // No such file: the place and its mark stay.
                Thumbnail::new("thumb-missing").src(PathBuf::from("/acme/missing/thumbnail.png")),
            ))
            .child(shot(
                176.0,
                "badge",
                Thumbnail::new("thumb-badge")
                    .src(picture.clone())
                    .badge("12:04"),
            ))
            .child(shot(
                176.0,
                "progress",
                Thumbnail::new("thumb-progress")
                    .src(picture.clone())
                    .progress(0.35),
            ))
            .child(shot(
                176.0,
                "badge and progress",
                Thumbnail::new("thumb-both")
                    .src(picture.clone())
                    .badge("1:02:45")
                    .progress(0.8),
            ));
        let card_menu = |id: &'static str, title: &'static str| {
            Menu::new(id, format!("More actions for {title}"))
                .align(MenuAlign::End)
                .trigger(
                    icon_button(
                        format!("{id}-trigger"),
                        tokens::Icon::EllipsisVertical,
                        "More actions",
                    )
                    .control_size(ControlSize::Sm),
                )
                .item(MenuItem::new("Save to Watch later").icon(tokens::Icon::Clock))
                .item(MenuItem::new("Share").icon(tokens::Icon::Share2))
                .separator()
                .item(MenuItem::new("Not interested").icon(tokens::Icon::Ban))
        };
        let open_card = |title: &'static str| {
            cx.listener(move |this: &mut Self, _: &ClickEvent, _, cx| {
                this.opened = format!("Opened “{title}”.").into();
                cx.notify();
            })
        };
        let media_cards = row(t)
            .items_start()
            .gap(px(t.space.s4))
            .child(
                div().w(px(280.0)).child(
                    MediaCard::new(
                        "card-hike",
                        "A night hike to the summit: what to pack, and where to stop for the view",
                    )
                    .src(picture.clone())
                    .badge("12:04")
                    .progress(0.35)
                    .meta(["Acme Outdoors", "48K views · 3 days ago"])
                    .leading(Avatar::new("Acme Outdoors").src(self.portrait.clone()))
                    .action(card_menu("card-hike-menu", "the night hike"))
                    .on_press(open_card("A night hike to the summit")),
                ),
            )
            .child(
                div().w(px(460.0)).child(
                    MediaCard::new("card-bread", "Bread at home, in four steps")
                        .layout(MediaCardLayout::Horizontal)
                        .src(picture)
                        .badge("8:30")
                        .meta(["Grace Bakes", "2 weeks ago"])
                        .action(card_menu("card-bread-menu", "bread at home"))
                        .on_press(open_card("Bread at home")),
                ),
            );

        let on_place = Rc::new(cx.listener(|this, value: &SharedString, _, cx| {
            this.place = value.clone();
            cx.notify();
        }));
        let brand = || {
            div()
                .flex()
                .flex_none()
                .items_center()
                .justify_center()
                .size(px(t.pointer.avatar_sm))
                .rounded(px(t.radius.sm))
                .bg(color(colors.accent_default))
                .text_color(color(colors.text_on_accent))
                .child(icon_filled(tokens::Icon::Play).icon_size(IconSize::Xs))
        };
        let sidebar = |id: &'static str, collapsed: bool| {
            let on_place = on_place.clone();
            let (header, footer) = if collapsed {
                (
                    div().flex().justify_center().w_full().child(brand()),
                    div().flex().justify_center().w_full().child(
                        Avatar::new("Ada Lovelace")
                            .avatar_size(AvatarSize::Sm)
                            .src(self.portrait.clone()),
                    ),
                )
            } else {
                (
                    div()
                        .flex()
                        .items_center()
                        .gap(px(t.space.s2))
                        .px(px(t.space.s2))
                        .child(brand())
                        .child(text("Acme").variant(TextVariant::Label)),
                    div()
                        .flex()
                        .items_center()
                        .gap(px(t.space.s2))
                        .px(px(t.space.s2))
                        .child(
                            Avatar::new("Ada Lovelace")
                                .avatar_size(AvatarSize::Sm)
                                .src(self.portrait.clone()),
                        )
                        .child(text("Ada Lovelace").variant(TextVariant::Detail)),
                )
            };
            Sidebar::new(id, "Places", places())
                .value(self.place.clone())
                .collapsed(collapsed)
                .header(header.h(px(t.pointer.list_row_compact)))
                .footer(footer.h(px(t.pointer.list_row_compact)))
                .on_change(move |value, window, cx| on_place(value, window, cx))
        };
        let place = PLACES
            .iter()
            .flat_map(|(_, items)| items.iter())
            .find(|(value, ..)| self.place.as_ref() == *value)
            .map_or("", |(_, label, ..)| label);
        let in_frame = |sidebar: Sidebar, width: f32| {
            div()
                .flex()
                .h(px(420.0))
                .w(px(width))
                .rounded(px(t.radius.md))
                .border(px(t.border.width_thin))
                .border_color(color(colors.border_default))
                .overflow_hidden()
                .child(sidebar)
                .child(
                    div()
                        .flex_1()
                        .p(px(t.space.s4))
                        .child(text(place).variant(TextVariant::Heading)),
                )
        };
        let report_menu = Menu::new("report-menu", "Report actions")
            .trigger(
                button("report-actions", "Actions")
                    .variant(ButtonVariant::Secondary)
                    .control_size(ControlSize::Md)
                    .icon_end(tokens::Icon::ChevronDown),
            )
            .default_open(self.overlay == Some(PreviewOverlay::Menu))
            .item(
                MenuItem::new("Rename")
                    .icon(tokens::Icon::Pencil)
                    .on_select(choose("Rename")),
            )
            .item(
                MenuItem::new("Duplicate")
                    .icon(tokens::Icon::Copy)
                    .on_select(choose("Duplicate")),
            )
            .item(
                MenuItem::new("Share")
                    .icon(tokens::Icon::Share2)
                    .disabled(true),
            )
            .separator()
            .item(
                MenuItem::new("Comfortable")
                    .icon(tokens::Icon::List)
                    .selected(self.density == "comfortable")
                    .on_select(density("comfortable")),
            )
            .item(
                MenuItem::new("Compact")
                    .icon(tokens::Icon::LayoutGrid)
                    .selected(self.density == "compact")
                    .on_select(density("compact")),
            )
            .separator()
            .item(
                MenuItem::new("Delete")
                    .icon(tokens::Icon::Trash)
                    .danger(true)
                    .on_select(choose("Delete")),
            );
        let more_menu = Menu::new("more-menu", "More actions")
            .align(MenuAlign::End)
            .trigger(
                icon_button("more-actions", tokens::Icon::Ellipsis, "More actions")
                    .variant(ButtonVariant::Secondary),
            )
            .item(MenuItem::new("Copy the link").on_select(choose("Copy the link")))
            .item(MenuItem::new("Open in a new window").on_select(choose("Open in a new window")));

        let delete_dialog = Dialog::new("delete-dialog", "Delete the weekly report?")
            .open(self.confirming)
            .description(
                "The report and its 12 comments are removed for everyone. This cannot be undone.",
            )
            .on_close(cx.listener(|this, (): &(), _, cx| {
                this.confirming = false;
                cx.notify();
            }))
            .action(
                button("delete-cancel", "Cancel")
                    .variant(ButtonVariant::Secondary)
                    .control_size(ControlSize::Md)
                    .on_click(cx.listener(|this, _, _, cx| {
                        this.confirming = false;
                        cx.notify();
                    })),
            )
            .action(
                button("delete-confirm", "Delete")
                    .variant(ButtonVariant::Danger)
                    .control_size(ControlSize::Md)
                    .on_click(cx.listener(|this, _, _, cx| {
                        this.confirming = false;
                        cx.notify();
                    })),
            );
        let question_dialog = Dialog::new("question-dialog", "Keep the changes?")
            .open(self.asking)
            .dismissible(false)
            .description("You edited the report in another window.")
            .on_close(cx.listener(|this, (): &(), _, cx| {
                this.asking = false;
                cx.notify();
            }))
            .action(
                button("question-discard", "Discard")
                    .variant(ButtonVariant::Secondary)
                    .control_size(ControlSize::Md)
                    .on_click(cx.listener(|this, _, _, cx| {
                        this.asking = false;
                        cx.notify();
                    })),
            )
            .action(
                button("question-keep", "Keep")
                    .variant(ButtonVariant::Primary)
                    .control_size(ControlSize::Md)
                    .on_click(cx.listener(|this, _, _, cx| {
                        this.asking = false;
                        cx.notify();
                    })),
            )
            .child(TextField::new("Name of the copy", &self.copy_name));

        let toast = Toast::new("draft-toast", "The draft was deleted.")
            .open(self.toast_open)
            .on_close(cx.listener(|this, (): &(), _, cx| {
                this.toast_open = false;
                cx.notify();
            }))
            .action(
                "Undo",
                cx.listener(|this, _, _, cx| {
                    this.draft_deleted = false;
                    cx.notify();
                }),
            )
            // A script keeps it, so its capture does not race the timer.
            .duration(if self.overlay == Some(PreviewOverlay::Toast) {
                Duration::ZERO
            } else {
                t.motion.duration_toast
            });

        // Stand-ins for a dark and a light picture, the same in both modes.
        let on_picture = |mode: tokens::Mode, badge: Badge| {
            div()
                .flex()
                .items_end()
                .justify_end()
                .w(px(140.0))
                .h(px(80.0))
                .p(px(t.space.s2))
                .rounded(px(t.radius.md))
                .border(px(t.border.width_thin))
                .border_color(color(colors.border_default))
                .bg(color(t.colors(mode).background_base))
                .child(badge)
        };

        // The banner does not hide itself: the preview does, and offers it back.
        let closable_banner = if self.banner_open {
            Banner::new("Storage is almost full. Remove files you no longer need, or add room.")
                .tone(BannerTone::Warning)
                .id("banner-storage")
                .title("action and dismiss")
                .action("Manage storage", |_, _, _| {})
                .on_dismiss(cx.listener(|this, _, _, cx| {
                    this.banner_open = false;
                    cx.notify();
                }))
                .dismiss_label("Dismiss the storage warning")
                .into_any_element()
        } else {
            row(t)
                .child(
                    button("banner-restore", "Show the dismissed banner")
                        .variant(ButtonVariant::Ghost)
                        .control_size(ControlSize::Sm)
                        .on_click(cx.listener(|this, _, _, cx| {
                            this.banner_open = true;
                            cx.notify();
                        })),
                )
                .into_any_element()
        };

        let folders = FOLDERS
            .into_iter()
            .enumerate()
            .map(|(index, (name, glyph))| {
                let folder = ListRow::new(("folder", index), name)
                    .compact()
                    .selected(self.folder == index)
                    .leading(icon(glyph).icon_size(IconSize::Sm))
                    .on_click(cx.listener(move |this, _, _, cx| {
                        this.folder = index;
                        cx.notify();
                    }));
                if index == 0 {
                    folder.trailing(CountBadge::new("folder-unread", 3).label("3 unread messages"))
                } else {
                    folder
                }
            })
            .collect::<Vec<_>>();

        let plans = PLANS
            .into_iter()
            .enumerate()
            .map(|(index, (name, terms))| {
                card(cx)
                    .w(px(260.0))
                    .selected(self.plan == index)
                    .on_press(
                        ("plan", index),
                        cx.listener(move |this, _, _, cx| {
                            this.plan = index;
                            cx.notify();
                        }),
                    )
                    .child(text(name).variant(TextVariant::Heading))
                    .child(
                        text(terms)
                            .variant(TextVariant::Body)
                            .text_color(color(secondary)),
                    )
            })
            .collect::<Vec<_>>();

        let banners = [
            (BannerTone::Info, "info"),
            (BannerTone::Success, "success"),
            (BannerTone::Warning, "warning"),
            (BannerTone::Danger, "danger"),
        ]
        .map(|(tone, name)| {
            Banner::new(
                "Your changes are saved on this device. They sync when you are back online.",
            )
            .tone(tone)
            .title(name)
        });

        let page = div()
            .flex()
            .flex_col()
            .gap(px(t.space.s12))
            .p(px(t.space.s6))
            .child(header)
            .child(section("Colors", t).children(color_groups))
            .child(section("Typography", t).children(texts))
            .child(
                section("Space, radius, size", t)
                    .child(labelled("space", secondary, t).children(spaces))
                    .child(labelled("radius", secondary, t).children(radii))
                    .child(
                        labelled("control", secondary, t)
                            .child(text(sizes).variant(TextVariant::Detail)),
                    ),
            )
            .child(
                section("Icons", t)
                    .child(
                        div()
                            .flex()
                            .flex_wrap()
                            .gap(px(t.space.s4))
                            .children(tokens::Icon::ALL.map(|name| icon(name).icon_size(IconSize::Md))),
                    )
                    .child(
                        labelled("sizes", secondary, t).child(
                            div().flex().items_end().gap(px(t.space.s3)).children(
                                [
                                    IconSize::Xs,
                                    IconSize::Sm,
                                    IconSize::Md,
                                    IconSize::Lg,
                                    IconSize::Xl,
                                ]
                                .map(|size| icon(tokens::Icon::House).icon_size(size)),
                            ),
                        ),
                    )
                    .child(
                        labelled("filled", secondary, t).child(
                            // Icons made of closed shapes, which is what the filled drawing is for.
                            div()
                                .flex()
                                .items_center()
                                .gap(px(t.space.s3))
                                .children(
                                    [
                                        tokens::Icon::Heart,
                                        tokens::Icon::Star,
                                        tokens::Icon::Bookmark,
                                        tokens::Icon::ThumbsUp,
                                        tokens::Icon::Bell,
                                    ]
                                    .map(|name| {
                                        div()
                                            .flex()
                                            .gap(px(t.space.s1))
                                            .child(icon(name).icon_size(IconSize::Md))
                                            .child(icon_filled(name).icon_size(IconSize::Md))
                                    }),
                                ),
                        ),
                    ),
            )
            .child(
                section("Buttons", t)
                    .children(buttons)
                    .child(icon_buttons)
                    .child(toggles)
                    .children(icon_button_rows)
                    .child(icon_toggles)
                    .child(tooltips),
            )
            .child(
                section("Text fields", t)
                    .child(
                        TextField::new("Email", &self.email)
                            .description("We send the sign-in code to this address."),
                    )
                    .child(
                        TextField::new("Sign-in code", &self.code)
                            .error(Some("That code is wrong or has expired.")),
                    )
                    .child(TextField::new("Organization", &self.organization).disabled(true))
                    .child(
                        TextField::new("Search", &self.search)
                            .leading(icon(tokens::Icon::Search).icon_size(IconSize::Sm)),
                    )
                    .child(TextField::new("Weight", &self.weight).trailing("kg"))
                    .child(
                        TextField::new("Handle", &self.handle)
                            .leading("@")
                            .description("Letters and digits.")
                            .max_length(20),
                    )
                    .child(
                        TextField::multiline("About", &self.about)
                            .description("Shown on your profile.")
                            .max_length(120),
                    )
                    .child(
                        TextField::multiline("Message", &self.message)
                            .rows(2)
                            .leading(icon(tokens::Icon::Mail).icon_size(IconSize::Sm))
                            .error(Some("Write a message before you send it.")),
                    )
                    .children(search_fields)
                    .child(text(searched).variant(TextVariant::Detail).text_color(color(secondary))),
            )
            .child(
                section("Controls", t)
                    .child(selects)
                    .child(date_pickers)
                    .child(date_range_pickers)
                    .child(sliders),
            )
            .child(
                section("Selection", t)
                    .child(
                        labelled("switch", secondary, t)
                            .child(
                                switch("notifications", self.notifications)
                                    .label("Notifications")
                                    .on_click(cx.listener(|this, checked: &bool, _, cx| {
                                        this.notifications = *checked;
                                        cx.notify();
                                    })),
                            )
                            .child(switch("switch-off", false).label("Off"))
                            .child(switch("switch-locked", true).label("Locked").disabled(true)),
                    )
                    .child(
                        labelled("checkbox", secondary, t)
                            .child(
                                checkbox("remember", self.remember)
                                    .label("Remember me")
                                    .on_click(cx.listener(|this, checked: &bool, _, cx| {
                                        this.remember = *checked;
                                        cx.notify();
                                    })),
                            )
                            .child(checkbox("checkbox-off", false).label("Unchecked"))
                            .child(
                                checkbox("checkbox-locked", true)
                                    .label("Locked")
                                    .disabled(true),
                            ),
                    )
                    .child(
                        labelled("segmented", secondary, t).child(
                            SegmentedControl::new("view", VIEWS)
                                .selected(self.view)
                                .on_change(cx.listener(|this, index: &usize, _, cx| {
                                    this.view = *index;
                                    cx.notify();
                                })),
                        ),
                    )
                    .child(radio_groups),
            )
            .child(
                section("Chips", t).child(state_chips).child(
                    labelled("bar", secondary, t).child(
                        // Narrower than its chips, so the row has to scroll.
                        div().flex_1().min_w_0().max_w(px(448.0)).child(
                            ChipBar::new("filters", "Filter the tasks").children(filter_chips),
                        ),
                    ),
                ),
            )
            .child(
                section("Tabs", t)
                    .child(
                        tabs("tabs-icons", "Workspace pages", pages(PAGES.len(), true))
                            .value(self.page.clone()),
                    )
                    .child(
                        tabs(
                            "tabs-plain",
                            "Workspace pages, without icons",
                            pages(PAGES.len(), false),
                        )
                        .value(self.page.clone()),
                    )
                    .child(
                        tabs("tabs-full", "Workspace pages, full width", pages(3, true))
                            .value(short_page)
                            .full_width(true),
                    )
                    .child(
                        // Narrower than its tabs, so the row has to scroll.
                        div().w(px(320.0)).child(
                            tabs(
                                "tabs-scrolling",
                                "Workspace pages, scrolling",
                                pages(PAGES.len(), true),
                            )
                            .value(self.page.clone()),
                        ),
                    ),
            )
            .child(
                section("Badges", t)
                    .child(
                        labelled("tone", secondary, t)
                            .child(Badge::new("neutral"))
                            .child(Badge::new("accent").tone(BadgeTone::Accent))
                            .child(Badge::new("success").tone(BadgeTone::Success))
                            .child(Badge::new("warning").tone(BadgeTone::Warning))
                            .child(Badge::new("danger").tone(BadgeTone::Danger)),
                    )
                    .child(
                        labelled("dot", secondary, t)
                            .child(Badge::new("Online").tone(BadgeTone::Success).dot())
                            .child(Badge::new("Connecting").tone(BadgeTone::Warning).dot())
                            .child(Badge::new("Offline").tone(BadgeTone::Danger).dot()),
                    )
                    .child(
                        labelled("icon", secondary, t)
                            .child(
                                Badge::new("Verified")
                                    .tone(BadgeTone::Success)
                                    .icon(tokens::Icon::CircleCheck),
                            )
                            .child(Badge::new("4.8").icon(tokens::Icon::Star))
                            .child(
                                Badge::new("Private")
                                    .tone(BadgeTone::Accent)
                                    .icon(tokens::Icon::Lock),
                            ),
                    )
                    .child(
                        labelled("overlay", secondary, t)
                            .child(on_picture(
                                tokens::Mode::Dark,
                                Badge::new("12:04").tone(BadgeTone::Overlay),
                            ))
                            .child(on_picture(
                                tokens::Mode::Light,
                                Badge::new("Live")
                                    .tone(BadgeTone::Overlay)
                                    .icon(tokens::Icon::Play),
                            )),
                    )
                    .child(
                        labelled("count", secondary, t)
                            .gap(px(t.space.s5))
                            .child(CountBadge::new("count-3", 3))
                            .child(CountBadge::new("count-120", 120))
                            .child(
                                CountBadge::new("count-bell", 3)
                                    .label("3 unread notifications")
                                    .child(icon(tokens::Icon::Bell).icon_size(IconSize::Lg)),
                            )
                            .child(
                                CountBadge::new("count-avatar", 120)
                                    .child(Avatar::new("Ada Lovelace")),
                            )
                            .child(
                                // Nothing to count: only what it would sit on is drawn.
                                CountBadge::new("count-none", 0)
                                    .child(icon(tokens::Icon::Mail).icon_size(IconSize::Lg)),
                            ),
                    ),
            )
            .child(section("Banners", t).children(banners).child(closable_banner))
            .child(
                section("Card", t)
                    .child(
                        card(cx)
                            .child(text("Weekly report").variant(TextVariant::Heading))
                            .child(
                                text("A card groups related content.").variant(TextVariant::Body)
                                    .text_color(color(secondary)),
                            )
                            .child(divider(cx))
                            .child(
                                labelled("avatar", secondary, t)
                                    .child(Avatar::new("Ada Lovelace").avatar_size(AvatarSize::Sm))
                                    .child(Avatar::new("Ada Lovelace"))
                                    .child(Avatar::new("Grace Hopper").avatar_size(AvatarSize::Lg))
                                    .child(Avatar::new("Katherine Johnson").avatar_size(AvatarSize::Xl)),
                            )
                            .child(
                                labelled("picture", secondary, t)
                                    .child(Avatar::new("Ada Lovelace").src(self.portrait.clone()))
                                    .child(
                                        Avatar::new("Ada Lovelace")
                                            .avatar_size(AvatarSize::Xl)
                                            .src(self.portrait.clone()),
                                    )
                                    .child(
                                        // No such file: the initials stay.
                                        Avatar::new("Grace Hopper")
                                            .avatar_size(AvatarSize::Xl)
                                            .src(PathBuf::from("/acme/missing/portrait.png")),
                                    ),
                            )
                            .child(
                                labelled("stack", secondary, t)
                                    .gap(px(t.space.s5))
                                    .child(AvatarStack::new(
                                        "stack-three",
                                        [
                                            Person::new(TEAM[0]).src(self.portrait.clone()),
                                            Person::new(TEAM[1]),
                                            Person::new(TEAM[2]),
                                        ],
                                    ))
                                    .child(AvatarStack::new("stack-seven", TEAM))
                                    .child(
                                        AvatarStack::new("stack-small", TEAM)
                                            .avatar_size(AvatarSize::Sm)
                                            .max(3)
                                            .label("The team"),
                                    ),
                            )
                            .child(
                                labelled("progress", secondary, t)
                                    .child(div().w(px(320.0)).child(ProgressBar::new(0.6))),
                            )
                            .child(
                                labelled("spinner", secondary, t)
                                    .child(spinner().spinner_size(SpinnerSize::Sm))
                                    .child(spinner().spinner_size(SpinnerSize::Md))
                                    .child(spinner().spinner_size(SpinnerSize::Lg)),
                            ),
                    )
                    .child(
                        row(t)
                            .items_start()
                            .gap(px(t.space.s4))
                            .child(
                                card(cx)
                                    .w(px(260.0))
                                    .media(
                                        img(self.landscape.clone())
                                            .w_full()
                                            .h(px(120.0))
                                            .object_fit(ObjectFit::Cover),
                                    )
                                    .child(text("With media").variant(TextVariant::Heading))
                                    .child(
                                        text("The picture runs edge to edge.").variant(TextVariant::Body)
                                        .text_color(color(secondary)),
                                    ),
                            )
                            .children(plans),
                    ),
            )
            .child(
                section("List", t)
                    .child(
                        // Rows bring their own padding, and the dividers run edge to edge.
                        card(cx)
                            .p(px(0.0))
                            .gap(px(0.0))
                            .overflow_hidden()
                            .child(
                                ListRow::new("row-person", "Ada Lovelace")
                                    .description("ada@example.com")
                                    .leading(Avatar::new("Ada Lovelace"))
                                    .trailing(Badge::new("Owner").tone(BadgeTone::Accent)),
                            )
                            .child(divider(cx))
                            .child(
                                ListRow::new("row-account", "Account")
                                    .description("The selected row")
                                    .selected(true)
                                    .chevron()
                                    .on_click(|_, _, _| {}),
                            )
                            .child(divider(cx))
                            .child(
                                ListRow::new("row-notifications", "Notifications")
                                    .description("Mentions and replies")
                                    .trailing(switch("row-switch", self.notifications).on_click(
                                        cx.listener(|this, checked: &bool, _, cx| {
                                            this.notifications = *checked;
                                            cx.notify();
                                        }),
                                    )),
                            )
                            .child(divider(cx))
                            .child(
                                ListRow::new("row-language", "Language")
                                    .trailing(
                                        text("English").variant(TextVariant::Body)
                                            .text_color(color(secondary)),
                                    )
                                    .chevron()
                                    .on_click(|_, _, _| {}),
                            )
                            .child(divider(cx))
                            .child(
                                ListRow::new("row-storage", "Storage")
                                    .description("Unavailable offline")
                                    .chevron()
                                    .disabled(true)
                                    .on_click(|_, _, _| {}),
                            ),
                    )
                    .child(
                        // Compact rows, as in a menu or a sidebar. Click one to select it. The
                        // room above and below keeps a selected row clear of the round corners.
                        card(cx)
                            .w(px(260.0))
                            .px(px(0.0))
                            .py(px(t.space.s2))
                            .gap(px(0.0))
                            .children(folders),
                    ),
            )
            .child(
                self.mark_overlay(
                    PreviewOverlay::Menu,
                    section("Menu", t).child(
                        labelled("menu", secondary, t)
                            .child(report_menu)
                            .child(more_menu)
                            .child(
                                text(format!("{} Density: {}.", self.chosen, self.density)).variant(TextVariant::Detail)
                                .text_color(color(secondary)),
                            ),
                    ),
                ),
            )
            .child(
                section("Dialog", t)
                    .child(
                        labelled("dialog", secondary, t)
                            .child(
                                button("open-delete-dialog", "Delete the report").variant(ButtonVariant::Danger).control_size(ControlSize::Md)
                                .on_click(cx.listener(
                                    |this, _, _, cx| {
                                        this.confirming = true;
                                        cx.notify();
                                    },
                                )),
                            )
                            .child(
                                button("open-question-dialog", "A question that must be answered").variant(ButtonVariant::Secondary).control_size(ControlSize::Md)
                                .on_click(cx.listener(
                                    |this, _, _, cx| {
                                        this.asking = true;
                                        cx.notify();
                                    },
                                )),
                            ),
                    )
                    .child(delete_dialog)
                    .child(question_dialog),
            )
            .child(
                section("Toast", t)
                    .child(
                        labelled("toast", secondary, t)
                            .child(
                                button("show-toast", "Delete a draft").variant(ButtonVariant::Secondary).control_size(ControlSize::Md)
                                .on_click(cx.listener(
                                    |this, _, _, cx| {
                                        this.draft_deleted = true;
                                        this.toast_open = true;
                                        cx.notify();
                                    },
                                )),
                            )
                            .child(
                                text(if self.draft_deleted {
                                        "The draft is deleted."
                                    } else {
                                        "The draft is back."
                                    }).variant(TextVariant::Detail)
                                .text_color(color(secondary)),
                            ),
                    )
                    .child(toast),
            )
            .child(
                section("Skeleton", t)
                    .child(
                        labelled("shape", secondary, t)
                            .child(
                                div()
                                    .flex()
                                    .flex_col()
                                    .gap(px(t.space.s2))
                                    .w(px(192.0))
                                    .child(Skeleton::new("skeleton-line"))
                                    .child(
                                        Skeleton::new("skeleton-line-short").width(relative(0.6)),
                                    ),
                            )
                            .child(
                                Skeleton::new("skeleton-rect")
                                    .shape(SkeletonShape::Rect)
                                    .width(px(96.0))
                                    .height(px(64.0)),
                            )
                            .child(
                                Skeleton::new("skeleton-circle")
                                    .shape(SkeletonShape::Circle)
                                    .width(px(40.0)),
                            ),
                    )
                    .child(
                        card(cx).w(px(384.0)).child(
                            // The view says that it is loading, once, since the placeholders
                            // say nothing.
                            div()
                                .id("loading-report")
                                .role(Role::Status)
                                .aria_label("Loading the report")
                                .flex()
                                .flex_col()
                                .gap(px(t.space.s4))
                                .child(
                                    Skeleton::new("loading-picture")
                                        .shape(SkeletonShape::Rect)
                                        .height(px(128.0)),
                                )
                                .child(
                                    div()
                                        .flex()
                                        .items_center()
                                        .gap(px(t.space.s3))
                                        .child(
                                            Skeleton::new("loading-avatar")
                                                .shape(SkeletonShape::Circle)
                                                .width(px(40.0)),
                                        )
                                        .child(
                                            div()
                                                .flex_1()
                                                .flex()
                                                .flex_col()
                                                .gap(px(t.space.s2))
                                                .child(
                                                    Skeleton::new("loading-title")
                                                        .width(relative(0.7)),
                                                )
                                                .child(
                                                    Skeleton::new("loading-detail")
                                                        .width(relative(0.4)),
                                                ),
                                        ),
                                ),
                        ),
                    ),
            )
            .child(
                section("Media", t)
                    .child(
                        SectionHeader::new("media-header", "Continue watching")
                            .action("See all", |_, _, _| {}),
                    )
                    .child(ratios)
                    .child(thumbnail_states)
                    .child(media_cards)
                    .child(
                        text(self.opened.clone()).variant(TextVariant::Detail)
                            .text_color(color(secondary)),
                    )
                    .child(
                        labelled("header", secondary, t).child(
                            div().flex_1().child(
                                SectionHeader::new("header-recommended", "Recommended for you")
                                    .icon(tokens::Icon::Sparkles)
                                    .description("Picked from what you watched this week.")
                                    .action("See all", |_, _, _| {})
                                    .level(3),
                            ),
                        ),
                    ),
            )
            .child(
                section("Empty state", t).child(
                    card(cx).child(
                        EmptyState::new(tokens::Icon::Search, "No results")
                            .description(
                                "Nothing matches “night hikes”. Check the spelling, or search for something else.",
                            )
                            .action(button("empty-clear", "Clear the search").variant(ButtonVariant::Secondary).control_size(ControlSize::Md)),
                    ),
                ),
            )
            .child(
                section("Accordion", t)
                    .child(
                        labelled("single", secondary, t).items_start().child(
                            div().flex_1().max_w(px(560.0)).child(
                                Accordion::new(
                                    "questions",
                                    QUESTIONS.map(|(value, title, answer)| {
                                        AccordionItem::new(value, title, answer)
                                    }),
                                )
                                .expanded(self.faq.clone())
                                .on_change(cx.listener(
                                    |this, open: &[SharedString], _, cx| {
                                        this.faq = open.to_vec();
                                        cx.notify();
                                    },
                                )),
                            ),
                        ),
                    )
                    .child(
                        labelled("multiple", secondary, t).items_start().child(
                            div().flex_1().max_w(px(560.0)).child(
                                Accordion::new(
                                    "settings",
                                    SETTINGS.map(|(value, title, summary, body)| {
                                        AccordionItem::new(value, title, body).description(summary)
                                    }),
                                )
                                .multiple(true)
                                .expanded(self.settings_open.clone())
                                .on_change(cx.listener(
                                    |this, open: &[SharedString], _, cx| {
                                        this.settings_open = open.to_vec();
                                        cx.notify();
                                    },
                                )),
                            ),
                        ),
                    ),
            )
            .child(
                section("Sidebar", t).child(
                    row(t)
                        .items_start()
                        .gap(px(t.space.s4))
                        .child(in_frame(sidebar("sidebar-open", false), 460.0))
                        .child(in_frame(sidebar("sidebar-rail", true), 280.0)),
                ),
            );

        div()
            .id("design-preview")
            .size_full()
            .overflow_y_scroll()
            .track_scroll(&self.scroll)
            .bg(color(colors.background_base))
            .text_color(color(colors.text_primary))
            .child(page)
    }
}

#[cfg(test)]
mod tests {
    use super::{COMPONENT_COLORS, PreviewOverlay};

    #[test]
    fn an_overlay_is_named_as_on_the_web() {
        assert_eq!("menu".parse(), Ok(PreviewOverlay::Menu));
        assert_eq!("select".parse(), Ok(PreviewOverlay::Select));
        assert_eq!("datepicker".parse(), Ok(PreviewOverlay::DatePicker));
        assert_eq!("daterange".parse(), Ok(PreviewOverlay::DateRange));
        assert_eq!("dialog".parse(), Ok(PreviewOverlay::Dialog));
        assert_eq!("toast".parse(), Ok(PreviewOverlay::Toast));
        assert_eq!("tooltip".parse(), Ok(PreviewOverlay::Tooltip));
        "sheet".parse::<PreviewOverlay>().unwrap_err();
    }

    #[test]
    fn every_component_color_is_left_out_of_the_swatches() {
        let colors = acme_tokens::DEFAULT_THEME.colors(acme_tokens::Mode::Light);
        for group in [
            "chip",
            "tabs",
            "menu",
            "date-picker",
            "dialog",
            "toast",
            "tooltip",
            "skeleton",
            "radio",
            "slider",
            "thumbnail",
            "sidebar",
            "empty-state",
            "accordion",
        ] {
            let names = colors
                .entries()
                .into_iter()
                .map(|(name, _)| name)
                .filter(|name| name.starts_with(&format!("{group}-")))
                .collect::<Vec<_>>();
            assert!(!names.is_empty(), "no `{group}` colors");
            for name in names {
                assert!(
                    COMPONENT_COLORS
                        .iter()
                        .any(|prefix| name.starts_with(prefix)),
                    "`{name}` is shown as a swatch"
                );
            }
        }
    }
}
