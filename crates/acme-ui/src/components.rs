//! Acme's general-purpose components for GPUI.
//!
//! They take the same variants, sizes and tones as the web components in `@acme/ui` and the
//! React Native ones in `@acme/ui-native`, and draw them from the same design tokens.
//! Interactive parts come from GPUI Component, which supplies focus, keyboard and input-method
//! handling; this module gives them Acme's sizes and wraps what GPUI Component lacks.

use std::rc::Rc;

use acme_tokens as tokens;
use gpui_kit::component::{
    Disableable, Sizable, Size, ThemeStyled,
    button::{Button as KitButton, ButtonCustomVariant, ButtonVariants},
    input::{Input, InputState, Textarea, TextareaState},
};
use gpui_kit::prelude::FluentBuilder;
use gpui_kit::{
    AnyElement, App, BoxShadow, ClickEvent, Div, ElementId, Entity, Focusable, InteractiveElement,
    IntoElement, MouseButton, ParentElement, Pixels, Refineable, RenderOnce, Role, SharedString,
    StatefulInteractiveElement, StyleRefinement, Styled, Window, div, point, px,
};

use crate::controls::{ClickHandler, IconSize, SpinnerSize, icon, icon_filled, spinner};
use crate::theme::{TypographyExt, color, palette};

// ---------------------------------------------------------------- button

/// `Primary` is the one action a view is for; use it once per view. `Secondary` is any other
/// action, `Ghost` an action that should stay out of the way, `Danger` one that destroys.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum ButtonVariant {
    Primary,
    #[default]
    Secondary,
    Ghost,
    Danger,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum ControlSize {
    Sm,
    #[default]
    Md,
    Lg,
}

impl ControlSize {
    /// The height of a control of this size. The desktop is used with a pointer.
    pub fn height(self) -> Pixels {
        px(match self {
            ControlSize::Sm => tokens::POINTER.control_sm,
            ControlSize::Md => tokens::POINTER.control_md,
            ControlSize::Lg => tokens::POINTER.control_lg,
        })
    }

    fn padding(self) -> Pixels {
        px(match self {
            ControlSize::Sm => tokens::SPACE_3,
            ControlSize::Md => tokens::SPACE_4,
            ControlSize::Lg => tokens::SPACE_6,
        })
    }
}

/// Converts a token shadow into GPUI's.
pub(crate) fn shadow(shadow: tokens::Shadow) -> Vec<BoxShadow> {
    vec![BoxShadow {
        color: color(shadow.color),
        offset: point(px(shadow.offset_x), px(shadow.offset_y)),
        blur_radius: px(shadow.blur),
        spread_radius: px(shadow.spread),
        inset: false,
    }]
}

/// A button in one of Acme's variants and sizes. Add `.on_click`, `.disabled`, `.loading`,
/// `.icon_start`, `.icon_end` or `.selected` to it, and size it like any element
/// (`.w_full()`).
pub fn button(
    id: impl Into<ElementId>,
    label: impl Into<SharedString>,
    variant: ButtonVariant,
    size: ControlSize,
    cx: &App,
) -> Button {
    let base = KitButton::new(id);
    let base = match variant {
        // Filled buttons carry the same trace of shadow, so none looks flatter than the
        // outlined one.
        ButtonVariant::Primary => base.primary().shadow(shadow(tokens::SHADOW_SUBTLE)),
        // Outlined, so it sits quietly beside a primary button.
        ButtonVariant::Secondary => base
            .secondary()
            .border_1()
            .border_color(color(palette(cx).button_secondary_border))
            .shadow(shadow(tokens::SHADOW_SUBTLE)),
        ButtonVariant::Ghost => base.ghost(),
        ButtonVariant::Danger => base.danger().shadow(shadow(tokens::SHADOW_SUBTLE)),
    };
    Button {
        base: base
            .h(size.height())
            .min_w(size.height())
            .px(size.padding())
            .rounded(px(tokens::POINTER.button_radius)),
        label: label.into(),
        variant,
        size,
        icon_start: None,
        icon_end: None,
        icon_only: false,
        selected: None,
        disabled: false,
        loading: false,
    }
}

