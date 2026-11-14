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
use gpui_kit::base::ElementExt;
use gpui_kit::component::{
    Disableable,
    input::{InputState, TextareaState},
};
use gpui_kit::{
    App, AppContext, Bounds, ClickEvent, Context, Div, Entity, Image, ImageFormat,
    InteractiveElement, IntoElement, ObjectFit, ParentElement, Pixels, Render, Role, ScrollHandle,
    SharedString, StatefulInteractiveElement, Styled, StyledImage, Window, WindowBounds,
    WindowOptions, div, img, point, px, relative, size,
};

use crate::{
    Avatar, AvatarSize, AvatarStack, Badge, BadgeTone, Banner, BannerTone, ButtonVariant, Chip,
    ChipBar, ControlSize, CountBadge, Dialog, IconSize, ListRow, Menu, MenuAlign, MenuItem, Person,
    ProgressBar, SearchField, SegmentedControl, Skeleton, SkeletonShape, SpinnerSize, TabItem,
    Tabs, TextField, Toast, TooltipPlacement, TypographyExt, button, card, checkbox, color,
    divider, icon, icon_button, icon_filled, mode, palette, set_mode, spinner, switch, text,
    tooltip,
};

/// Component colors are shown by the components that use them, not as swatches.
const COMPONENT_COLORS: [&str; 21] = [
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
    "dialog-",
    "toast-",
    "tooltip-",
    "skeleton-",
];

/// An overlay the preview shows open from the start, for a script that takes screenshots and
/// cannot press anything: `acme --design --open menu`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PreviewOverlay {
    Menu,
    Dialog,
    Toast,
    Tooltip,
}

impl FromStr for PreviewOverlay {
    type Err = String;

    fn from_str(name: &str) -> Result<Self, Self::Err> {
        match name {
            "menu" => Ok(Self::Menu),
            "dialog" => Ok(Self::Dialog),
            "toast" => Ok(Self::Toast),
            "tooltip" => Ok(Self::Tooltip),
            _ => Err(format!(
                "there is no overlay called `{name}`: use menu, dialog, toast or tooltip"
            )),
        }
    }
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

fn portrait() -> Arc<Image> {
    let c = tokens::colors(tokens::Mode::Light);
    picture(format!(
        r#"<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 120 120"><rect width="120" height="120" fill="{wall}"/><circle cx="60" cy="48" r="22" fill="{face}"/><path d="M14 120c0-28 20-44 46-44s46 16 46 44z" fill="{coat}"/></svg>"#,
        wall = rgb(c.accent_subtle_pressed),
        face = rgb(c.background_base),
        coat = rgb(c.accent_default),
    ))
}

fn landscape() -> Arc<Image> {
    let c = tokens::colors(tokens::Mode::Light);
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

const TEXT_STYLES: [(&str, tokens::Typography); 8] = [
    ("display", tokens::TYPOGRAPHY_DISPLAY),
    ("title", tokens::TYPOGRAPHY_TITLE),
    ("heading", tokens::TYPOGRAPHY_HEADING),
    ("body", tokens::TYPOGRAPHY_BODY),
    ("body-strong", tokens::TYPOGRAPHY_BODY_STRONG),
    ("label", tokens::TYPOGRAPHY_LABEL),
    ("detail", tokens::TYPOGRAPHY_DETAIL),
    ("footnote", tokens::TYPOGRAPHY_FOOTNOTE),
];

const SPACES: [(&str, f32); 13] = [
    ("0.5", tokens::SPACE_0_5),
    ("1", tokens::SPACE_1),
    ("1.5", tokens::SPACE_1_5),
    ("2", tokens::SPACE_2),
    ("2.5", tokens::SPACE_2_5),
    ("3", tokens::SPACE_3),
    ("4", tokens::SPACE_4),
    ("5", tokens::SPACE_5),
    ("6", tokens::SPACE_6),
    ("8", tokens::SPACE_8),
    ("10", tokens::SPACE_10),
    ("12", tokens::SPACE_12),
    ("16", tokens::SPACE_16),
];

const RADII: [(&str, f32); 5] = [
    ("sm", tokens::RADIUS_SM),
    ("md", tokens::RADIUS_MD),
    ("lg", tokens::RADIUS_LG),
    ("xl", tokens::RADIUS_XL),
    ("full", tokens::RADIUS_FULL),
];

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
            portrait: portrait(),
            landscape: landscape(),
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

    /// Opens the preview scrolled `offset` pixels down, with `overlay` open. A menu and a
    /// tooltip open beside their control, so without an offset the preview starts at that
    /// control. A toast opened this way stays until it is closed, so a capture does not race
    /// its timer.
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
            cx.new(|cx| {
                let mut preview = Self::new(window, cx);
                preview.start_at = (offset > 0.0).then_some(offset);
                preview.overlay = overlay;
                preview.confirming = overlay == Some(PreviewOverlay::Dialog);
                preview.toast_open = overlay == Some(PreviewOverlay::Toast);
                preview.find_overlay = preview.start_at.is_none()
                    && matches!(
                        overlay,
                        Some(PreviewOverlay::Menu | PreviewOverlay::Tooltip)
                    );
                preview
            })
        })
        .expect("the design preview window could not open");
        cx.activate(true);
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

