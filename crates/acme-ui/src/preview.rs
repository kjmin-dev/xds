//! The design preview: every token and every component, in one scrolling window.
//!
//! The desktop app opens it with `acme --design`. It is the desktop counterpart of the
//! `/design` route of the web and mobile apps, and shows the same things in the same order.

use acme_tokens as tokens;
use gpui_kit::component::{Disableable, input::InputState};
use gpui_kit::{
    App, AppContext, Bounds, Context, Div, Entity, InteractiveElement, IntoElement, ParentElement,
    Render, ScrollHandle, SharedString, StatefulInteractiveElement, Styled, Window, WindowBounds,
    WindowOptions, div, point, px, size,
};

use crate::{
    Avatar, AvatarSize, Badge, BadgeTone, Banner, BannerTone, ButtonVariant, ControlSize, ListRow,
    ProgressBar, SegmentedControl, TextField, TypographyExt, button, card, checkbox, color,
    divider, mode, palette, set_mode, switch, text,
};

/// Component colors are shown by the components that use them, not as swatches.
const COMPONENT_COLORS: [&str; 13] = [
    "button-",
    "field-",
    "badge-",
    "banner-",
    "switch-",
    "checkbox-",
    "segmented-",
    "avatar-",
    "progress-",
    "list-row-",
    "top-bar-",
    "tab-bar-",
    "sheet-",
];

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
    notifications: bool,
    remember: bool,
    view: usize,
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
        Self {
            email: field("name@example.com"),
            code: field("000000"),
            organization: field("Acme Inc."),
            notifications: true,
            remember: true,
            view: 1,
            start_at: None,
            scroll: ScrollHandle::new(),
        }
    }

    /// Opens the preview in a window of its own.
    pub fn open(cx: &mut App) {
        Self::open_scrolled(0.0, cx);
    }

    /// Opens the preview already scrolled `offset` pixels down. A script that takes
    /// screenshots cannot scroll, so it asks for the part it wants.
    pub fn open_scrolled(offset: f32, cx: &mut App) {
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
                preview
            })
        })
        .expect("the design preview window could not open");
        cx.activate(true);
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
            .child(section("Buttons").children(buttons))
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
                    .child(TextField::new("Organization", &self.organization).disabled(true)),
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
                    ),
            )
            .child(section("Banners").children(banners))
            .child(
                section("Card").child(
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
                                .child(Avatar::new("Grace Hopper").size(AvatarSize::Lg)),
                        )
                        .child(
                            labelled("progress", secondary)
                                .child(div().w(px(320.0)).child(ProgressBar::new(0.6))),
                        ),
                ),
            )
            .child(
                section("List").child(
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