/// What [`button`] returns. GPUI Component's button draws it and supplies focus and keyboard
/// handling; this holds the options that decide what goes inside it, because the icons, the
/// spinner and the selected look depend on each other.
#[derive(IntoElement)]
pub struct Button {
    base: KitButton,
    label: SharedString,
    variant: ButtonVariant,
    size: ControlSize,
    icon_start: Option<tokens::Icon>,
    icon_end: Option<tokens::Icon>,
    icon_only: bool,
    selected: Option<bool>,
    disabled: bool,
    loading: bool,
}

impl Button {
    /// An icon in front of the label, in the label's color.
    pub fn icon_start(mut self, icon: tokens::Icon) -> Self {
        self.icon_start = Some(icon);
        self
    }

    /// An icon after the label, in the label's color.
    pub fn icon_end(mut self, icon: tokens::Icon) -> Self {
        self.icon_end = Some(icon);
        self
    }

    /// Makes the button a toggle that reports its state to assistive technology. While it is
    /// `true` a secondary or ghost button is tinted and outlined and its start icon is filled,
    /// so the state does not depend on color; a primary or danger button only reports it.
    pub fn selected(mut self, selected: bool) -> Self {
        self.selected = Some(selected);
        self
    }

    pub fn disabled(mut self, disabled: bool) -> Self {
        self.disabled = disabled;
        self
    }

    /// Shows a spinner and ignores clicks. The spinner takes the place of the start icon, so
    /// the button keeps its width.
    pub fn loading(mut self, loading: bool) -> Self {
        self.loading = loading;
        self
    }

    pub fn on_click(
        mut self,
        handler: impl Fn(&ClickEvent, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.base = self.base.on_click(handler);
        self
    }

    /// Draws the start icon alone, in a square. The label still names the button for
    /// assistive technology.
    pub(crate) fn icon_only(mut self) -> Self {
        let side = self.size.height().max(px(tokens::POINTER.target_min));
        self.base = self.base.px(px(0.0)).size(side);
        self.icon_only = true;
        self
    }
}

impl Styled for Button {
    fn style(&mut self) -> &mut StyleRefinement {
        self.base.style()
    }
}

impl RenderOnce for Button {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let c = palette(cx);
        // A disabled button looks disabled whether or not it is selected.
        let tinted = self.selected == Some(true)
            && !self.disabled
            && matches!(
                self.variant,
                ButtonVariant::Secondary | ButtonVariant::Ghost
            );
        let (icon_size, label_style) = match self.size {
            ControlSize::Lg => (IconSize::Md, tokens::TYPOGRAPHY_BODY_STRONG),
            _ => (IconSize::Sm, tokens::TYPOGRAPHY_LABEL),
        };
        let start = if self.loading {
            // In a box the size of the icon it replaces, so the label does not move.
            Some(
                div()
                    .flex()
                    .flex_none()
                    .items_center()
                    .justify_center()
                    .size(px(icon_size.side()))
                    .child(spinner(SpinnerSize::Sm))
                    .into_any_element(),
            )
        } else {
            self.icon_start.map(|name| {
                if tinted {
                    icon_filled(name, icon_size).into_any_element()
                } else {
                    icon(name, icon_size).into_any_element()
                }
            })
        };
        let label = (!self.icon_only).then(|| {
            div()
                .min_w_0()
                .whitespace_nowrap()
                .text_ellipsis()
                .typography(label_style)
                .child(self.label.clone())
        });
        let end = self.icon_end.map(|name| icon(name, icon_size));