fn row() -> Div {
    div()
        .flex()
        .flex_wrap()
        .items_center()
        .gap(px(tokens::SPACE_3))
}

fn section(title: &'static str) -> Div {
    div()
        .flex()
        .flex_col()
        .gap(px(tokens::SPACE_4))
        .child(text(title, tokens::TYPOGRAPHY_TITLE))
}

/// A row with its name on the left, as in a specification sheet.
fn labelled(label: impl Into<SharedString>, secondary: tokens::Color) -> Div {
    row().child(
        div()
            .flex_none()
            .w(px(120.0))
            .typography(tokens::TYPOGRAPHY_DETAIL)
            .text_color(color(secondary))
            .child(label.into()),
    )
}

impl Render for DesignPreview {
    fn render(&mut self, window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
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
                    self.start_at = Some((f32::from(top) - tokens::SPACE_16).max(0.0));
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

        let header = row()
            .justify_between()
            .child(text("Acme design system", tokens::TYPOGRAPHY_DISPLAY))
            .child(
                button(
                    "toggle-mode",
                    if dark { "Light mode" } else { "Dark mode" },
                    ButtonVariant::Ghost,
                    ControlSize::Sm,
                    cx,
                )
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
                row()
                    .w(px(210.0))
                    .gap(px(tokens::SPACE_2))
                    .child(
                        div()
                            .flex_none()
                            .size(px(28.0))
                            .rounded(px(tokens::RADIUS_SM))
                            .border(px(tokens::BORDER_WIDTH_THIN))
                            .border_color(color(colors.border_default))
                            .bg(color(value)),
                    )
                    .child(
                        div()
                            .typography(tokens::TYPOGRAPHY_FOOTNOTE)
                            .text_color(color(secondary))
                            .child(name),
                    )
            });
            div()
                .flex()
                .flex_col()
                .gap(px(tokens::SPACE_2))
                .child(text(group, tokens::TYPOGRAPHY_LABEL).text_color(color(secondary)))
                .child(row().gap(px(tokens::SPACE_2)).children(swatches))
        });

        let texts = TEXT_STYLES.map(|(name, style)| {
            labelled(format!("{name} {}", style.size), secondary).child(text(
                "다람쥐 헌 쳇바퀴에 타고파. The quick brown fox 123",
                style,
            ))
        });

        let spaces = SPACES.map(|(name, value)| {
            div()
                .flex()
                .flex_col()
                .items_center()
                .gap(px(tokens::SPACE_1))
                .child(div().size(px(value)).bg(color(colors.accent_default)))
                .child(text(name, tokens::TYPOGRAPHY_FOOTNOTE).text_color(color(secondary)))
        });
        let radii = RADII.map(|(name, value)| {
            div()
                .flex()
                .items_center()
                .justify_center()
                .size(px(48.0))
                .rounded(px(value))
                .border(px(tokens::BORDER_WIDTH_THIN))
                .border_color(color(colors.border_strong))
                .typography(tokens::TYPOGRAPHY_FOOTNOTE)
                .text_color(color(secondary))
                .child(name)
        });
        let sizes = format!(
            "Pointer {}/{}/{}, touch {}/{}/{}. The desktop app uses the pointer sizes.",
            tokens::POINTER.control_sm,
            tokens::POINTER.control_md,
            tokens::POINTER.control_lg,
            tokens::TOUCH.control_sm,
            tokens::TOUCH.control_md,
            tokens::TOUCH.control_lg,
        );

        let buttons = VARIANTS.map(|(name, variant)| {
            labelled(name, secondary)
                .child(button((name, 0usize), "Save", variant, ControlSize::Sm, cx))
                .child(button((name, 1usize), "Save", variant, ControlSize::Md, cx))
                .child(button((name, 2usize), "Save", variant, ControlSize::Lg, cx))
                .child(
                    button((name, 3usize), "Disabled", variant, ControlSize::Md, cx).disabled(true),
                )
                .child(button((name, 4usize), "Saving", variant, ControlSize::Md, cx).loading(true))
        });
        let icon_buttons = labelled("icons", secondary)
            .child(
                button(
                    "icon-sm",
                    "New",
                    ButtonVariant::Primary,
                    ControlSize::Sm,
                    cx,
                )
                .icon_start(tokens::Icon::Plus),
            )
            .child(
                button(
                    "icon-md",
                    "Filter",
                    ButtonVariant::Secondary,
                    ControlSize::Md,
                    cx,
                )
                .icon_start(tokens::Icon::ListFilter),
            )
            .child(
                button(
                    "icon-lg",
                    "Continue",
                    ButtonVariant::Primary,
                    ControlSize::Lg,
                    cx,
                )
                .icon_end(tokens::Icon::ArrowRight),
            )
            .child(
                button(
                    "icon-both",
                    "Search",
                    ButtonVariant::Ghost,
                    ControlSize::Md,
                    cx,
                )
                .icon_start(tokens::Icon::Search)
                .icon_end(tokens::Icon::ChevronRight),
            )
            .child(
                button(
                    "icon-disabled",
                    "Filter",
                    ButtonVariant::Secondary,
                    ControlSize::Md,
                    cx,
                )
                .icon_start(tokens::Icon::ListFilter)
                .disabled(true),
            )
            .child(
                // The spinner stands where the icon was, so this one is as wide as "Filter".
                button(
                    "icon-loading",
                    "Filter",
                    ButtonVariant::Secondary,
                    ControlSize::Md,
                    cx,
                )
                .icon_start(tokens::Icon::ListFilter)
                .loading(true),
            );
        let toggles = labelled("selected", secondary)
            .child(
                button(
                    "like",
                    "Like",
                    ButtonVariant::Secondary,
                    ControlSize::Md,
                    cx,
                )
                .icon_start(tokens::Icon::Heart)
                .selected(self.liked)
                .on_click(cx.listener(|this, _, _, cx| {
                    this.liked = !this.liked;
                    cx.notify();
                })),
            )
            .child(
                button(
                    "like-off",
                    "Like",
                    ButtonVariant::Secondary,
                    ControlSize::Md,
                    cx,
                )
                .icon_start(tokens::Icon::Heart)
                .selected(false),
            )
            .child(
                button("save", "Save", ButtonVariant::Ghost, ControlSize::Md, cx)
                    .icon_start(tokens::Icon::Bookmark)
                    .selected(self.saved)
                    .on_click(cx.listener(|this, _, _, cx| {
                        this.saved = !this.saved;
                        cx.notify();
                    })),
            )
            .child(
                button(
                    "save-off",
                    "Save",
                    ButtonVariant::Ghost,
                    ControlSize::Md,
                    cx,
                )
                .icon_start(tokens::Icon::Bookmark)
                .selected(false),
            )
            .child(
                button(
                    "like-disabled",
                    "Like",
                    ButtonVariant::Secondary,
                    ControlSize::Md,
                    cx,
                )
                .icon_start(tokens::Icon::Heart)
                .selected(true)
                .disabled(true),
            )
            .child(
                // Primary and danger buttons keep their look and only report the state.
                button(
                    "follow",
                    "Following",
                    ButtonVariant::Primary,
                    ControlSize::Md,
                    cx,
                )
                .icon_start(tokens::Icon::UserCheck)
                .selected(true),
            );

        let icon_button_rows = VARIANTS.map(|(name, variant)| {
            let settings = |index: usize, label: &'static str| {
                icon_button((name, index), tokens::Icon::Settings, label, cx).variant(variant)
            };
            labelled(format!("icon, {name}"), secondary)
                .child(settings(10, "Settings, sm").control_size(ControlSize::Sm))
                .child(settings(11, "Settings, md"))
                .child(settings(12, "Settings, lg").control_size(ControlSize::Lg))
                .child(settings(13, "Disabled").disabled(true))
                .child(settings(14, "Loading").loading(true))
        });
        let icon_toggles = labelled("icon, selected", secondary)
            .child(
                icon_button("icon-pin", tokens::Icon::Pin, "Pin", cx)
                    .selected(self.pinned)
                    .on_click(cx.listener(|this, _, _, cx| {
                        this.pinned = !this.pinned;
                        cx.notify();
                    })),
            )
            .child(icon_button("icon-pin-off", tokens::Icon::Pin, "Pin", cx).selected(false))
            .child(
                icon_button("icon-star", tokens::Icon::Star, "Star", cx)
                    .variant(ButtonVariant::Secondary)
                    .selected(true),
            )
            .child(
                icon_button("icon-star-off", tokens::Icon::Star, "Star", cx)
                    .variant(ButtonVariant::Secondary)
                    .selected(false),
            )
            .child(
                icon_button("icon-like-sm", tokens::Icon::Heart, "Like", cx)
                    .control_size(ControlSize::Sm)
                    .selected(true),
            )
            .child(
                icon_button("icon-like-lg", tokens::Icon::Heart, "Like", cx)
                    .control_size(ControlSize::Lg)
                    .selected(true),
            )
            .child(
                icon_button("icon-save-disabled", tokens::Icon::Bookmark, "Save", cx)
                    .selected(true)
                    .disabled(true),
            )
            .child(
                // Primary and danger buttons keep their look and only report the state.
                icon_button("icon-notify", tokens::Icon::Bell, "Notify", cx)
                    .variant(ButtonVariant::Primary)
                    .selected(true),
            );
        let tooltips = self.mark_overlay(
            PreviewOverlay::Tooltip,
            labelled("tooltip", secondary)
                .child(
                    tooltip(
                        "tooltip-search",
                        "Search",
                        icon_button("tooltip-search-button", tokens::Icon::Search, "Search", cx),
                    )
                    .shortcut("⌘K")
                    .pinned(self.overlay == Some(PreviewOverlay::Tooltip)),
                )
                .child(
                    tooltip(
                        "tooltip-share",
                        "Share",
                        icon_button("tooltip-share-button", tokens::Icon::Share2, "Share", cx)
                            .variant(ButtonVariant::Secondary),
                    )
                    .placement(TooltipPlacement::Bottom),
                )
                .child(tooltip(
                    "tooltip-export",
                    "Export as a spreadsheet",
                    button(
                        "tooltip-export-button",
                        "Export",
                        ButtonVariant::Secondary,
                        ControlSize::Md,
                        cx,
                    )
                    .icon_start(tokens::Icon::Download),
                ))
                .child(
                    text(
                        "Rest the pointer on a control, or focus it with the keyboard.",
                        tokens::TYPOGRAPHY_DETAIL,
                    )
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
            None => "Enter searches.".to_string(),
        };

        let state_chips = labelled("state", secondary).child(
            // A row of its own, so the chips that wrap line up with the first ones.
            row()
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
        let report_menu = Menu::new("report-menu", "Report actions")
            .trigger(
                button(
                    "report-actions",
                    "Actions",
                    ButtonVariant::Secondary,
                    ControlSize::Md,
                    cx,
                )
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
                icon_button("more-actions", tokens::Icon::Ellipsis, "More actions", cx)
                    .variant(ButtonVariant::Secondary),
            )
            .item(MenuItem::new("Copy the link").on_select(choose("Copy the link")))
            .item(MenuItem::new("Open in a new window").on_select(choose("Open in a new window")));

        let delete_dialog = Dialog::new("delete-dialog", "Delete the weekly report?")
            .open(self.confirming)
            .description(
                "The report and its 12 comments are removed for everyone. This cannot be undone.",
            )
            .on_close(cx.listener(|this, _: &(), _, cx| {
                this.confirming = false;
                cx.notify();
            }))
            .action(
                button(
                    "delete-cancel",
                    "Cancel",
                    ButtonVariant::Secondary,
                    ControlSize::Md,
                    cx,
                )
                .on_click(cx.listener(|this, _, _, cx| {
                    this.confirming = false;
                    cx.notify();
                })),
            )
            .action(
                button(
                    "delete-confirm",
                    "Delete",
                    ButtonVariant::Danger,
                    ControlSize::Md,
                    cx,
                )
                .on_click(cx.listener(|this, _, _, cx| {
                    this.confirming = false;
                    cx.notify();
                })),
            );
        let question_dialog = Dialog::new("question-dialog", "Keep the changes?")
            .open(self.asking)
            .dismissible(false)
            .description("You edited the report in another window.")
            .on_close(cx.listener(|this, _: &(), _, cx| {
                this.asking = false;
                cx.notify();
            }))
            .action(
                button(
                    "question-discard",
                    "Discard",
                    ButtonVariant::Secondary,
                    ControlSize::Md,
                    cx,
                )
                .on_click(cx.listener(|this, _, _, cx| {
                    this.asking = false;
                    cx.notify();
                })),
            )
            .action(
                button(
                    "question-keep",
                    "Keep",
                    ButtonVariant::Primary,
                    ControlSize::Md,
                    cx,
                )
                .on_click(cx.listener(|this, _, _, cx| {
                    this.asking = false;
                    cx.notify();
                })),
            )
            .child(TextField::new("Name of the copy", &self.copy_name));

        let toast = Toast::new("draft-toast", "The draft was deleted.")
            .open(self.toast_open)
            .on_close(cx.listener(|this, _: &(), _, cx| {
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
                tokens::MOTION_DURATION_TOAST
            });

        // Stand-ins for a dark and a light picture, the same in both modes.
        let on_picture = |mode: tokens::Mode, badge: Badge| {
            div()
                .flex()
                .items_end()
                .justify_end()
                .w(px(140.0))
                .h(px(80.0))
                .p(px(tokens::SPACE_2))
                .rounded(px(tokens::RADIUS_MD))
                .border(px(tokens::BORDER_WIDTH_THIN))
                .border_color(color(colors.border_default))
                .bg(color(tokens::colors(mode).background_base))
                .child(badge)
        };

        // The banner does not hide itself: the preview does, and offers it back.
        let closable_banner = if self.banner_open {
            Banner::new(
                BannerTone::Warning,
                "Storage is almost full. Remove files you no longer need, or add room.",
            )
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
            row()
                .child(
                    button(
                        "banner-restore",
                        "Show the dismissed banner",
                        ButtonVariant::Ghost,
                        ControlSize::Sm,
                        cx,
                    )
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
                    .leading(icon(glyph, IconSize::Sm))
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
                    .child(text(name, tokens::TYPOGRAPHY_HEADING))
                    .child(text(terms, tokens::TYPOGRAPHY_BODY).text_color(color(secondary)))
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
                tone,
                "Your changes are saved on this device. They sync when you are back online.",
            )
            .title(name)
        });

        let page = div()
            .flex()
            .flex_col()
            .gap(px(tokens::SPACE_12))
            .p(px(tokens::SPACE_6))
            .child(header)
            .child(section("Colors").children(color_groups))
            .child(section("Typography").children(texts))
            .child(
                section("Space, radius, size")
                    .child(labelled("space", secondary).children(spaces))
                    .child(labelled("radius", secondary).children(radii))
                    .child(
                        labelled("control", secondary)
                            .child(text(sizes, tokens::TYPOGRAPHY_DETAIL)),
                    ),
            )
            .child(
                section("Icons")
                    .child(
                        div()
                            .flex()
                            .flex_wrap()
                            .gap(px(tokens::SPACE_4))
                            .children(tokens::Icon::ALL.map(|name| icon(name, IconSize::Md))),
                    )
                    .child(
                        labelled("sizes", secondary).child(
                            div().flex().items_end().gap(px(tokens::SPACE_3)).children(
                                [
                                    IconSize::Xs,
                                    IconSize::Sm,
                                    IconSize::Md,
                                    IconSize::Lg,
                                    IconSize::Xl,
                                ]
                                .map(|size| icon(tokens::Icon::House, size)),
                            ),
                        ),
                    )
                    .child(
                        labelled("filled", secondary).child(
                            // Icons made of closed shapes, which is what the filled drawing is for.
                            div()
                                .flex()
                                .items_center()
                                .gap(px(tokens::SPACE_3))
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
                                            .gap(px(tokens::SPACE_1))
                                            .child(icon(name, IconSize::Md))
                                            .child(icon_filled(name, IconSize::Md))
                                    }),
                                ),
                        ),
                    ),
            )
            .child(
                section("Buttons")
                    .children(buttons)
                    .child(icon_buttons)
                    .child(toggles)
                    .children(icon_button_rows)
                    .child(icon_toggles)
                    .child(tooltips),
            )
            .child(
                section("Text fields")
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
                            .leading(icon(tokens::Icon::Search, IconSize::Sm)),
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
                            .leading(icon(tokens::Icon::Mail, IconSize::Sm))
                            .error(Some("Write a message before you send it.")),
                    )
                    .children(search_fields)
                    .child(text(searched, tokens::TYPOGRAPHY_DETAIL).text_color(color(secondary))),
            )
            .child(
                section("Selection")
                    .child(
                        labelled("switch", secondary)
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
                        labelled("checkbox", secondary)
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
                        labelled("segmented", secondary).child(
                            SegmentedControl::new("view", VIEWS)
                                .selected(self.view)
                                .on_change(cx.listener(|this, index: &usize, _, cx| {
                                    this.view = *index;
                                    cx.notify();
                                })),
                        ),
                    ),
            )
            .child(
                section("Chips").child(state_chips).child(
                    labelled("bar", secondary).child(
                        // Narrower than its chips, so the row has to scroll.
                        div().flex_1().min_w_0().max_w(px(448.0)).child(
                            ChipBar::new("filters", "Filter the tasks").children(filter_chips),
                        ),
                    ),
                ),
            )
            .child(
                section("Tabs")
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
                section("Badges")
                    .child(
                        labelled("tone", secondary)
                            .child(Badge::new("neutral"))
                            .child(Badge::new("accent").tone(BadgeTone::Accent))
                            .child(Badge::new("success").tone(BadgeTone::Success))
                            .child(Badge::new("warning").tone(BadgeTone::Warning))
                            .child(Badge::new("danger").tone(BadgeTone::Danger)),
                    )
                    .child(
                        labelled("dot", secondary)
                            .child(Badge::new("Online").tone(BadgeTone::Success).dot())
                            .child(Badge::new("Connecting").tone(BadgeTone::Warning).dot())
                            .child(Badge::new("Offline").tone(BadgeTone::Danger).dot()),
                    )
                    .child(
                        labelled("icon", secondary)
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
                        labelled("overlay", secondary)
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
                        labelled("count", secondary)
                            .gap(px(tokens::SPACE_5))
                            .child(CountBadge::new("count-3", 3))
                            .child(CountBadge::new("count-120", 120))
                            .child(
                                CountBadge::new("count-bell", 3)
                                    .label("3 unread notifications")
                                    .child(icon(tokens::Icon::Bell, IconSize::Lg)),
                            )
                            .child(
                                CountBadge::new("count-avatar", 120)
                                    .child(Avatar::new("Ada Lovelace")),
                            )
                            .child(
                                // Nothing to count: only what it would sit on is drawn.
                                CountBadge::new("count-none", 0)
                                    .child(icon(tokens::Icon::Mail, IconSize::Lg)),
                            ),
                    ),
            )
            .child(section("Banners").children(banners).child(closable_banner))
            .child(
                section("Card")
                    .child(
                        card(cx)
                            .child(text("Weekly report", tokens::TYPOGRAPHY_HEADING))
                            .child(
                                text("A card groups related content.", tokens::TYPOGRAPHY_BODY)
                                    .text_color(color(secondary)),
                            )
                            .child(divider(cx))
                            .child(
                                labelled("avatar", secondary)
                                    .child(Avatar::new("Ada Lovelace").size(AvatarSize::Sm))
                                    .child(Avatar::new("Ada Lovelace"))
                                    .child(Avatar::new("Grace Hopper").size(AvatarSize::Lg))
                                    .child(Avatar::new("Katherine Johnson").size(AvatarSize::Xl)),
                            )
                            .child(
                                labelled("picture", secondary)
                                    .child(Avatar::new("Ada Lovelace").src(self.portrait.clone()))
                                    .child(
                                        Avatar::new("Ada Lovelace")
                                            .size(AvatarSize::Xl)
                                            .src(self.portrait.clone()),
                                    )
                                    .child(
                                        // No such file: the initials stay.
                                        Avatar::new("Grace Hopper")
                                            .size(AvatarSize::Xl)
                                            .src(PathBuf::from("/acme/missing/portrait.png")),
                                    ),
                            )
                            .child(
                                labelled("stack", secondary)
                                    .gap(px(tokens::SPACE_5))
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
                                            .size(AvatarSize::Sm)
                                            .max(3)
                                            .label("The team"),
                                    ),
                            )
                            .child(
                                labelled("progress", secondary)
                                    .child(div().w(px(320.0)).child(ProgressBar::new(0.6))),
                            )
                            .child(
                                labelled("spinner", secondary)
                                    .child(spinner(SpinnerSize::Sm))
                                    .child(spinner(SpinnerSize::Md))
                                    .child(spinner(SpinnerSize::Lg)),
                            ),
                    )
                    .child(
                        row()
                            .items_start()
                            .gap(px(tokens::SPACE_4))
                            .child(
                                card(cx)
                                    .w(px(260.0))
                                    .media(
                                        img(self.landscape.clone())
                                            .w_full()
                                            .h(px(120.0))
                                            .object_fit(ObjectFit::Cover),
                                    )
                                    .child(text("With media", tokens::TYPOGRAPHY_HEADING))
                                    .child(
                                        text(
                                            "The picture runs edge to edge.",
                                            tokens::TYPOGRAPHY_BODY,
                                        )
                                        .text_color(color(secondary)),
                                    ),
                            )
                            .children(plans),
                    ),
            )
            .child(
                section("List")
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
                                        text("English", tokens::TYPOGRAPHY_BODY)
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
                            .py(px(tokens::SPACE_2))
                            .gap(px(0.0))
                            .children(folders),
                    ),
            )
            .child(
                self.mark_overlay(
                    PreviewOverlay::Menu,
                    section("Menu").child(
                        labelled("menu", secondary)
                            .child(report_menu)
                            .child(more_menu)
                            .child(
                                text(
                                    format!("{} Density: {}.", self.chosen, self.density),
                                    tokens::TYPOGRAPHY_DETAIL,
                                )
                                .text_color(color(secondary)),
                            ),
                    ),
                ),
            )
            .child(
                section("Dialog")
                    .child(
                        labelled("dialog", secondary)
                            .child(
                                button(
                                    "open-delete-dialog",
                                    "Delete the report",
                                    ButtonVariant::Danger,
                                    ControlSize::Md,
                                    cx,
                                )
                                .on_click(cx.listener(
                                    |this, _, _, cx| {
                                        this.confirming = true;
                                        cx.notify();
                                    },
                                )),
                            )
                            .child(
                                button(
                                    "open-question-dialog",
                                    "A question that must be answered",
                                    ButtonVariant::Secondary,
                                    ControlSize::Md,
                                    cx,
                                )
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
                section("Toast")
                    .child(
                        labelled("toast", secondary)
                            .child(
                                button(
                                    "show-toast",
                                    "Delete a draft",
                                    ButtonVariant::Secondary,
                                    ControlSize::Md,
                                    cx,
                                )
                                .on_click(cx.listener(
                                    |this, _, _, cx| {
                                        this.draft_deleted = true;
                                        this.toast_open = true;
                                        cx.notify();
                                    },
                                )),
                            )
                            .child(
                                text(
                                    if self.draft_deleted {
                                        "The draft is deleted."
                                    } else {
                                        "The draft is back."
                                    },
                                    tokens::TYPOGRAPHY_DETAIL,
                                )
                                .text_color(color(secondary)),
                            ),
                    )
                    .child(toast),
            )
            .child(
                section("Skeleton")
                    .child(
                        labelled("shape", secondary)
                            .child(
                                div()
                                    .flex()
                                    .flex_col()
                                    .gap(px(tokens::SPACE_2))
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
                                .gap(px(tokens::SPACE_4))
                                .child(
                                    Skeleton::new("loading-picture")
                                        .shape(SkeletonShape::Rect)
                                        .height(px(128.0)),
                                )
                                .child(
                                    div()
                                        .flex()
                                        .items_center()
                                        .gap(px(tokens::SPACE_3))
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
                                                .gap(px(tokens::SPACE_2))
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
        assert_eq!("dialog".parse(), Ok(PreviewOverlay::Dialog));
        assert_eq!("toast".parse(), Ok(PreviewOverlay::Toast));
        assert_eq!("tooltip".parse(), Ok(PreviewOverlay::Tooltip));
        assert!("sheet".parse::<PreviewOverlay>().is_err());
    }

    #[test]
    fn every_component_color_is_left_out_of_the_swatches() {
        let colors = acme_tokens::colors(acme_tokens::Mode::Light);
        for group in [
            "chip", "tabs", "menu", "dialog", "toast", "tooltip", "skeleton",
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
