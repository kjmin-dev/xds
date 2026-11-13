//! The design preview: every token and every component, in one scrolling window.
//!
//! The desktop app opens it with `acme --design`. It is the desktop counterpart of the
//! `/design` route of the web and mobile apps, and shows the same things in the same order.

use acme_tokens as tokens;
use gpui_kit::component::{Disableable, input::InputState};
use gpui_kit::{
    App, AppContext, Bounds, Context, Div, Entity, InteractiveElement, IntoElement, ParentElement,
    Render, ScrollHandle, SharedString, StatefulInteractiveElement, Styled, Window, WindowBounds,
    WindowOptions, div, px, size,
};

use crate::{
    Badge, BadgeTone, Banner, BannerTone, ButtonVariant, ControlSize, TextField, TypographyExt,
    button, card, color, divider, mode, palette, set_mode, text,
};

/// Component colors are shown by the components that use them, not as swatches.
const COMPONENT_COLORS: [&str; 4] = ["button-", "field-", "badge-", "banner-"];

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

const SPACES: [(&str, f32); 7] = [
    ("1", tokens::SPACE_1),
    ("2", tokens::SPACE_2),
    ("3", tokens::SPACE_3),
    ("4", tokens::SPACE_4),
    ("6", tokens::SPACE_6),
    ("8", tokens::SPACE_8),
    ("12", tokens::SPACE_12),
];

const RADII: [(&str, f32); 4] = [
    ("sm", tokens::RADIUS_SM),
    ("md", tokens::RADIUS_MD),
    ("lg", tokens::RADIUS_LG),
    ("full", tokens::RADIUS_FULL),
];

pub struct DesignPreview {
    email: Entity<InputState>,
    code: Entity<InputState>,
    organization: Entity<InputState>,
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
            scroll: ScrollHandle::new(),
        }
    }

    /// Opens the preview in a window of its own.
    pub fn open(cx: &mut App) {
        let options = WindowOptions {
            window_bounds: Some(WindowBounds::Windowed(Bounds::centered(
                None,
                size(px(960.0), px(820.0)),
                cx,
            ))),
            ..Default::default()
        };
        gpui_kit::open_window(options, cx, |window, cx| cx.new(|cx| Self::new(window, cx)))
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
    fn render(&mut self, _window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
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
                .child(button((name, 0usize), "Save", variant, ControlSize::Sm))
                .child(button((name, 1usize), "Save", variant, ControlSize::Md))
                .child(button((name, 2usize), "Save", variant, ControlSize::Lg))
                .child(button((name, 3usize), "Disabled", variant, ControlSize::Md).disabled(true))
                .child(button((name, 4usize), "Saving", variant, ControlSize::Md).loading(true))
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
                section("Card and divider").child(
                    card(cx)
                        .child(text("Weekly report", tokens::TYPOGRAPHY_HEADING))
                        .child(divider(cx))
                        .child(
                            text("A card groups related content.", tokens::TYPOGRAPHY_BODY)
                                .text_color(color(secondary)),
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