        let base = if tinted {
            // GPUI Component paints its own selected look and drops hover and pressed for it,
            // so the tokens go in as a variant of their own.
            let selected = ButtonCustomVariant::new(cx)
                .color(color(c.button_selected_border))
                .foreground(color(c.button_selected_text))
                .hover(color(c.button_selected_background_hover))
                .active(color(c.button_selected_background_pressed));
            self.base
                .custom(selected)
                .bg(color(c.button_selected_background))
                .border(px(tokens::BORDER_WIDTH_THIN))
                .border_color(color(c.button_selected_border))
        } else if self.selected.is_some() && self.variant == ButtonVariant::Ghost {
            // The outline a selected ghost button gets, already there and transparent, so
            // toggling does not change the width.
            self.base
                .border(px(tokens::BORDER_WIDTH_THIN))
                .border_color(gpui_kit::transparent_black())
        } else {
            self.base
        };
        base
            // The label is drawn here as a child, so GPUI Component does not know it.
            .accessibility_label(self.label)
            .when_some(self.selected, |button, selected| button.toggled(selected))
            .disabled(self.disabled)
            .loading(self.loading)
            .children(start)
            .children(label)
            .children(end)
    }
}

// ---------------------------------------------------------------- text field

#[derive(Clone)]
enum FieldState {
    Line(Entity<InputState>),
    Area(Entity<TextareaState>),
}

/// A labelled text field: one line, or several with [`TextField::multiline`]. The label is
/// always visible; a placeholder is not a label. `error` replaces `description` while there
/// is one.
#[derive(IntoElement)]
pub struct TextField {
    label: SharedString,
    state: FieldState,
    description: Option<SharedString>,
    error: Option<SharedString>,
    disabled: bool,
    leading: Option<AnyElement>,
    trailing: Option<AnyElement>,
    rows: usize,
    max_length: Option<usize>,
}

impl TextField {
    pub fn new(label: impl Into<SharedString>, state: &Entity<InputState>) -> Self {
        Self::with_state(label, FieldState::Line(state.clone()))
    }

    /// A text area. It is `rows` lines tall and scrolls beyond that.
    pub fn multiline(label: impl Into<SharedString>, state: &Entity<TextareaState>) -> Self {
        Self::with_state(label, FieldState::Area(state.clone()))
    }

    fn with_state(label: impl Into<SharedString>, state: FieldState) -> Self {
        Self {
            label: label.into(),
            state,
            description: None,
            error: None,
            disabled: false,
            leading: None,
            trailing: None,
            rows: 3,
            max_length: None,
        }
    }

    pub fn description(mut self, description: impl Into<SharedString>) -> Self {
        self.description = Some(description.into());
        self
    }

    pub fn error(mut self, error: Option<impl Into<SharedString>>) -> Self {
        self.error = error.map(Into::into);
        self
    }

    pub fn disabled(mut self, disabled: bool) -> Self {
        self.disabled = disabled;
        self
    }

    /// Inside the box, in front of the text: an icon or a unit. It takes the placeholder
    /// color unless it sets its own.
    pub fn leading(mut self, element: impl IntoElement) -> Self {
        self.leading = Some(element.into_any_element());
        self
    }

    /// Inside the box, after the text: an icon, a unit or a small button.
    pub fn trailing(mut self, element: impl IntoElement) -> Self {
        self.trailing = Some(element.into_any_element());
        self
    }

    /// How many lines tall a multiline field is. Three unless set.
    pub fn rows(mut self, rows: usize) -> Self {
        self.rows = rows;
        self
    }

    /// The field takes no more characters than this, and counts them under its end edge.
    /// On a one-line field this replaces the validator of the input state.
    pub fn max_length(mut self, max_length: usize) -> Self {
        self.max_length = Some(max_length);
        self
    }
}

