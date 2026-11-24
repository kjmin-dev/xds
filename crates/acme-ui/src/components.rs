//! Acme's general-purpose components for GPUI.
//!
//! They take the same variants, sizes and tones as the web components in `@acme/ui` and the
//! React Native ones in `@acme/ui-native`, and draw them from the same design tokens.
//! Interactive parts come from GPUI Component, which supplies focus, keyboard and input-method
//! handling; this module gives them Acme's sizes and wraps what GPUI Component lacks.

use std::rc::Rc;

use acme_tokens as tokens;
use gpui_kit::component::{
    Disableable as _, Sizable as _, Size, ThemeStyled as _,
    button::{Button as KitButton, ButtonCustomVariant, ButtonVariants as _},
    input::{Input, InputEvent, InputState, Textarea, TextareaState},
};
use gpui_kit::prelude::FluentBuilder as _;
use gpui_kit::{
    AnyElement, App, Bounds, BoxShadow, ClickEvent, ContentMask, Corners, Div, ElementId, Entity,
    Focusable as _, Hsla, ImageSource, InteractiveElement as _, IntoElement, MouseButton,
    ObjectFit, ParentElement, Pixels, Refineable as _, RenderOnce, Role, SharedString,
    StatefulInteractiveElement as _, StyleRefinement, Styled, StyledImage as _, Subscription,
    Window, canvas, div, fill, img, point, px, relative, size,
};

