//! The design preview: every token and every component, in one scrolling window.
//!
//! The desktop app opens it with `acme --design`. It is the desktop counterpart of the
//! `/design` route of the web and mobile apps, and shows the same things in the same order.

use std::path::PathBuf;
use std::sync::Arc;

use acme_tokens as tokens;
use gpui_kit::component::{
    Disableable,
    input::{InputState, TextareaState},
};
use gpui_kit::{
    App, AppContext, Bounds, Context, Div, Entity, Image, ImageFormat, InteractiveElement,
    IntoElement, ObjectFit, ParentElement, Render, ScrollHandle, SharedString,
    StatefulInteractiveElement, Styled, StyledImage, Window, WindowBounds, WindowOptions, div, img,
    point, px, size,
};

use crate::{
    Avatar, AvatarSize, AvatarStack, Badge, BadgeTone, Banner, BannerTone, ButtonVariant,
    ControlSize, CountBadge, IconSize, ListRow, Person, ProgressBar, SegmentedControl, SpinnerSize,
    TextField, TypographyExt, button, card, checkbox, color, divider, icon, icon_filled, mode,
    palette, set_mode, spinner, switch, text,
};

/// Component colors are shown by the components that use them, not as swatches.
const COMPONENT_COLORS: [&str; 14] = [
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
];

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
                    .child(toggles),
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
                    ),
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