impl RenderOnce for TextField {
    fn render(self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let colors = palette(cx);
        let invalid = self.error.is_some();
        let multiline = matches!(self.state, FieldState::Area(_));
        let line = px(tokens::TYPOGRAPHY_BODY.line_height_px());

        if let Some(max) = self.max_length {
            match &self.state {
                FieldState::Line(state) => state.update(cx, |state, cx| {
                    state.set_validator(move |text, _| text.chars().count() <= max, cx);
                }),
                // GPUI Component validates one-line inputs only, so a text area is cut back
                // after the edit instead of refusing it.
                FieldState::Area(state) => {
                    let value = state.read(cx).value();
                    if value.chars().count() > max {
                        let kept: String = value.chars().take(max).collect();
                        let end = kept.len();
                        state.update(cx, |state, cx| {
                            state.replace_all(kept, window, cx);
                            state.set_selected_range(end..end, cx);
                        });
                    }
                }
            }
        }
        let (length, focus) = match &self.state {
            FieldState::Line(state) => {
                let state = state.read(cx);
                (state.value().chars().count(), state.focus_handle(cx))
            }
            FieldState::Area(state) => {
                let state = state.read(cx);
                (state.value().chars().count(), state.focus_handle(cx))
            }
        };
        let focused = !self.disabled && focus.is_focused(window);

        // The text control keeps this much room of its own around the text; the frame and
        // the slots add the rest of `space.3` to the edge and leave `space.2` to the text.
        let inset = px(tokens::SPACE_2);
        // A text area's lines start this far below its top edge, so the slots start there too.
        let area_inset = Size::Small.input_py();
        let slot = |element: AnyElement| {
            div()
                .flex()
                .flex_none()
                .items_center()
                .h(line)
                .when(multiline, |slot| slot.mt(area_inset))
                .typography(tokens::TYPOGRAPHY_BODY)
                .text_color(color(colors.field_placeholder))
                .child(element)
        };
        let control = match &self.state {
            FieldState::Line(state) => {
                let input = Input::new(state)
                    .appearance(false)
                    .aria_label(self.label.clone())
                    .disabled(self.disabled)
                    .flex_1()
                    .min_w_0()
                    .px(inset)
                    .py(px(0.0))
                    .typography(tokens::TYPOGRAPHY_BODY);
                // `Input::h` sets the height of a text area only.
                Styled::h(input, line).into_any_element()
            }
            FieldState::Area(state) => Textarea::new(state)
                .appearance(false)
                // The size whose inset around the text is `space.2`.
                .with_size(Size::Small)
                .aria_label(self.label.clone())
                .disabled(self.disabled)
                .h(line * self.rows.max(1) as f32 + area_inset * 2.0)
                .flex_1()
                .min_w_0()
                .typography(tokens::TYPOGRAPHY_BODY)
                .into_any_element(),
        };
        let focus_text = {
            let state = self.state.clone();
            move |_: &gpui_kit::MouseDownEvent, window: &mut Window, cx: &mut App| {
                // A button in a slot keeps the press for itself.
                if window.default_prevented() {
                    return;
                }
                match &state {
                    FieldState::Line(state) => {
                        state.update(cx, |state, cx| state.focus(window, cx));
                    }
                    FieldState::Area(state) => {
                        state.update(cx, |state, cx| state.focus(window, cx));
                    }
                }
                window.prevent_default();
            }
        };
        let frame = div()
            .flex()
            .w_full()
            .px(px(tokens::SPACE_1))
            .rounded(px(tokens::RADIUS_MD))
            .border(px(tokens::BORDER_WIDTH_THIN))
            .border_color(color(if invalid {
                colors.field_border_invalid
            } else {
                colors.field_border
            }))
            .bg(color(if self.disabled {
                colors.background_disabled
            } else {
                colors.field_background
            }))
            .text_color(color(colors.field_text))
            .map(|frame| {
                if multiline {
                    frame.items_start().py(px(tokens::SPACE_1))
                } else {
                    frame.items_center().h(ControlSize::Md.height())
                }
            })
            .when(focused, |frame| {
                let frame = frame.focus_ring_style(window, cx);
                if invalid {
                    frame.border_color(color(colors.field_border_invalid))
                } else {
                    frame.border_color(color(colors.field_border_focus))
                }
            })
            .when(!self.disabled, |frame| {
                // The whole box takes the caret, not only the text inside it.
                frame.on_mouse_down(MouseButton::Left, focus_text)
            })
            .children(
                self.leading
                    .map(|element| slot(element).ml(px(tokens::SPACE_2))),
            )
            .child(control)
            .children(
                self.trailing
                    .map(|element| slot(element).mr(px(tokens::SPACE_2))),
            );

        let note = self.error.or(self.description).map(|text| {
            let tone = if invalid {
                colors.status_danger
            } else {
                colors.text_secondary
            };
            div()
                .flex_1()
                .typography(tokens::TYPOGRAPHY_DETAIL)
                .text_color(color(tone))
                .child(text)
        });
        let counter = self.max_length.map(|max| {
            div()
                .flex_none()
                .typography(tokens::TYPOGRAPHY_FOOTNOTE)
                .text_color(color(colors.text_secondary))
                .child(format!("{length}/{max}"))
        });
        let footer = (note.is_some() || counter.is_some()).then(|| {
            div()
                .flex()
                .items_start()
                // Keeps the counter at the end edge when there is no note beside it.
                .justify_end()
                .gap(px(tokens::SPACE_3))
                .children(note)
                .children(counter)
        });

        div()
            .flex()
            .flex_col()
            .gap(px(tokens::SPACE_1))
            .child(
                div()
                    .typography(tokens::TYPOGRAPHY_LABEL)
                    .text_color(color(if self.disabled {
                        colors.text_secondary
                    } else {
                        colors.text_primary
                    }))
                    .child(self.label),
            )
            .child(
                // An outline of its own when invalid, thicker than the field's, so the state
                // does not depend on telling red from grey.
                div()
                    .rounded(px(tokens::RADIUS_MD))
                    .when(invalid, |outline| {
                        outline
                            .border(px(tokens::BORDER_WIDTH_THIN))
                            .border_color(color(colors.field_border_invalid))
                    })
                    .child(frame),
            )
            .children(footer)
    }
}