use crate::controls::{
    ClickHandler, IconSize, SpinnerSize, focus_handle, icon, icon_filled, spinner,
};
use crate::defaults::defaults;
use crate::theme::{TypographyExt as _, color, palette, theme};

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
    /// The height of a control of this size in `theme`. The desktop is used with a pointer.
    pub const fn height(self, t: &tokens::Theme) -> Pixels {
        px(match self {
            Self::Sm => t.pointer.control_sm,
            Self::Md => t.pointer.control_md,
            Self::Lg => t.pointer.control_lg,
        })
    }

    const fn padding(self, t: &tokens::Theme) -> Pixels {
        px(match self {
            Self::Sm => t.space.s3,
            Self::Md => t.space.s4,
            Self::Lg => t.space.s6,
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

/// A button in one of Acme's variants and sizes: `.variant` and `.control_size` choose them,
/// and without them it takes the registered [`Defaults`](crate::Defaults), or else a secondary
/// button of the middle size. Add `.on_click`, `.disabled`, `.loading`, `.icon_start`,
/// `.icon_end` or `.selected` to it, and size it like any element (`.w_full()`).
pub fn button(id: impl Into<ElementId>, label: impl Into<SharedString>) -> Button {
    Button {
        id: id.into(),
        style: StyleRefinement::default(),
        on_click: None,
        label: label.into(),
        variant: None,
        size: None,
        icon_start: None,
        icon_end: None,
        icon_only: false,
        selected: None,
        disabled: false,
        loading: false,
    }
}

/// A button that holds only an icon. The label is not drawn: it names the button for assistive
/// technology. It is a ghost button of the middle size unless `.variant` and `.control_size`, or
/// the registered [`Defaults`](crate::Defaults), say otherwise, and takes `.selected`,
/// `.disabled`, `.loading` and `.on_click` as a button does.
pub fn icon_button(
    id: impl Into<ElementId>,
    icon: tokens::Icon,
    label: impl Into<SharedString>,
) -> Button {
    let mut button = button(id, label);
    button.icon_start = Some(icon);
    button.icon_only = true;
    button
}

/// What [`button`] and [`icon_button`] return. GPUI Component's button draws it and supplies
/// focus and keyboard handling; this holds the options that decide what goes inside it,
/// because the icons, the spinner and the selected look depend on each other.
#[derive(IntoElement)]
pub struct Button {
    id: ElementId,
    style: StyleRefinement,
    on_click: Option<ClickHandler>,
    label: SharedString,
    variant: Option<ButtonVariant>,
    size: Option<ControlSize>,
    icon_start: Option<tokens::Icon>,
    icon_end: Option<tokens::Icon>,
    icon_only: bool,
    selected: Option<bool>,
    disabled: bool,
    loading: bool,
}

impl Button {
    pub const fn variant(mut self, variant: ButtonVariant) -> Self {
        self.variant = Some(variant);
        self
    }

    /// Named apart from `Styled::size`, which sets a width and a height.
    pub const fn control_size(mut self, size: ControlSize) -> Self {
        self.size = Some(size);
        self
    }

    /// An icon in front of the label, in the label's color.
    pub const fn icon_start(mut self, icon: tokens::Icon) -> Self {
        self.icon_start = Some(icon);
        self
    }

    /// An icon after the label, in the label's color.
    pub const fn icon_end(mut self, icon: tokens::Icon) -> Self {
        self.icon_end = Some(icon);
        self
    }

    /// Makes the button a toggle that reports its state to assistive technology. While it is
    /// `true` a secondary or ghost button is tinted and outlined and its start icon is filled,
    /// so the state does not depend on color; a primary or danger button only reports it.
    pub const fn selected(mut self, selected: bool) -> Self {
        self.selected = Some(selected);
        self
    }

    pub const fn disabled(mut self, disabled: bool) -> Self {
        self.disabled = disabled;
        self
    }

    /// Shows a spinner and ignores clicks. The spinner takes the place of the start icon, so
    /// the button keeps its width.
    pub const fn loading(mut self, loading: bool) -> Self {
        self.loading = loading;
        self
    }

    pub fn on_click(
        mut self,
        handler: impl Fn(&ClickEvent, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_click = Some(Rc::new(handler));
        self
    }
}

impl Styled for Button {
    fn style(&mut self) -> &mut StyleRefinement {
        &mut self.style
    }
}

impl RenderOnce for Button {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let t = theme(cx);
        let c = palette(cx);
        let (variant, size) = if self.icon_only {
            let given = defaults(cx).icon_button;
            (
                self.variant
                    .or(given.variant)
                    .unwrap_or(ButtonVariant::Ghost),
                self.size.or(given.size).unwrap_or_default(),
            )
        } else {
            let given = defaults(cx).button;
            (
                self.variant.or(given.variant).unwrap_or_default(),
                self.size.or(given.size).unwrap_or_default(),
            )
        };
        // A disabled button looks disabled whether or not it is selected.
        let tinted = self.selected == Some(true)
            && !self.disabled
            && matches!(variant, ButtonVariant::Secondary | ButtonVariant::Ghost);
        let (icon_size, label_style) = match size {
            ControlSize::Lg => (IconSize::Md, t.typography.body_strong),
            _ => (IconSize::Sm, t.typography.label),
        };
        // Alone in its square the icon has the room to follow the size of the control.
        let icon_size = match (self.icon_only, size) {
            (false, _) => icon_size,
            (true, ControlSize::Sm) => IconSize::Sm,
            (true, ControlSize::Md) => IconSize::Md,
            (true, ControlSize::Lg) => IconSize::Lg,
        };

        let base = KitButton::new(self.id);
        let base = match variant {
            // Filled buttons carry the same trace of shadow, so none looks flatter than the
            // outlined one.
            ButtonVariant::Primary => base.primary().shadow(shadow(t.shadow.subtle)),
            // Outlined, so it sits quietly beside a primary button.
            ButtonVariant::Secondary => base
                .secondary()
                .border_1()
                .border_color(color(c.button_secondary_border))
                .shadow(shadow(t.shadow.subtle)),
            ButtonVariant::Ghost => base.ghost(),
            ButtonVariant::Danger => base.danger().shadow(shadow(t.shadow.subtle)),
        };
        let height = size.height(t);
        let mut base = base
            .h(height)
            .min_w(height)
            .px(size.padding(t))
            .rounded(px(t.pointer.button_radius));
        if self.icon_only {
            // A square, and never smaller than the least a pointer can be asked to hit.
            let side = height.max(px(t.pointer.target_min));
            base = base.px(px(0.0)).size(side);
        }
        base.style().refine(&self.style);
        let base = match self.on_click {
            Some(handler) => base.on_click(move |event, window, cx| handler(event, window, cx)),
            None => base,
        };
        let start = if self.loading {
            // In a box the size of the icon it replaces, so the label does not move.
            Some(
                div()
                    .flex()
                    .flex_none()
                    .items_center()
                    .justify_center()
                    .size(px(icon_size.side(t)))
                    .child(spinner().spinner_size(SpinnerSize::Sm))
                    .into_any_element(),
            )
        } else {
            self.icon_start.map(|name| {
                if tinted {
                    icon_filled(name).icon_size(icon_size).into_any_element()
                } else {
                    icon(name).icon_size(icon_size).into_any_element()
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
        let end = self.icon_end.map(|name| icon(name).icon_size(icon_size));

        let base = if tinted {
            // GPUI Component paints its own selected look and drops hover and pressed for it,
            // so the tokens go in as a variant of their own.
            let selected = ButtonCustomVariant::new(cx)
                .color(color(c.button_selected_border))
                .foreground(color(c.button_selected_text))
                .hover(color(c.button_selected_background_hover))
                .active(color(c.button_selected_background_pressed));
            base.custom(selected)
                .bg(color(c.button_selected_background))
                .border(px(t.border.width_thin))
                .border_color(color(c.button_selected_border))
        } else if self.selected.is_some() && variant == ButtonVariant::Ghost {
            // The outline a selected ghost button gets, already there and transparent, so
            // toggling does not change the width.
            base.border(px(t.border.width_thin))
                .border_color(gpui_kit::transparent_black())
        } else {
            base
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

/// The label above a field. A text field and a select share it, so they line up in a form.
pub(crate) fn field_label(
    label: SharedString,
    disabled: bool,
    t: &tokens::Theme,
    c: &tokens::Colors,
) -> Div {
    div()
        .typography(t.typography.label)
        .text_color(color(if disabled {
            c.text_secondary
        } else {
            c.text_primary
        }))
        .child(label)
}

/// The box of a field, without its contents or its height.
pub(crate) fn field_frame(
    invalid: bool,
    disabled: bool,
    focused: bool,
    radius: Pixels,
    window: &Window,
    cx: &App,
) -> Div {
    let t = theme(cx);
    let c = palette(cx);
    div()
        .flex()
        .w_full()
        .rounded(radius)
        .border(px(t.border.width_thin))
        .border_color(color(if invalid {
            c.field_border_invalid
        } else {
            c.field_border
        }))
        .bg(color(if disabled {
            c.background_disabled
        } else {
            c.field_background
        }))
        .text_color(color(c.field_text))
        .when(focused, |frame| {
            let frame = frame.focus_ring_style(window, cx);
            if invalid {
                frame.border_color(color(c.field_border_invalid))
            } else {
                frame.border_color(color(c.field_border_focus))
            }
        })
}

/// What goes around the box of a field: an outline of its own when invalid, thicker than the
/// field's, so the state does not depend on telling red from grey.
pub(crate) fn field_outline(
    invalid: bool,
    radius: Pixels,
    t: &tokens::Theme,
    c: &tokens::Colors,
    frame: impl IntoElement,
) -> Div {
    div()
        .rounded(radius)
        .when(invalid, |outline| {
            outline
                .border(px(t.border.width_thin))
                .border_color(color(c.field_border_invalid))
        })
        .child(frame)
}

/// The line under a field: the error while there is one, the description otherwise.
pub(crate) fn field_note(
    error: Option<SharedString>,
    description: Option<SharedString>,
    t: &tokens::Theme,
    c: &tokens::Colors,
) -> Option<Div> {
    let invalid = error.is_some();
    error.or(description).map(|text| {
        div()
            .flex_1()
            .typography(t.typography.detail)
            .text_color(color(if invalid {
                c.status_danger
            } else {
                c.text_secondary
            }))
            .child(text)
    })
}

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
    style: StyleRefinement,
    label: SharedString,
    state: FieldState,
    description: Option<SharedString>,
    error: Option<SharedString>,
    disabled: bool,
    leading: Option<AnyElement>,
    trailing: Option<AnyElement>,
    rows: usize,
    max_length: Option<usize>,
    label_hidden: bool,
    pill: bool,
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
            style: StyleRefinement::default(),
            label: label.into(),
            state,
            description: None,
            error: None,
            disabled: false,
            leading: None,
            trailing: None,
            rows: 3,
            max_length: None,
            label_hidden: false,
            pill: false,
        }
    }

    /// Leaves the label to assistive technology and draws the box as a pill: what a search
    /// field is, whose icon says what the label would.
    const fn search(mut self) -> Self {
        self.label_hidden = true;
        self.pill = true;
        self
    }

    pub fn description(mut self, description: impl Into<SharedString>) -> Self {
        self.description = Some(description.into());
        self
    }

    pub fn error(mut self, error: Option<impl Into<SharedString>>) -> Self {
        self.error = error.map(Into::into);
        self
    }

    pub const fn disabled(mut self, disabled: bool) -> Self {
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
    pub const fn rows(mut self, rows: usize) -> Self {
        self.rows = rows;
        self
    }

    /// The field takes no more characters than this, and counts them under its end edge.
    /// On a one-line field this replaces the validator of the input state.
    pub const fn max_length(mut self, max_length: usize) -> Self {
        self.max_length = Some(max_length);
        self
    }
}

impl TextField {
    fn draw(self, window: &mut Window, cx: &mut App) -> impl IntoElement + Styled {
        let t = theme(cx);
        let colors = palette(cx);
        let invalid = self.error.is_some();
        let multiline = matches!(self.state, FieldState::Area(_));
        let line = px(t.typography.body.line_height_px());
        let radius = px(if self.pill {
            t.radius.full
        } else {
            t.radius.md
        });

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
        let inset = px(t.space.s2);
        // A text area's lines start this far below its top edge, so the slots start there too.
        let area_inset = Size::Small.input_py();
        let slot = |element: AnyElement| {
            div()
                .flex()
                .flex_none()
                .items_center()
                .h(line)
                .when(multiline, |slot| slot.mt(area_inset))
                .typography(t.typography.body)
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
                    .typography(t.typography.body);
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
                .typography(t.typography.body)
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
        let frame = field_frame(invalid, self.disabled, focused, radius, window, cx)
            .px(px(t.space.s1))
            .map(|frame| {
                if multiline {
                    frame.items_start().py(px(t.space.s1))
                } else {
                    frame.items_center().h(ControlSize::Md.height(t))
                }
            })
            .when(!self.disabled, |frame| {
                // The whole box takes the caret, not only the text inside it.
                frame.on_mouse_down(MouseButton::Left, focus_text)
            })
            .children(self.leading.map(|element| slot(element).ml(px(t.space.s2))))
            .child(control)
            .children(
                self.trailing
                    .map(|element| slot(element).mr(px(t.space.s2))),
            );

        let note = field_note(self.error, self.description, t, colors);
        let counter = self.max_length.map(|max| {
            div()
                .flex_none()
                .typography(t.typography.footnote)
                .text_color(color(colors.text_secondary))
                .child(format!("{length}/{max}"))
        });
        let footer = (note.is_some() || counter.is_some()).then(|| {
            div()
                .flex()
                .items_start()
                // Keeps the counter at the end edge when there is no note beside it.
                .justify_end()
                .gap(px(t.space.s3))
                .children(note)
                .children(counter)
        });

        div()
            .flex()
            .flex_col()
            .gap(px(t.space.s1))
            .when(!self.label_hidden, |field| {
                field.child(field_label(self.label, self.disabled, t, colors))
            })
            .child(field_outline(invalid, radius, t, colors, frame))
            .children(footer)
    }
}

impl Styled for TextField {
    fn style(&mut self) -> &mut StyleRefinement {
        &mut self.style
    }
}

impl RenderOnce for TextField {
    fn render(mut self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let style = std::mem::take(&mut self.style);
        let mut root = self.draw(window, cx);
        root.style().refine(&style);
        root
    }
}

// ---------------------------------------------------------------- search field

type SubmitHandler = Rc<dyn Fn(&SharedString, &mut Window, &mut App)>;

/// Listens to the input for Enter on behalf of a search field, which is rebuilt every frame
/// and so cannot hold a subscription itself.
struct SubmitWatch {
    handler: Option<SubmitHandler>,
    _subscription: Subscription,
}

/// A text field for a query: a pill with a search icon and, while there is a value, a control
/// that clears it. The label is not drawn; it names the field for assistive technology.
///
/// As with [`TextField`], the value and the placeholder live in the input state: read the
/// value from it, and subscribe to it to hear of changes.
#[derive(IntoElement)]
pub struct SearchField {
    style: StyleRefinement,
    id: ElementId,
    label: SharedString,
    state: Entity<InputState>,
    disabled: bool,
    clear_label: SharedString,
    on_submit: Option<SubmitHandler>,
}

impl SearchField {
    pub fn new(
        id: impl Into<ElementId>,
        label: impl Into<SharedString>,
        state: &Entity<InputState>,
    ) -> Self {
        Self {
            style: StyleRefinement::default(),
            id: id.into(),
            label: label.into(),
            state: state.clone(),
            disabled: false,
            clear_label: "Clear".into(),
            on_submit: None,
        }
    }

    pub const fn disabled(mut self, disabled: bool) -> Self {
        self.disabled = disabled;
        self
    }

    /// Names the clear control for assistive technology. "Clear" unless set.
    pub fn clear_label(mut self, label: impl Into<SharedString>) -> Self {
        self.clear_label = label.into();
        self
    }

    /// Called with the query when Enter is pressed in the field.
    pub fn on_submit(
        mut self,
        handler: impl Fn(&SharedString, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_submit = Some(Rc::new(handler));
        self
    }
}

impl SearchField {
    fn draw(self, window: &mut Window, cx: &mut App) -> impl IntoElement + Styled {
        let t = theme(cx);
        let c = palette(cx);
        let input = self.state.clone();
        let watch = window.use_keyed_state((self.id.clone(), "submit"), cx, |window, cx| {
            let subscription = cx.subscribe_in(
                &input,
                window,
                |watch: &mut SubmitWatch, input, event: &InputEvent, window, cx| {
                    if let InputEvent::PressEnter { .. } = event
                        && let Some(handler) = watch.handler.clone()
                    {
                        let query = input.read(cx).value();
                        handler(&query, window, cx);
                    }
                },
            );
            SubmitWatch {
                handler: None,
                _subscription: subscription,
            }
        });
        // The handler is new every frame; the subscription keeps the latest.
        watch.update(cx, |watch, _| watch.handler = self.on_submit);

        let has_value = !self.state.read(cx).value().is_empty();
        let clear = (has_value && !self.disabled).then(|| {
            let id: ElementId = (self.id.clone(), "clear").into();
            let focus = focus_handle(&id, window, cx);
            let focused = focus.is_focused(window);
            let state = self.state.clone();
            div()
                .id(id)
                .role(Role::Button)
                .aria_label(self.clear_label)
                .track_focus(&focus.tab_index(0).tab_stop(true))
                .flex()
                .items_center()
                .justify_center()
                .size(px(t.pointer.target_min))
                .rounded_full()
                .hover(|clear| clear.text_color(color(c.field_text)))
                // Keeps the press from the box around it, which would take it for its own.
                .on_mouse_down(MouseButton::Left, |_, window, _| window.prevent_default())
                .on_click(move |_, window, cx| {
                    state.update(cx, |state, cx| {
                        // An edit, so the field reports the change and Undo brings the query back.
                        state.replace_all("", window, cx);
                        state.focus(window, cx);
                    });
                })
                .when(focused, |clear| clear.focus_ring_style(window, cx))
                .child(icon(tokens::Icon::CircleX).icon_size(IconSize::Sm))
        });
        let field = TextField::new(self.label, &self.state)
            .search()
            .disabled(self.disabled)
            .leading(icon(tokens::Icon::Search).icon_size(IconSize::Sm));
        match clear {
            Some(clear) => field.trailing(clear),
            None => field,
        }
    }
}

impl Styled for SearchField {
    fn style(&mut self) -> &mut StyleRefinement {
        &mut self.style
    }
}

impl RenderOnce for SearchField {
    fn render(mut self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let style = std::mem::take(&mut self.style);
        let mut root = self.draw(window, cx);
        root.style().refine(&style);
        root
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
    style: StyleRefinement,
    label: SharedString,
    tone: Option<BadgeTone>,
    dot: bool,
    icon: Option<tokens::Icon>,
}

impl Badge {
    pub fn new(label: impl Into<SharedString>) -> Self {
        Self {
            style: StyleRefinement::default(),
            label: label.into(),
            tone: None,
            dot: false,
            icon: None,
        }
    }

    pub const fn tone(mut self, tone: BadgeTone) -> Self {
        self.tone = Some(tone);
        self
    }

    pub const fn dot(mut self) -> Self {
        self.dot = true;
        self
    }

    /// An icon in front of the label, in the label's color.
    pub const fn icon(mut self, icon: tokens::Icon) -> Self {
        self.icon = Some(icon);
        self
    }
}

impl Badge {
    fn draw(self, _window: &mut Window, cx: &mut App) -> impl IntoElement + Styled {
        let t = theme(cx);
        let c = palette(cx);
        let tone = self
            .tone
            .or_else(|| defaults(cx).badge.tone)
            .unwrap_or_default();
        let (background, text) = match tone {
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
            .gap(px(t.space.s1_5))
            .h(px(t.pointer.badge))
            .px(px(t.space.s2_5))
            .rounded_full()
            .bg(color(background))
            .text_color(color(text))
            .typography(t.typography.footnote)
            .when(self.dot, |badge| {
                badge.child(
                    div()
                        .flex_none()
                        .size(px(t.space.s1_5))
                        .rounded_full()
                        .bg(color(text)),
                )
            })
            .children(self.icon.map(|name| icon(name).icon_size(IconSize::Xs)))
            .child(self.label)
    }
}

impl Styled for Badge {
    fn style(&mut self) -> &mut StyleRefinement {
        &mut self.style
    }
}

impl RenderOnce for Badge {
    fn render(mut self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let style = std::mem::take(&mut self.style);
        let mut root = self.draw(window, cx);
        root.style().refine(&style);
        root
    }
}

/// A count on an icon, an avatar or a button: unread messages, items in a cart. A count of
/// zero or less draws nothing but the child.
#[derive(IntoElement)]
pub struct CountBadge {
    style: StyleRefinement,
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
            style: StyleRefinement::default(),
            id: id.into(),
            count,
            max: 99,
            label: None,
            child: None,
        }
    }

    /// The largest count shown as a number; a larger one shows as `99+`. 99 unless set.
    pub const fn max(mut self, max: i64) -> Self {
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
pub(crate) fn count_text(count: i64, max: i64) -> String {
    if count > max {
        format!("{max}+")
    } else {
        count.to_string()
    }
}

impl CountBadge {
    fn draw(self, _window: &mut Window, cx: &mut App) -> impl IntoElement + Styled {
        let t = theme(cx);
        let c = palette(cx);
        let side = t.pointer.count_badge;
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
                .px(px(t.space.s1))
                .rounded_full()
                .bg(color(c.badge_count_background))
                .text_color(color(c.badge_count_text))
                .typography(t.typography.footnote)
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

impl Styled for CountBadge {
    fn style(&mut self) -> &mut StyleRefinement {
        &mut self.style
    }
}

impl RenderOnce for CountBadge {
    fn render(mut self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let style = std::mem::take(&mut self.style);
        let mut root = self.draw(window, cx);
        root.style().refine(&style);
        root
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
    style: StyleRefinement,
    id: ElementId,
    tone: Option<BannerTone>,
    title: Option<SharedString>,
    message: SharedString,
    action: Option<(SharedString, ClickHandler)>,
    on_dismiss: Option<ClickHandler>,
    dismiss_label: SharedString,
}

impl Banner {
    /// A banner in the tone `.tone` gives, or else the registered
    /// [`Defaults`](crate::Defaults), or else `Info`.
    pub fn new(message: impl Into<SharedString>) -> Self {
        Self {
            style: StyleRefinement::default(),
            id: "banner".into(),
            tone: None,
            title: None,
            message: message.into(),
            action: None,
            on_dismiss: None,
            dismiss_label: "Dismiss".into(),
        }
    }

    pub const fn tone(mut self, tone: BannerTone) -> Self {
        self.tone = Some(tone);
        self
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

impl Banner {
    fn draw(self, _window: &mut Window, cx: &mut App) -> impl IntoElement + Styled {
        let t = theme(cx);
        let c = palette(cx);
        let tone = self
            .tone
            .or_else(|| defaults(cx).banner.tone)
            .unwrap_or_default();
        let (background, accent, mark) = match tone {
            BannerTone::Info => (c.banner_info_background, c.banner_info_accent, "i"),
            BannerTone::Success => (c.banner_success_background, c.banner_success_accent, "✓"),
            BannerTone::Warning => (c.banner_warning_background, c.banner_warning_accent, "!"),
            BannerTone::Danger => (c.banner_danger_background, c.banner_danger_accent, "×"),
        };
        let action = self.action.map(|(label, handler)| {
            // In a row of its own, so the button keeps the width of its label.
            div().flex().pt(px(t.space.s2)).child(
                button((self.id.clone(), "action"), label)
                    .variant(ButtonVariant::Secondary)
                    .control_size(ControlSize::Sm)
                    .on_click(move |event, window, cx| handler(event, window, cx)),
            )
        });
        let dismiss = self.on_dismiss.map(|handler| {
            icon_button(
                (self.id.clone(), "dismiss"),
                tokens::Icon::X,
                self.dismiss_label,
            )
            .control_size(ControlSize::Sm)
            .on_click(move |event, window, cx| handler(event, window, cx))
        });
        div()
            .flex()
            .items_start()
            .gap(px(t.space.s3))
            .p(px(t.space.s3))
            .rounded(px(t.radius.md))
            .bg(color(background))
            .text_color(color(c.banner_text))
            .child(
                div()
                    .flex()
                    .flex_none()
                    .items_center()
                    .justify_center()
                    .size(px(t.pointer.icon_md))
                    .rounded_full()
                    .bg(color(accent))
                    .text_color(color(background))
                    .typography(t.typography.footnote)
                    .child(mark),
            )
            .child(
                div()
                    .flex_1()
                    .flex()
                    .flex_col()
                    .gap(px(t.space.s0_5))
                    .children(
                        self.title
                            .map(|title| div().typography(t.typography.label).child(title)),
                    )
                    .child(div().typography(t.typography.detail).child(self.message))
                    .children(action),
            )
            .children(dismiss)
    }
}

impl Styled for Banner {
    fn style(&mut self) -> &mut StyleRefinement {
        &mut self.style
    }
}

impl RenderOnce for Banner {
    fn render(mut self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let style = std::mem::take(&mut self.style);
        let mut root = self.draw(window, cx);
        root.style().refine(&style);
        root
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
    /// The picture, given the radius of the card's top corners.
    media: Option<Box<dyn FnOnce(Pixels) -> AnyElement>>,
    selected: bool,
    press: Option<(ElementId, ClickHandler)>,
}

impl Card {
    /// A picture at the top of the card, edge to edge above the padding. GPUI clips to
    /// rectangles only, so the card rounds the top corners of the element it is given: pass
    /// the picture itself (an `img`, or a `div` with a background), not a wrapper around it.
    pub fn media(mut self, media: impl IntoElement + Styled + 'static) -> Self {
        self.media = Some(Box::new(move |radius| {
            media.rounded_t(radius).into_any_element()
        }));
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
    pub const fn selected(mut self, selected: bool) -> Self {
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
        let t = theme(cx);
        let c = palette(cx);
        let hairline = px(t.border.width_thin);
        let mut surface = div()
            .relative()
            .flex()
            .flex_col()
            .rounded(px(t.radius.lg))
            .border(hairline)
            .border_color(color(c.border_default))
            .bg(color(c.background_surface))
            .shadow(shadow(t.shadow.subtle));
        let mut body = div()
            .flex()
            .flex_col()
            .gap(px(t.space.s4))
            .p(px(t.space.s4));
        let surface = if let Some(media) = self.media {
            // The padding and the gap the caller set belong under the picture; the rest
            // of the caller's style belongs to the card as a whole.
            let mut outer = self.style;
            body.style()
                .padding
                .refine(&std::mem::take(&mut outer.padding));
            body.style().gap.refine(&std::mem::take(&mut outer.gap));
            surface.style().refine(&outer);
            // Inside the hairline, so the picture's corners follow the inner edge of the
            // outline.
            let media = media(px(t.radius.lg - t.border.width_thin));
            surface.child(media).child(body.children(self.children))
        } else {
            surface.style().refine(body.style());
            surface.style().refine(&self.style);
            surface.children(self.children)
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
                    .rounded(px(t.radius.lg))
                    .border(px(t.border.width_thick))
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

// ---------------------------------------------------------------- thumbnail

/// The shape of a thumbnail, width to height. Rust names cannot start with a digit, so each
/// shape is named after its ratio: `Ratio16x9` is 16:9.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum ThumbnailRatio {
    /// 16:9, a video.
    #[default]
    Ratio16x9,
    /// 1:1, a product or an album.
    Ratio1x1,
    /// 4:3, a photograph or an article.
    Ratio4x3,
    /// 9:16, a short vertical video.
    Ratio9x16,
}

impl ThumbnailRatio {
    /// The width divided by the height.
    fn value(self) -> f32 {
        match self {
            Self::Ratio16x9 => 16.0 / 9.0,
            Self::Ratio1x1 => 1.0,
            Self::Ratio4x3 => 4.0 / 3.0,
            Self::Ratio9x16 => 9.0 / 16.0,
        }
    }
}

/// How much of a progress bar to draw: none for no progress or for zero, and never more than
/// the whole width.
fn watched(progress: Option<f32>) -> Option<f32> {
    progress
        .map(|progress| progress.clamp(0.0, 1.0))
        .filter(|progress| *progress > 0.0)
}

/// A picture in a fixed shape, for a video, an article or a product. It fills the width it is
/// given and takes its height from the ratio.
#[derive(IntoElement)]
pub struct Thumbnail {
    style: StyleRefinement,
    id: ElementId,
    src: Option<ImageSource>,
    alt: SharedString,
    ratio: Option<ThumbnailRatio>,
    badge: Option<SharedString>,
    progress: Option<f32>,
}

impl Thumbnail {
    /// GPUI reports an element to assistive technology only when it has an id, so the
    /// thumbnail takes one.
    pub fn new(id: impl Into<ElementId>) -> Self {
        Self {
            style: StyleRefinement::default(),
            id: id.into(),
            src: None,
            alt: SharedString::default(),
            ratio: None,
            badge: None,
            progress: None,
        }
    }

    /// The picture: a URL, a file path or an image in memory, loaded as for [`Avatar::src`].
    /// It is cropped to cover the shape. While it loads, when it fails and without one, the
    /// place shows a picture mark instead.
    ///
    /// [`Avatar::src`]: crate::Avatar::src
    pub fn src(mut self, src: impl Into<ImageSource>) -> Self {
        self.src = Some(src.into());
        self
    }

    /// What the picture shows, for assistive technology. Without it, or empty, the picture is
    /// decoration and is not announced.
    pub fn alt(mut self, alt: impl Into<SharedString>) -> Self {
        self.alt = alt.into();
        self
    }

    pub const fn ratio(mut self, ratio: ThumbnailRatio) -> Self {
        self.ratio = Some(ratio);
        self
    }

    /// Short text on the bottom end corner, such as a duration.
    pub fn badge(mut self, badge: impl Into<SharedString>) -> Self {
        self.badge = Some(badge.into());
        self
    }

    /// How much was watched, from 0 to 1, as a bar along the bottom edge. Zero draws nothing.
    pub const fn progress(mut self, progress: f32) -> Self {
        self.progress = Some(progress);
        self
    }
}

impl Thumbnail {
    fn draw(self, _window: &mut Window, cx: &mut App) -> impl IntoElement + Styled {
        let t = theme(cx);
        let c = palette(cx);
        let radius = px(t.radius.md);
        let watched = watched(self.progress);
        let inset = px(t.space.s2);
        let bar = px(t.space.s1);
        let (track, accent) = (color(c.overlay_background), color(c.overlay_accent));
        let progress = watched.map(|watched| {
            // GPUI clips to rectangles only, so the bar is the whole rounded shape painted
            // through a slit along the bottom edge: its ends follow the rounded corners, as a
            // bar clipped by the picture's corners would.
            canvas(
                |_, _, _| {},
                move |bounds, (), window, _| {
                    let shape =
                        |paint: Hsla| fill(bounds, paint).corner_radii(Corners::all(radius));
                    let slit = Bounds::new(
                        point(bounds.left(), bounds.bottom() - bar),
                        size(bounds.size.width, bar),
                    );
                    window.with_content_mask(Some(ContentMask { bounds: slit }), |window| {
                        window.paint_quad(shape(track));
                    });
                    let done = Bounds::new(slit.origin, size(slit.size.width * watched, bar));
                    window.with_content_mask(Some(ContentMask { bounds: done }), |window| {
                        window.paint_quad(shape(accent));
                    });
                },
            )
            .absolute()
            .top_0()
            .left_0()
            .size_full()
        });
        let badge = self.badge.map(|label| {
            div()
                .absolute()
                .right(inset)
                // Above the bar when there is one.
                .bottom(if watched.is_some() {
                    inset + bar
                } else {
                    inset
                })
                .child(Badge::new(label).tone(BadgeTone::Overlay))
        });
        let alt = self.alt;
        div()
            .id(self.id)
            .when(!alt.is_empty(), |frame| {
                frame.role(Role::Image).aria_label(alt)
            })
            .relative()
            .flex()
            .items_center()
            .justify_center()
            .w_full()
            .aspect_ratio(
                self.ratio
                    .or_else(|| defaults(cx).thumbnail.ratio)
                    .unwrap_or_default()
                    .value(),
            )
            .rounded(radius)
            .bg(color(c.thumbnail_background))
            .text_color(color(c.thumbnail_icon))
            .child(icon(tokens::Icon::Image).icon_size(IconSize::Lg))
            // Over the mark, and drawn only once it has loaded, so the mark is what shows
            // until then and when it fails.
            .children(self.src.map(|src| {
                img(src)
                    .absolute()
                    .inset_0()
                    .size_full()
                    .rounded(radius)
                    .object_fit(ObjectFit::Cover)
            }))
            .children(progress)
            .children(badge)
    }
}

impl Styled for Thumbnail {
    fn style(&mut self) -> &mut StyleRefinement {
        &mut self.style
    }
}

impl RenderOnce for Thumbnail {
    fn render(mut self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let style = std::mem::take(&mut self.style);
        let mut root = self.draw(window, cx);
        root.style().refine(&style);
        root
    }
}

// ---------------------------------------------------------------- media card

/// `Vertical` puts the thumbnail on top, `Horizontal` at the start, at 40% of the width.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum MediaCardLayout {
    #[default]
    Vertical,
    Horizontal,
}

/// A thumbnail with its title and details: a video in a feed, an article in a list.
#[derive(IntoElement)]
pub struct MediaCard {
    style: StyleRefinement,
    id: ElementId,
    title: SharedString,
    layout: Option<MediaCardLayout>,
    thumbnail: Thumbnail,
    meta: Vec<SharedString>,
    leading: Option<AnyElement>,
    action: Option<AnyElement>,
    on_press: Option<ClickHandler>,
}

impl MediaCard {
    pub fn new(id: impl Into<ElementId>, title: impl Into<SharedString>) -> Self {
        let id = id.into();
        Self {
            style: StyleRefinement::default(),
            // A part of the card, so the app's defaults for a thumbnail do not reach it.
            thumbnail: Thumbnail::new((id.clone(), "thumbnail")).ratio(ThumbnailRatio::default()),
            id,
            title: title.into(),
            layout: None,
            meta: Vec::new(),
            leading: None,
            action: None,
            on_press: None,
        }
    }

    pub const fn layout(mut self, layout: MediaCardLayout) -> Self {
        self.layout = Some(layout);
        self
    }

    /// The picture, as for [`Thumbnail::src`].
    pub fn src(mut self, src: impl Into<ImageSource>) -> Self {
        self.thumbnail = self.thumbnail.src(src);
        self
    }

    /// What the picture shows, as for [`Thumbnail::alt`]. The title already names the card,
    /// so leave it out unless the picture says more.
    pub fn alt(mut self, alt: impl Into<SharedString>) -> Self {
        self.thumbnail = self.thumbnail.alt(alt);
        self
    }

    pub fn ratio(mut self, ratio: ThumbnailRatio) -> Self {
        self.thumbnail = self.thumbnail.ratio(ratio);
        self
    }

    /// Short text on the picture, as for [`Thumbnail::badge`].
    pub fn badge(mut self, badge: impl Into<SharedString>) -> Self {
        self.thumbnail = self.thumbnail.badge(badge);
        self
    }

    /// How much was watched, as for [`Thumbnail::progress`].
    pub fn progress(mut self, progress: f32) -> Self {
        self.thumbnail = self.thumbnail.progress(progress);
        self
    }

    /// Short lines under the title, such as a channel name and "3 days ago". Each stays on
    /// one line.
    pub fn meta(mut self, lines: impl IntoIterator<Item = impl Into<SharedString>>) -> Self {
        self.meta = lines.into_iter().map(Into::into).collect();
        self
    }

    /// Before the text, in the vertical layout: an avatar. The horizontal layout leaves it
    /// out, since the picture is already there.
    pub fn leading(mut self, element: impl IntoElement) -> Self {
        self.leading = Some(element.into_any_element());
        self
    }

    /// At the end of the text: an icon button, or the trigger of a menu. It stays a control
    /// of its own: pressing it does not press the card.
    pub fn action(mut self, element: impl IntoElement) -> Self {
        self.action = Some(element.into_any_element());
        self
    }

    /// Makes the whole card one button, named by its title and its details.
    pub fn on_press(
        mut self,
        handler: impl Fn(&ClickEvent, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_press = Some(Rc::new(handler));
        self
    }
}

/// What a pressable media card is called: its title, then its details.
fn media_name(title: &str, meta: &[SharedString]) -> String {
    std::iter::once(title)
        .chain(meta.iter().map(AsRef::as_ref))
        .collect::<Vec<_>>()
        .join(", ")
}

impl MediaCard {
    /// What the component draws, with the app's style on its root: the card, which is pressable
    /// or not.
    fn draw(self, window: &mut Window, cx: &mut App) -> AnyElement {
        let t = theme(cx);
        let c = palette(cx);
        let gap = px(t.space.s3);
        let name = media_name(&self.title, &self.meta);
        let text = div()
            .flex_1()
            .min_w_0()
            .flex()
            .flex_col()
            .gap(px(t.space.s0_5))
            .child(
                div()
                    .typography(t.typography.body_strong)
                    .text_color(color(c.text_primary))
                    .line_clamp(2)
                    .text_ellipsis()
                    .child(self.title),
            )
            .children(self.meta.into_iter().map(|line| {
                div()
                    .typography(t.typography.detail)
                    .text_color(color(c.text_secondary))
                    .truncate()
                    .child(line)
            }));
        let action = self.action.map(|action| {
            div()
                .flex()
                .flex_none()
                // The card hears of a press after the controls inside it, so a press that the
                // action took stops here and does not press the card too.
                .on_mouse_down(MouseButton::Left, |_, _, cx| cx.stop_propagation())
                .child(action)
        });
        let body = match self
            .layout
            .or_else(|| defaults(cx).media_card.layout)
            .unwrap_or_default()
        {
            MediaCardLayout::Vertical => div()
                .flex()
                .flex_col()
                .gap(gap)
                .child(self.thumbnail)
                .child(
                    div()
                        .flex()
                        .items_start()
                        .gap(gap)
                        .children(self.leading)
                        .child(text)
                        .children(action),
                ),
            MediaCardLayout::Horizontal => div()
                .flex()
                .items_start()
                .gap(gap)
                .child(div().flex_none().w(relative(0.4)).child(self.thumbnail))
                .child(text)
                .children(action),
        };
        let Some(on_press) = self.on_press else {
            let mut body = body;
            body.style().refine(&self.style);
            return body.into_any_element();
        };
        let focus = focus_handle(&self.id, window, cx);
        let focused = focus.is_focused(window);
        let mut card = body
            .id(self.id)
            .role(Role::Button)
            .aria_label(name)
            .track_focus(&focus.tab_index(0).tab_stop(true))
            .p(px(t.space.s2))
            .rounded(px(t.radius.lg))
            .hover(|card| card.bg(color(c.card_background_hover)))
            .active(|card| card.bg(color(c.card_background_pressed)))
            // A click does not move the focus here, as on a button, so the ring shows only
            // when the keyboard got there.
            .on_mouse_down(MouseButton::Left, |_, window, _| window.prevent_default())
            .on_click(move |event, window, cx| on_press(event, window, cx))
            .when(focused, |card| card.focus_ring_style(window, cx));
        card.style().refine(&self.style);
        card.into_any_element()
    }
}

impl Styled for MediaCard {
    fn style(&mut self) -> &mut StyleRefinement {
        &mut self.style
    }
}

impl RenderOnce for MediaCard {
    fn render(self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        self.draw(window, cx)
    }
}

// ---------------------------------------------------------------- section header

/// The title row of a group of content, with an optional description and an action such as
/// "See all".
#[derive(IntoElement)]
pub struct SectionHeader {
    style: StyleRefinement,
    id: ElementId,
    title: SharedString,
    description: Option<SharedString>,
    icon: Option<tokens::Icon>,
    action: Option<(SharedString, ClickHandler)>,
    level: usize,
}

impl SectionHeader {
    /// GPUI reports the title as a heading only when it has an id, so the header takes one.
    pub fn new(id: impl Into<ElementId>, title: impl Into<SharedString>) -> Self {
        Self {
            style: StyleRefinement::default(),
            id: id.into(),
            title: title.into(),
            description: None,
            icon: None,
            action: None,
            level: 2,
        }
    }

    /// A line under the title.
    pub fn description(mut self, description: impl Into<SharedString>) -> Self {
        self.description = Some(description.into());
        self
    }

    /// An icon in front of the title.
    pub const fn icon(mut self, icon: tokens::Icon) -> Self {
        self.icon = Some(icon);
        self
    }

    /// One thing to do about the group, such as "See all", as a small ghost button with a
    /// chevron at the end edge.
    pub fn action(
        mut self,
        label: impl Into<SharedString>,
        handler: impl Fn(&ClickEvent, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.action = Some((label.into(), Rc::new(handler)));
        self
    }

    /// The level of the title in the outline of the view. 2 unless set.
    pub const fn level(mut self, level: usize) -> Self {
        self.level = level;
        self
    }
}

impl SectionHeader {
    fn draw(self, _window: &mut Window, cx: &mut App) -> impl IntoElement + Styled {
        let t = theme(cx);
        let c = palette(cx);
        // The icon and the action are centered on the title's line, not on the title and the
        // description together.
        let line = px(t.typography.heading.line_height_px());
        let on_title_line = || div().flex().flex_none().items_center().h(line);
        let action = self.action.map(|(label, handler)| {
            on_title_line().ml(px(t.space.s4)).child(
                button((self.id.clone(), "action"), label)
                    .variant(ButtonVariant::Ghost)
                    .control_size(ControlSize::Sm)
                    .icon_end(tokens::Icon::ChevronRight)
                    .on_click(move |event, window, cx| handler(event, window, cx)),
            )
        });
        div()
            .flex()
            .items_start()
            .w_full()
            .children(self.icon.map(|name| {
                on_title_line()
                    .mr(px(t.space.s2))
                    .text_color(color(c.text_secondary))
                    .child(icon(name).icon_size(IconSize::Md))
            }))
            .child(
                div()
                    .flex_1()
                    .min_w_0()
                    .flex()
                    .flex_col()
                    .gap(px(t.space.s0_5))
                    .child(
                        div()
                            .id(self.id)
                            .role(Role::Heading)
                            .aria_level(self.level)
                            .aria_label(self.title.clone())
                            .typography(t.typography.heading)
                            .text_color(color(c.text_primary))
                            .child(self.title),
                    )
                    .children(self.description.map(|description| {
                        div()
                            .typography(t.typography.detail)
                            .text_color(color(c.text_secondary))
                            .child(description)
                    })),
            )
            .children(action)
    }
}

impl Styled for SectionHeader {
    fn style(&mut self) -> &mut StyleRefinement {
        &mut self.style
    }
}

impl RenderOnce for SectionHeader {
    fn render(mut self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let style = std::mem::take(&mut self.style);
        let mut root = self.draw(window, cx);
        root.style().refine(&style);
        root
    }
}

// ---------------------------------------------------------------- empty state

/// What a view says when it has nothing to show, and the one thing to do about it. It centers
/// itself in the room it is given.
#[derive(IntoElement)]
pub struct EmptyState {
    style: StyleRefinement,
    icon: tokens::Icon,
    title: SharedString,
    description: Option<SharedString>,
    action: Option<AnyElement>,
}

impl EmptyState {
    /// The icon is decoration; the title says what is missing.
    pub fn new(icon: tokens::Icon, title: impl Into<SharedString>) -> Self {
        Self {
            style: StyleRefinement::default(),
            icon,
            title: title.into(),
            description: None,
            action: None,
        }
    }

    pub fn description(mut self, description: impl Into<SharedString>) -> Self {
        self.description = Some(description.into());
        self
    }

    /// Under the text: usually a button.
    pub fn action(mut self, element: impl IntoElement) -> Self {
        self.action = Some(element.into_any_element());
        self
    }
}

impl EmptyState {
    fn draw(self, _window: &mut Window, cx: &mut App) -> impl IntoElement + Styled {
        let t = theme(cx);
        let c = palette(cx);
        div().flex().justify_center().w_full().child(
            div()
                .flex()
                .flex_col()
                .items_center()
                .w_full()
                .max_w(px(t.pointer.dialog))
                .py(px(t.space.s8))
                .text_center()
                .child(
                    icon(self.icon)
                        .icon_size(IconSize::Xl)
                        .text_color(color(c.empty_state_icon)),
                )
                .child(
                    div()
                        .mt(px(t.space.s4))
                        .typography(t.typography.heading)
                        .text_color(color(c.text_primary))
                        .child(self.title),
                )
                .children(self.description.map(|description| {
                    div()
                        .mt(px(t.space.s2))
                        .typography(t.typography.body)
                        .text_color(color(c.text_secondary))
                        .child(description)
                }))
                .children(
                    self.action
                        .map(|action| div().flex().mt(px(t.space.s6)).child(action)),
                ),
        )
    }
}

impl Styled for EmptyState {
    fn style(&mut self) -> &mut StyleRefinement {
        &mut self.style
    }
}

impl RenderOnce for EmptyState {
    fn render(mut self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let style = std::mem::take(&mut self.style);
        let mut root = self.draw(window, cx);
        root.style().refine(&style);
        root
    }
}

/// A line between groups of content.
pub fn divider(cx: &App) -> Div {
    let t = theme(cx);
    div()
        .flex_none()
        .h(px(t.border.width_thin))
        .w_full()
        .bg(color(palette(cx).border_default))
}

/// What a piece of [`text`] is for: one of the design system's type roles, which sets its size,
/// weight, line height and tracking together.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum TextVariant {
    Display,
    Title,
    Heading,
    #[default]
    Body,
    BodyStrong,
    Label,
    Detail,
    Footnote,
}

impl TextVariant {
    pub const ALL: [Self; 8] = [
        Self::Display,
        Self::Title,
        Self::Heading,
        Self::Body,
        Self::BodyStrong,
        Self::Label,
        Self::Detail,
        Self::Footnote,
    ];

    /// The variant's name in the component contract.
    pub const fn name(self) -> &'static str {
        match self {
            Self::Display => "display",
            Self::Title => "title",
            Self::Heading => "heading",
            Self::Body => "body",
            Self::BodyStrong => "body-strong",
            Self::Label => "label",
            Self::Detail => "detail",
            Self::Footnote => "footnote",
        }
    }

    /// The type role of this variant in `theme`.
    pub const fn typography(self, t: &tokens::Theme) -> tokens::Typography {
        match self {
            Self::Display => t.typography.display,
            Self::Title => t.typography.title,
            Self::Heading => t.typography.heading,
            Self::Body => t.typography.body,
            Self::BodyStrong => t.typography.body_strong,
            Self::Label => t.typography.label,
            Self::Detail => t.typography.detail,
            Self::Footnote => t.typography.footnote,
        }
    }
}

/// The color of a piece of [`text`]. A status tone is never the only signal: the words say it
/// too.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum TextTone {
    Primary,
    Secondary,
    Accent,
    Danger,
    Success,
    Warning,
    /// The color of the text around it.
    #[default]
    Inherit,
}

/// Text in one of the design system's type roles. `.variant` and `.tone` choose them, and
/// without them it takes the registered [`Defaults`](crate::Defaults), or else body text in
/// the color of the text around it. `.text_color` and the other text styles win over both.
pub fn text(content: impl Into<SharedString>) -> Text {
    Text {
        content: content.into(),
        variant: None,
        tone: None,
        style: StyleRefinement::default(),
    }
}

/// What [`text`] returns.
#[derive(IntoElement)]
pub struct Text {
    content: SharedString,
    variant: Option<TextVariant>,
    tone: Option<TextTone>,
    style: StyleRefinement,
}

impl Text {
    pub const fn variant(mut self, variant: TextVariant) -> Self {
        self.variant = Some(variant);
        self
    }

    pub const fn tone(mut self, tone: TextTone) -> Self {
        self.tone = Some(tone);
        self
    }
}

impl Styled for Text {
    fn style(&mut self) -> &mut StyleRefinement {
        &mut self.style
    }
}

impl RenderOnce for Text {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let given = defaults(cx).text;
        let variant = self.variant.or(given.variant).unwrap_or_default();
        let c = palette(cx);
        let tone = match self.tone.or(given.tone).unwrap_or_default() {
            TextTone::Primary => Some(c.text_primary),
            TextTone::Secondary => Some(c.text_secondary),
            TextTone::Accent => Some(c.text_accent),
            TextTone::Danger => Some(c.status_danger),
            TextTone::Success => Some(c.status_success),
            TextTone::Warning => Some(c.status_warning),
            TextTone::Inherit => None,
        };
        let mut text = div()
            .typography(variant.typography(theme(cx)))
            .when_some(tone, |text, tone| text.text_color(color(tone)));
        text.style().refine(&self.style);
        text.child(self.content)
    }
}

#[cfg(test)]
mod tests {
    use super::{ThumbnailRatio, count_text, media_name, watched};

    #[test]
    fn a_thumbnail_ratio_is_its_width_over_its_height() {
        assert!((ThumbnailRatio::Ratio16x9.value() - 16.0 / 9.0).abs() < 1e-6);
        assert!((ThumbnailRatio::Ratio1x1.value() - 1.0).abs() < 1e-6);
        assert!((ThumbnailRatio::Ratio4x3.value() - 4.0 / 3.0).abs() < 1e-6);
        assert!((ThumbnailRatio::Ratio9x16.value() - 9.0 / 16.0).abs() < 1e-6);
        assert_eq!(ThumbnailRatio::default(), ThumbnailRatio::Ratio16x9);
    }

    #[test]
    fn no_progress_and_zero_draw_no_bar() {
        assert_eq!(watched(None), None);
        assert_eq!(watched(Some(0.0)), None);
        assert_eq!(watched(Some(-0.5)), None);
        assert_eq!(watched(Some(0.4)), Some(0.4));
        assert_eq!(watched(Some(1.5)), Some(1.0));
    }

    #[test]
    fn a_media_card_is_named_by_its_title_then_its_details() {
        assert_eq!(media_name("Night hike", &[]), "Night hike");
        assert_eq!(
            media_name("Night hike", &["Acme Outdoors".into(), "3 days ago".into()]),
            "Night hike, Acme Outdoors, 3 days ago"
        );
    }

    #[test]
    fn a_count_over_the_maximum_shows_the_maximum_and_a_plus() {
        assert_eq!(count_text(3, 99), "3");
        assert_eq!(count_text(99, 99), "99");
        assert_eq!(count_text(120, 99), "99+");
        assert_eq!(count_text(12, 9), "9+");
    }
}