// ---------------------------------------------------------------- badge

/// `Overlay` is for a badge that sits on a picture; the others sit on a surface.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum BadgeTone {
    #[default]
    Neutral,
    Accent,
    Success,
    Warning,
    Danger,
    Overlay,
}

/// A short status or category. The words carry the meaning; the color only reinforces it.
/// `dot` adds a small mark for live states such as "connected".
#[derive(IntoElement)]
pub struct Badge {
    label: SharedString,
    tone: BadgeTone,
    dot: bool,
    icon: Option<tokens::Icon>,
}

impl Badge {
    pub fn new(label: impl Into<SharedString>) -> Self {
        Self {
            label: label.into(),
            tone: BadgeTone::default(),
            dot: false,
            icon: None,
        }
    }

    pub fn tone(mut self, tone: BadgeTone) -> Self {
        self.tone = tone;
        self
    }

    pub fn dot(mut self) -> Self {
        self.dot = true;
        self
    }

    /// An icon in front of the label, in the label's color.
    pub fn icon(mut self, icon: tokens::Icon) -> Self {
        self.icon = Some(icon);
        self
    }
}

impl RenderOnce for Badge {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let c = palette(cx);
        let (background, text) = match self.tone {
            BadgeTone::Neutral => (c.badge_neutral_background, c.badge_neutral_text),
            BadgeTone::Accent => (c.badge_accent_background, c.badge_accent_text),
            BadgeTone::Success => (c.badge_success_background, c.badge_success_text),
            BadgeTone::Warning => (c.badge_warning_background, c.badge_warning_text),
            BadgeTone::Danger => (c.badge_danger_background, c.badge_danger_text),
            BadgeTone::Overlay => (c.badge_overlay_background, c.badge_overlay_text),
        };
        div()
            .flex()
            .flex_none()
            .items_center()
            .gap(px(tokens::SPACE_1_5))
            .h(px(tokens::POINTER.badge))
            .px(px(tokens::SPACE_2_5))
            .rounded_full()
            .bg(color(background))
            .text_color(color(text))
            .typography(tokens::TYPOGRAPHY_FOOTNOTE)
            .when(self.dot, |badge| {
                badge.child(
                    div()
                        .flex_none()
                        .size(px(tokens::SPACE_1_5))
                        .rounded_full()
                        .bg(color(text)),
                )
            })
            .children(self.icon.map(|name| icon(name, IconSize::Xs)))
            .child(self.label)
    }
}

/// A count on an icon, an avatar or a button: unread messages, items in a cart. A count of
/// zero or less draws nothing but the child.
#[derive(IntoElement)]
pub struct CountBadge {
    id: ElementId,
    count: i64,
    max: i64,
    label: Option<SharedString>,
    child: Option<AnyElement>,
}

impl CountBadge {
    /// GPUI reports an element to assistive technology only when it has an id, so the badge
    /// takes one.
    pub fn new(id: impl Into<ElementId>, count: i64) -> Self {
        Self {
            id: id.into(),
            count,
            max: 99,
            label: None,
            child: None,
        }
    }

    /// The largest count shown as a number; a larger one shows as `99+`. 99 unless set.
    pub fn max(mut self, max: i64) -> Self {
        self.max = max;
        self
    }

    /// What is counted, for assistive technology: "3 unread notifications". Without it the
    /// number is read.
    pub fn label(mut self, label: impl Into<SharedString>) -> Self {
        self.label = Some(label.into());
        self
    }

    /// What the count is about. The badge sits on its top end corner.
    pub fn child(mut self, child: impl IntoElement) -> Self {
        self.child = Some(child.into_any_element());
        self
    }
}

/// What a count badge shows: the count, or `max` and a plus sign when it is larger.
fn count_text(count: i64, max: i64) -> String {
    if count > max {
        format!("{max}+")
    } else {
        count.to_string()
    }
}

impl RenderOnce for CountBadge {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let c = palette(cx);
        let side = tokens::POINTER.count_badge;
        let pill = (self.count > 0).then(|| {
            let shown: SharedString = count_text(self.count, self.max).into();
            div()
                .id(self.id)
                .role(Role::Label)
                .aria_label(self.label.unwrap_or_else(|| shown.clone()))
                .flex()
                .flex_none()
                .items_center()
                .justify_center()
                .h(px(side))
                .min_w(px(side))
                .px(px(tokens::SPACE_1))
                .rounded_full()
                .bg(color(c.badge_count_background))
                .text_color(color(c.badge_count_text))
                .typography(tokens::TYPOGRAPHY_FOOTNOTE)
                .child(shown)
        });
        let Some(child) = self.child else {
            return div().flex().flex_none().children(pill);
        };
        // Outward from the corner by a quarter of its height, so it overlaps the corner
        // without covering what it counts.
        let offset = px(-side / 4.0);
        // The inner box is as large as the child, wherever the outer one is stretched to,
        // so the corner is the child's.
        div().flex().flex_none().child(
            div()
                .relative()
                .flex()
                .flex_none()
                .child(child)
                .children(pill.map(|pill| pill.absolute().top(offset).right(offset))),
        )
    }
}

// ---------------------------------------------------------------- banner

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum BannerTone {
    #[default]
    Info,
    Success,
    Warning,
    Danger,
}

/// A message about the whole view or a section of it. Each tone has its own mark, so the tone
/// does not depend on color.
#[derive(IntoElement)]
pub struct Banner {
    id: ElementId,
    tone: BannerTone,
    title: Option<SharedString>,
    message: SharedString,
    action: Option<(SharedString, ClickHandler)>,
    on_dismiss: Option<ClickHandler>,
    dismiss_label: SharedString,
}

impl Banner {
    pub fn new(tone: BannerTone, message: impl Into<SharedString>) -> Self {
        Self {
            id: "banner".into(),
            tone,
            title: None,
            message: message.into(),
            action: None,
            on_dismiss: None,
            dismiss_label: "Dismiss".into(),
        }
    }

    /// Tells this banner's buttons apart from those of another banner beside it. Set it when
    /// more than one banner with an action or a dismiss control share a parent.
    pub fn id(mut self, id: impl Into<ElementId>) -> Self {
        self.id = id.into();
        self
    }

    pub fn title(mut self, title: impl Into<SharedString>) -> Self {
        self.title = Some(title.into());
        self
    }

    /// One thing to do about the message, as a button under it.
    pub fn action(
        mut self,
        label: impl Into<SharedString>,
        handler: impl Fn(&ClickEvent, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.action = Some((label.into(), Rc::new(handler)));
        self
    }

    /// Shows a close control. The banner does not hide itself: the handler decides.
    pub fn on_dismiss(
        mut self,
        handler: impl Fn(&ClickEvent, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_dismiss = Some(Rc::new(handler));
        self
    }

    /// Names the close control for assistive technology. "Dismiss" unless set.
    pub fn dismiss_label(mut self, label: impl Into<SharedString>) -> Self {
        self.dismiss_label = label.into();
        self
    }
}

impl RenderOnce for Banner {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let c = palette(cx);
        let (background, accent, mark) = match self.tone {
            BannerTone::Info => (c.banner_info_background, c.banner_info_accent, "i"),
            BannerTone::Success => (c.banner_success_background, c.banner_success_accent, "✓"),
            BannerTone::Warning => (c.banner_warning_background, c.banner_warning_accent, "!"),
            BannerTone::Danger => (c.banner_danger_background, c.banner_danger_accent, "×"),
        };
        let action = self.action.map(|(label, handler)| {
            // In a row of its own, so the button keeps the width of its label.
            div().flex().pt(px(tokens::SPACE_2)).child(
                button(
                    (self.id.clone(), "action"),
                    label,
                    ButtonVariant::Secondary,
                    ControlSize::Sm,
                    cx,
                )
                .on_click(move |event, window, cx| handler(event, window, cx)),
            )
        });
        let dismiss = self.on_dismiss.map(|handler| {
            button(
                (self.id.clone(), "dismiss"),
                self.dismiss_label,
                ButtonVariant::Ghost,
                ControlSize::Sm,
                cx,
            )
            .icon_start(tokens::Icon::X)
            .icon_only()
            .on_click(move |event, window, cx| handler(event, window, cx))
        });
        div()
            .flex()
            .items_start()
            .gap(px(tokens::SPACE_3))
            .p(px(tokens::SPACE_3))
            .rounded(px(tokens::RADIUS_MD))
            .bg(color(background))
            .text_color(color(c.banner_text))
            .child(
                div()
                    .flex()
                    .flex_none()
                    .items_center()
                    .justify_center()
                    .size(px(tokens::POINTER.icon_md))
                    .rounded_full()
                    .bg(color(accent))
                    .text_color(color(background))
                    .typography(tokens::TYPOGRAPHY_FOOTNOTE)
                    .child(mark),
            )
            .child(
                div()
                    .flex_1()
                    .flex()
                    .flex_col()
                    .gap(px(tokens::SPACE_0_5))
                    .children(
                        self.title
                            .map(|title| div().typography(tokens::TYPOGRAPHY_LABEL).child(title)),
                    )
                    .child(
                        div()
                            .typography(tokens::TYPOGRAPHY_DETAIL)
                            .child(self.message),
                    )
                    .children(action),
            )
            .children(dismiss)
    }
}

// ---------------------------------------------------------------- surfaces and text

/// A surface that groups related content. A hairline outline and a trace of shadow lift it off
/// the page; in dark mode, where shadows barely show, the lighter fill does that. Add the
/// content as children. For a card that holds a list, take the padding and the gap off and
/// clip it: `card(cx).p(px(0.0)).gap(px(0.0)).overflow_hidden()`.
pub fn card(_cx: &App) -> Card {
    Card {
        style: StyleRefinement::default(),
        children: Vec::new(),
        media: None,
        selected: false,
        press: None,
    }
}

/// What [`card`] returns: a surface that takes children and styles like a `div`, and the
/// options below.
#[derive(IntoElement)]
pub struct Card {
    style: StyleRefinement,
    children: Vec<AnyElement>,
    media: Option<AnyElement>,
    selected: bool,
    press: Option<(ElementId, ClickHandler)>,
}

impl Card {
    /// A picture at the top of the card, edge to edge above the padding. GPUI clips to
    /// rectangles only, so the card rounds the top corners of the element it is given: pass
    /// the picture itself (an `img`, or a `div` with a background), not a wrapper around it.
    pub fn media(mut self, media: impl IntoElement + Styled) -> Self {
        // Inside the hairline, so the picture's corners follow the inner edge of the outline.
        let radius = px(tokens::RADIUS_LG - tokens::BORDER_WIDTH_THIN);
        self.media = Some(media.rounded_t(radius).into_any_element());
        self
    }

    /// Makes the whole card one button. Put no other control inside it.
    pub fn on_press(
        mut self,
        id: impl Into<ElementId>,
        handler: impl Fn(&ClickEvent, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.press = Some((id.into(), Rc::new(handler)));
        self
    }

    /// Outlines the card as the current choice. The outline is thick, so the state shows in
    /// the form and not in the color alone.
    pub fn selected(mut self, selected: bool) -> Self {
        self.selected = selected;
        self
    }
}

impl Styled for Card {
    fn style(&mut self) -> &mut StyleRefinement {
        &mut self.style
    }
}

impl ParentElement for Card {
    fn extend(&mut self, elements: impl IntoIterator<Item = AnyElement>) {
        self.children.extend(elements);
    }
}

impl RenderOnce for Card {
    fn render(self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let c = palette(cx);
        let hairline = px(tokens::BORDER_WIDTH_THIN);
        let mut surface = div()
            .relative()
            .flex()
            .flex_col()
            .rounded(px(tokens::RADIUS_LG))
            .border(hairline)
            .border_color(color(c.border_default))
            .bg(color(c.background_surface))
            .shadow(shadow(tokens::SHADOW_SUBTLE));
        let mut body = div()
            .flex()
            .flex_col()
            .gap(px(tokens::SPACE_4))
            .p(px(tokens::SPACE_4));
        let surface = match self.media {
            Some(media) => {
                // The padding and the gap the caller set belong under the picture; the rest
                // of the caller's style belongs to the card as a whole.
                let mut outer = self.style;
                body.style().padding.refine(&outer.padding);
                body.style().gap.refine(&outer.gap);
                outer.padding = Default::default();
                outer.gap = Default::default();
                surface.style().refine(&outer);
                surface.child(media).child(body.children(self.children))
            }
            None => {
                surface.style().refine(body.style());
                surface.style().refine(&self.style);
                surface.children(self.children)
            }
        };
        // Drawn over the hairline and over the picture rather than as a wider border, so
        // selecting does not change the size of the card.
        let surface = surface.when(self.selected, |surface| {
            surface.child(
                div()
                    .absolute()
                    .top(-hairline)
                    .left(-hairline)
                    .right(-hairline)
                    .bottom(-hairline)
                    .rounded(px(tokens::RADIUS_LG))
                    .border(px(tokens::BORDER_WIDTH_THICK))
                    .border_color(color(c.card_border_selected)),
            )
        });
        let Some((id, handler)) = self.press else {
            return surface.into_any_element();
        };
        let focus = window
            .use_keyed_state(id.clone(), cx, |_, cx| cx.focus_handle())
            .read(cx)
            .clone();
        let focused = focus.is_focused(window);
        surface
            .id(id)
            .role(Role::Button)
            .track_focus(&focus.tab_index(0).tab_stop(true))
            .hover(|surface| surface.bg(color(c.card_background_hover)))
            .active(|surface| surface.bg(color(c.card_background_pressed)))
            // A click does not move the focus here, as on a button, so the ring shows only
            // when the keyboard got there.
            .on_mouse_down(MouseButton::Left, |_, window, _| window.prevent_default())
            .on_click(move |event, window, cx| handler(event, window, cx))
            .when(self.selected, |surface| surface.aria_selected(true))
            .when(focused, |surface| surface.focus_ring_style(window, cx))
            .into_any_element()
    }
}

/// A line between groups of content.
pub fn divider(cx: &App) -> Div {
    div()
        .flex_none()
        .h(px(tokens::BORDER_WIDTH_THIN))
        .w_full()
        .bg(color(palette(cx).border_default))
}

/// Text in one of the design system's roles, for example `tokens::TYPOGRAPHY_HEADING`.
pub fn text(content: impl Into<SharedString>, style: tokens::Typography) -> Div {
    div().typography(style).child(content.into())
}

#[cfg(test)]
mod tests {
    use super::count_text;

    #[test]
    fn a_count_over_the_maximum_shows_the_maximum_and_a_plus() {
        assert_eq!(count_text(3, 99), "3");
        assert_eq!(count_text(99, 99), "99");
        assert_eq!(count_text(120, 99), "99+");
        assert_eq!(count_text(12, 9), "9+");
    }
}
