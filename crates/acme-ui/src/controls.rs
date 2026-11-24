//! Selection controls, and the pieces a list is made of.
//!
//! The switch and the checkbox come from GPUI Component, which gives them focus and keyboard
//! handling; `set_mode` points their colors at the tokens. The rest are drawn here: the chip,
//! the tabs and the skeleton too, whose GPUI Component counterparts take their look from its
//! theme and not from the tokens of these components.

use std::rc::Rc;
use std::sync::Arc;

use acme_tokens as tokens;
use gpui_kit::base::animation::cubic_bezier;
use gpui_kit::base::slider::{SliderEvent, SliderState};
use gpui_kit::base::{
    Accordion as BaseAccordion, AccordionHeader, AccordionItem as BaseAccordionItem,
    AccordionPanel, AccordionTrigger, MotionReveal, Radio as BaseRadio,
    RadioGroup as BaseRadioGroup, Slider as BaseSlider, SliderIndicator, SliderThumb, SliderTrack,
    Transition, transition,
};
use gpui_kit::component::{
    Icon as KitIcon, Sizable as _, ThemeStyled as _, checkbox::Checkbox,
    spinner::Spinner as KitSpinner, switch::Switch,
};
use gpui_kit::prelude::FluentBuilder as _;
use gpui_kit::{
    Animation, AnimationExt as _, AnyElement, App, AppContext as _, BoxShadow, ClickEvent, Div,
    ElementId, Entity, FocusHandle, FontFeatures, Hsla, ImageSource, InteractiveElement as _,
    IntoElement, KeyDownEvent, Length, MouseButton, ObjectFit, ParentElement, Radians,
    Refineable as _, RenderOnce, Rgba, Role, SharedString, StatefulInteractiveElement as _,
    StyleRefinement, Styled, StyledImage as _, Subscription, Toggled, Window, div, img, percentage,
    point, px, relative,
};

use crate::components::{ControlSize, field_label, shadow};
use crate::defaults::defaults;
use crate::theme::{TypographyExt as _, color, palette, theme};

/// Turns a setting on or off, and takes effect at once. The result is a GPUI Component switch:
/// add `.label`, `.on_click` or `.disabled` to it.
pub fn switch(id: impl Into<ElementId>, checked: bool) -> Switch {
    Switch::new(id).checked(checked)
}

/// A choice that is applied later, with the form it belongs to. The result is a GPUI Component
/// checkbox: add `.label`, `.on_click` or `.disabled` to it.
pub fn checkbox(id: impl Into<ElementId>, checked: bool) -> Checkbox {
    Checkbox::new(id).checked(checked)
}

// ---------------------------------------------------------------- keyboard

/// Where an arrow key, Home or End moves in a set of options.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum Step {
    Next,
    Previous,
    First,
    Last,
}

/// The place `step` leads to from `current` among `len` places, going round at the ends. With
/// nothing current, `Next` starts at the first place and `Previous` at the last.
pub(crate) const fn move_index(current: Option<usize>, len: usize, step: Step) -> Option<usize> {
    if len == 0 {
        return None;
    }
    Some(match (step, current) {
        (Step::First, _) | (Step::Next, None) => 0,
        (Step::Last, _) | (Step::Previous, None) => len - 1,
        (Step::Next, Some(at)) => (at + 1) % len,
        (Step::Previous, Some(at)) => (at + len - 1) % len,
    })
}

// ---------------------------------------------------------------- radio group

/// One choice of a [`RadioGroup`]: the value it stands for, and what it shows.
pub struct RadioOption {
    value: SharedString,
    label: SharedString,
    description: Option<SharedString>,
}

impl RadioOption {
    pub fn new(value: impl Into<SharedString>, label: impl Into<SharedString>) -> Self {
        Self {
            value: value.into(),
            label: label.into(),
            description: None,
        }
    }

    /// A line under the label.
    pub fn description(mut self, description: impl Into<SharedString>) -> Self {
        self.description = Some(description.into());
        self
    }
}

/// One choice among a few, applied later with the form it belongs to, like a checkbox. For a
/// choice that takes effect at once, among two to four, a segmented control is the usual pick.
///
/// GPUI Base's unstyled radio and radio group give it its roles, its focus and Enter and Space.
/// The circle is drawn here, because GPUI Component's radio draws a check in a filled circle,
/// and the arrow keys move the choice, as they do in a native group.
#[derive(IntoElement)]
pub struct RadioGroup {
    style: StyleRefinement,
    id: ElementId,
    label: SharedString,
    options: Vec<RadioOption>,
    value: Option<SharedString>,
    disabled: bool,
    error: Option<SharedString>,
    on_change: Option<ValueHandler>,
}

impl RadioGroup {
    /// The label is the group's visible legend, and names it for assistive technology.
    pub fn new(
        id: impl Into<ElementId>,
        label: impl Into<SharedString>,
        options: impl IntoIterator<Item = RadioOption>,
    ) -> Self {
        Self {
            style: StyleRefinement::default(),
            id: id.into(),
            label: label.into(),
            options: options.into_iter().collect(),
            value: None,
            disabled: false,
            error: None,
            on_change: None,
        }
    }

    /// The value of the chosen option. Nothing is chosen unless this is set.
    pub fn value(mut self, value: impl Into<SharedString>) -> Self {
        self.value = Some(value.into());
        self
    }

    /// Disables the whole group.
    pub const fn disabled(mut self, disabled: bool) -> Self {
        self.disabled = disabled;
        self
    }

    /// Shown under the options, and announced.
    pub fn error(mut self, error: Option<impl Into<SharedString>>) -> Self {
        self.error = error.map(Into::into);
        self
    }

    /// Called with the value of the option that was chosen. The group does not choose by
    /// itself: the handler decides. Takes a reference, like the handlers of GPUI Component, so
    /// `cx.listener` fits.
    pub fn on_change(
        mut self,
        handler: impl Fn(&SharedString, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_change = Some(Rc::new(handler));
        self
    }
}

impl RadioGroup {
    fn draw(self, window: &mut Window, cx: &mut App) -> impl IntoElement + Styled {
        let t = theme(cx);
        let c = palette(cx);
        let disabled = self.disabled;
        let count = self.options.len();
        let chosen = self.value.as_ref().and_then(|value| {
            self.options
                .iter()
                .position(|option| &option.value == value)
        });
        let handles: Rc<Vec<FocusHandle>> = Rc::new(
            (0..count)
                .map(|index| focus_handle(&(self.id.clone(), index.to_string()).into(), window, cx))
                .collect(),
        );
        let values: Rc<Vec<SharedString>> = Rc::new(
            self.options
                .iter()
                .map(|option| option.value.clone())
                .collect(),
        );
        // Tab reaches the group once, at its choice, and the arrow keys move inside it.
        let stop = chosen.unwrap_or(0);
        let side = px(t.pointer.radio);
        // The circle sits on the middle of the label's first line.
        let line = px(t.typography.body.line_height_px());
        let (label_color, description_color) = if disabled {
            (c.text_disabled, c.text_disabled)
        } else {
            (c.text_primary, c.text_secondary)
        };

        let radios = self
            .options
            .into_iter()
            .enumerate()
            .map(|(index, option)| {
                let checked = chosen == Some(index);
                let focused = !disabled && handles[index].is_focused(window);
                let (border_width, border, dot) = if disabled {
                    // Filled, without an outline, as a disabled checkbox is.
                    (0.0, gpui_kit::transparent_black(), c.radio_disabled_dot)
                } else if checked {
                    (
                        t.border.width_thick,
                        color(c.radio_border_checked),
                        c.radio_dot,
                    )
                } else {
                    (t.border.width_thin, color(c.radio_border), c.radio_dot)
                };
                let circle = div()
                    .flex()
                    .flex_none()
                    .items_center()
                    .justify_center()
                    .size(side)
                    .mt((line - side) / 2.0)
                    .rounded_full()
                    .border(px(border_width))
                    .border_color(border)
                    .when(disabled, |circle| {
                        circle.bg(color(c.radio_disabled_background))
                    })
                    // The dot is the mark of the choice, so it does not rest on color alone.
                    .when(checked, |circle| {
                        circle.child(div().size(side / 2.0).rounded_full().bg(color(dot)))
                    })
                    .when(focused, |circle| circle.focus_ring_style(window, cx));
                let on_change = self.on_change.clone();
                let value = option.value.clone();
                BaseRadio::new((self.id.clone(), index.to_string()))
                    .checked(checked)
                    .disabled(disabled)
                    .track_focus(&handles[index])
                    .tab_stop(index == stop)
                    .set_position(index + 1, count)
                    .accessibility_label(option.label.clone())
                    .when_some(option.description.clone(), |radio, description| {
                        radio.aria_description(description)
                    })
                    .when_some(on_change, |radio, on_change| {
                        radio.on_change(move |_, _, window, cx| on_change(&value, window, cx))
                    })
                    // A click does not move the focus here, as on a checkbox, so the ring
                    // shows only when the keyboard got there.
                    .on_mouse_down(MouseButton::Left, |_, window, _| window.prevent_default())
                    .flex()
                    .items_start()
                    .gap(px(t.space.s2))
                    .min_h(px(t.pointer.target_min))
                    .child(circle)
                    .child(
                        div()
                            .flex()
                            .flex_col()
                            .child(
                                div()
                                    .typography(t.typography.body)
                                    .text_color(color(label_color))
                                    .child(option.label),
                            )
                            .children(option.description.map(|description| {
                                div()
                                    .typography(t.typography.detail)
                                    .text_color(color(description_color))
                                    .child(description)
                            })),
                    )
            })
            .collect::<Vec<_>>();

        let on_change = self.on_change;
        let group = BaseRadioGroup::new(self.id.clone())
            .aria_label(self.label.clone())
            .flex()
            .flex_col()
            .items_start()
            .gap(px(t.space.s2))
            .children(radios)
            .when(!disabled, |group| {
                group.on_key_down(move |event: &KeyDownEvent, window, cx| {
                    if event.keystroke.modifiers.modified() {
                        return;
                    }
                    let step = match event.keystroke.key.as_str() {
                        "up" | "left" => Step::Previous,
                        "down" | "right" => Step::Next,
                        _ => return,
                    };
                    let current = handles.iter().position(|handle| handle.is_focused(window));
                    let Some(next) = move_index(current, handles.len(), step) else {
                        return;
                    };
                    cx.stop_propagation();
                    handles[next].focus(window, cx);
                    if let Some(on_change) = &on_change {
                        on_change(&values[next], window, cx);
                    }
                })
            });
        let error = self.error.map(|error| {
            div()
                .id((self.id.clone(), "error"))
                // Read out when it appears.
                .role(Role::Alert)
                .aria_label(error.clone())
                .typography(t.typography.detail)
                .text_color(color(c.status_danger))
                .child(error)
        });
        div()
            .flex()
            .flex_col()
            .gap(px(t.space.s1))
            .child(
                // In a field's label role; disabled, it fades with the options it names.
                div()
                    .typography(t.typography.label)
                    .text_color(color(if disabled {
                        c.text_disabled
                    } else {
                        c.text_primary
                    }))
                    .child(self.label),
            )
            .child(group)
            .children(error)
    }
}

impl Styled for RadioGroup {
    fn style(&mut self) -> &mut StyleRefinement {
        &mut self.style
    }
}

impl RenderOnce for RadioGroup {
    fn render(mut self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let style = std::mem::take(&mut self.style);
        let mut root = self.draw(window, cx);
        root.style().refine(&style);
        root
    }
}

// ---------------------------------------------------------------- segmented control

type SelectHandler = Rc<dyn Fn(&usize, &mut Window, &mut App)>;

/// A choice between a few views or modes, all visible at once. The selected segment is outlined
/// as well as filled, so the choice does not depend on telling two greys apart.
#[derive(IntoElement)]
pub struct SegmentedControl {
    style: StyleRefinement,
    id: ElementId,
    labels: Vec<SharedString>,
    selected: usize,
    on_change: Option<SelectHandler>,
}

impl SegmentedControl {
    pub fn new(
        id: impl Into<ElementId>,
        labels: impl IntoIterator<Item = impl Into<SharedString>>,
    ) -> Self {
        Self {
            style: StyleRefinement::default(),
            id: id.into(),
            labels: labels.into_iter().map(Into::into).collect(),
            selected: 0,
            on_change: None,
        }
    }

    /// The index of the selected segment.
    pub const fn selected(mut self, index: usize) -> Self {
        self.selected = index;
        self
    }

    /// Called with the index of the segment that was clicked. Takes a reference, like the
    /// handlers of GPUI Component, so `cx.listener` fits.
    pub fn on_change(mut self, handler: impl Fn(&usize, &mut Window, &mut App) + 'static) -> Self {
        self.on_change = Some(Rc::new(handler));
        self
    }
}

impl SegmentedControl {
    fn draw(self, _window: &mut Window, cx: &mut App) -> impl IntoElement + Styled {
        const INSET: f32 = 2.0;
        let t = theme(cx);
        let c = palette(cx);
        let segments = self.labels.into_iter().enumerate().map(|(index, label)| {
            let selected = index == self.selected;
            let on_change = self.on_change.clone();
            div()
                .id((self.id.clone(), index.to_string()))
                .flex()
                .items_center()
                .justify_center()
                .h_full()
                .px(px(t.space.s4))
                .rounded(px(t.radius.md - INSET))
                // Present on every segment, and transparent until selected, so selecting does
                // not move the text.
                .border(px(t.border.width_thin))
                .border_color(gpui_kit::transparent_black())
                .typography(t.typography.label)
                .text_color(color(c.segmented_text))
                .when(selected, |segment| {
                    segment
                        .bg(color(c.segmented_selected_background))
                        .border_color(color(c.segmented_selected_border))
                        // Raised: a faint shadow under the hairline sets it apart from the track.
                        .shadow(shadow(t.shadow.subtle))
                        .text_color(color(c.segmented_selected_text))
                })
                .when_some(on_change, |segment, on_change| {
                    segment
                        .on_click(move |_: &ClickEvent, window, cx| on_change(&index, window, cx))
                })
                .child(label)
        });
        div()
            .flex()
            .flex_none()
            .h(ControlSize::Md.height(t))
            .p(px(INSET))
            .rounded(px(t.radius.md))
            .bg(color(c.segmented_track))
            .children(segments)
    }
}

impl Styled for SegmentedControl {
    fn style(&mut self) -> &mut StyleRefinement {
        &mut self.style
    }
}

impl RenderOnce for SegmentedControl {
    fn render(mut self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let style = std::mem::take(&mut self.style);
        let mut root = self.draw(window, cx);
        root.style().refine(&style);
        root
    }
}

// ---------------------------------------------------------------- chip

/// The focus handle of a control that is drawn here rather than by GPUI Component, kept from
/// frame to frame under the control's id.
pub(crate) fn focus_handle(id: &ElementId, window: &mut Window, cx: &mut App) -> FocusHandle {
    window
        .use_keyed_state(id.clone(), cx, |_, cx| cx.focus_handle())
        .read(cx)
        .clone()
}

/// A choice that filters what is shown. Unlike a badge it is pressed. A selected chip gains a
/// check mark and an outline, so the state does not depend on color.
#[derive(IntoElement)]
pub struct Chip {
    style: StyleRefinement,
    id: ElementId,
    label: SharedString,
    selected: bool,
    icon_start: Option<tokens::Icon>,
    disabled: bool,
    on_click: Option<ClickHandler>,
}

impl Chip {
    pub fn new(id: impl Into<ElementId>, label: impl Into<SharedString>) -> Self {
        Self {
            style: StyleRefinement::default(),
            id: id.into(),
            label: label.into(),
            selected: false,
            icon_start: None,
            disabled: false,
            on_click: None,
        }
    }

    pub const fn selected(mut self, selected: bool) -> Self {
        self.selected = selected;
        self
    }

    /// An icon in front of the label. The check mark takes its place while the chip is
    /// selected.
    pub const fn icon_start(mut self, icon: tokens::Icon) -> Self {
        self.icon_start = Some(icon);
        self
    }

    pub const fn disabled(mut self, disabled: bool) -> Self {
        self.disabled = disabled;
        self
    }

    /// The chip does not select itself: the handler decides.
    pub fn on_click(
        mut self,
        handler: impl Fn(&ClickEvent, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_click = Some(Rc::new(handler));
        self
    }
}

impl Chip {
    fn draw(self, window: &mut Window, cx: &mut App) -> impl IntoElement + Styled {
        let t = theme(cx);
        let c = palette(cx);
        let leading = if self.selected {
            Some(tokens::Icon::Check)
        } else {
            self.icon_start
        };
        let focus = focus_handle(&self.id, window, cx);
        let focused = !self.disabled && focus.is_focused(window);
        let (background, hover, pressed, text) = if self.disabled {
            (
                c.chip_disabled_background,
                c.chip_disabled_background,
                c.chip_disabled_background,
                c.chip_disabled_text,
            )
        } else if self.selected {
            (
                c.chip_selected_background,
                c.chip_selected_background_hover,
                c.chip_selected_background_pressed,
                c.chip_selected_text,
            )
        } else {
            (
                c.chip_background,
                c.chip_background_hover,
                c.chip_background_pressed,
                c.chip_text,
            )
        };
        div()
            .id(self.id)
            .role(Role::Button)
            .aria_label(self.label.clone())
            .aria_toggled(if self.selected {
                Toggled::True
            } else {
                Toggled::False
            })
            .flex()
            .flex_none()
            .items_center()
            .gap(px(t.space.s1_5))
            .h(px(t.pointer.chip))
            .px(px(t.space.s3))
            .rounded_full()
            // Present on every chip, and transparent until selected, so selecting does not
            // change the size.
            .border(px(t.border.width_thin))
            .border_color(if self.selected && !self.disabled {
                color(c.chip_selected_border)
            } else {
                gpui_kit::transparent_black()
            })
            .bg(color(background))
            .text_color(color(text))
            .typography(t.typography.label)
            .whitespace_nowrap()
            .children(leading.map(|name| icon(name).icon_size(IconSize::Sm)))
            .child(self.label)
            .when(!self.disabled, |chip| {
                chip.track_focus(&focus.tab_index(0).tab_stop(true))
                    .hover(|chip| chip.bg(color(hover)))
                    .active(|chip| chip.bg(color(pressed)))
                    // A click does not move the focus here, as on a button, so the ring shows
                    // only when the keyboard got there.
                    .on_mouse_down(MouseButton::Left, |_, window, _| window.prevent_default())
                    .when_some(self.on_click, |chip, on_click| {
                        chip.on_click(move |event, window, cx| on_click(event, window, cx))
                    })
            })
            .when(focused, |chip| chip.focus_ring_style(window, cx))
    }
}

impl Styled for Chip {
    fn style(&mut self) -> &mut StyleRefinement {
        &mut self.style
    }
}

impl RenderOnce for Chip {
    fn render(mut self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let style = std::mem::take(&mut self.style);
        let mut root = self.draw(window, cx);
        root.style().refine(&style);
        root
    }
}

/// A row of chips. It scrolls sideways when the chips do not fit, and never wraps. Which chips
/// are selected is the app's business: the bar holds no state. Add the chips as children.
#[derive(IntoElement)]
pub struct ChipBar {
    style: StyleRefinement,
    id: ElementId,
    label: SharedString,
    children: Vec<AnyElement>,
}

impl ChipBar {
    /// The label names the group for assistive technology.
    pub fn new(id: impl Into<ElementId>, label: impl Into<SharedString>) -> Self {
        Self {
            style: StyleRefinement::default(),
            id: id.into(),
            label: label.into(),
            children: Vec::new(),
        }
    }
}

impl ParentElement for ChipBar {
    fn extend(&mut self, elements: impl IntoIterator<Item = AnyElement>) {
        self.children.extend(elements);
    }
}

impl ChipBar {
    fn draw(self, _window: &mut Window, cx: &mut App) -> impl IntoElement + Styled {
        let t = theme(cx);
        // A scrolling row clips what it holds, and the focus ring of a chip lies outside the
        // chip. The row is this much larger on every side, and pulled back by as much, so the
        // ring has room and the chips stay where they were.
        let room = px(t.space.s1);
        div()
            .id(self.id)
            .role(Role::Group)
            .aria_label(self.label)
            .flex()
            .items_center()
            .gap(px(t.space.s2))
            .p(room)
            .m(-room)
            .overflow_x_scroll()
            .children(self.children)
    }
}

impl Styled for ChipBar {
    fn style(&mut self) -> &mut StyleRefinement {
        &mut self.style
    }
}

impl RenderOnce for ChipBar {
    fn render(mut self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let style = std::mem::take(&mut self.style);
        let mut root = self.draw(window, cx);
        root.style().refine(&style);
        root
    }
}

// ---------------------------------------------------------------- tabs

pub(crate) type ValueHandler = Rc<dyn Fn(&SharedString, &mut Window, &mut App)>;

/// One tab of [`Tabs`]: the value it stands for, and what it shows.
pub struct TabItem {
    value: SharedString,
    label: SharedString,
    icon: Option<tokens::Icon>,
}

impl TabItem {
    pub fn new(value: impl Into<SharedString>, label: impl Into<SharedString>) -> Self {
        Self {
            value: value.into(),
            label: label.into(),
            icon: None,
        }
    }

    /// An icon in front of the label.
    pub const fn icon(mut self, icon: tokens::Icon) -> Self {
        self.icon = Some(icon);
        self
    }
}

/// Switches between views inside one window. For two to four short modes a segmented control
/// is lighter; tabs are for more items, longer labels, or a row that may have to scroll. This
/// is only the row: the app shows the view that matches the value.
#[derive(IntoElement)]
pub struct Tabs {
    style: StyleRefinement,
    id: ElementId,
    label: SharedString,
    items: Vec<TabItem>,
    value: SharedString,
    full_width: bool,
    on_change: Option<ValueHandler>,
}

impl Tabs {
    /// The label names the row for assistive technology.
    pub fn new(
        id: impl Into<ElementId>,
        label: impl Into<SharedString>,
        items: impl IntoIterator<Item = TabItem>,
    ) -> Self {
        Self {
            style: StyleRefinement::default(),
            id: id.into(),
            label: label.into(),
            items: items.into_iter().collect(),
            value: SharedString::default(),
            full_width: false,
            on_change: None,
        }
    }

    /// The value of the selected tab.
    pub fn value(mut self, value: impl Into<SharedString>) -> Self {
        self.value = value.into();
        self
    }

    /// The tabs share the width of the row equally.
    pub const fn full_width(mut self, full_width: bool) -> Self {
        self.full_width = full_width;
        self
    }

    /// Called with the value of the tab that was clicked. Takes a reference, like the handlers
    /// of GPUI Component, so `cx.listener` fits.
    pub fn on_change(
        mut self,
        handler: impl Fn(&SharedString, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_change = Some(Rc::new(handler));
        self
    }
}

impl Tabs {
    fn draw(self, window: &mut Window, cx: &mut App) -> impl IntoElement + Styled {
        let t = theme(cx);
        let c = palette(cx);
        let tabs = self
            .items
            .into_iter()
            .enumerate()
            .map(|(index, item)| {
                let selected = item.value == self.value;
                let id: ElementId = (self.id.clone(), index.to_string()).into();
                let focus = focus_handle(&id, window, cx);
                let focused = focus.is_focused(window);
                let on_change = self.on_change.clone();
                let value = item.value;
                div()
                    .id(id)
                    .role(Role::Tab)
                    .aria_label(item.label.clone())
                    .aria_selected(selected)
                    .track_focus(&focus.tab_index(0).tab_stop(true))
                    .relative()
                    .flex()
                    .items_center()
                    .justify_center()
                    .gap(px(t.space.s2))
                    .h(px(t.pointer.tab))
                    .px(px(t.space.s4))
                    .typography(t.typography.label)
                    .whitespace_nowrap()
                    .map(|tab| {
                        if self.full_width {
                            tab.flex_1()
                        } else {
                            tab.flex_none()
                        }
                    })
                    .map(|tab| {
                        if selected {
                            tab.text_color(color(c.tabs_text_selected))
                        } else {
                            tab.text_color(color(c.tabs_text))
                                .hover(|tab| tab.text_color(color(c.tabs_text_hover)))
                        }
                    })
                    // A click does not move the focus here, as on a button, so the ring shows
                    // only when the keyboard got there.
                    .on_mouse_down(MouseButton::Left, |_, window, _| window.prevent_default())
                    .when_some(on_change, |tab, on_change| {
                        tab.on_click(move |_, window, cx| on_change(&value, window, cx))
                    })
                    .children(item.icon.map(|name| icon(name).icon_size(IconSize::Sm)))
                    .child(item.label)
                    .when(selected, |tab| {
                        // A bar as well as a color, so the choice shows in the form.
                        tab.child(
                            div()
                                .absolute()
                                .left_0()
                                .right_0()
                                .bottom_0()
                                .h(px(t.border.width_thick))
                                .bg(color(c.tabs_indicator)),
                        )
                    })
                    .when(focused, |tab| tab.focus_ring_style(window, cx))
            })
            .collect::<Vec<_>>();
        // As in a chip bar: the scrolling row would clip the focus ring of a tab, so it is
        // this much larger on every side and pulled back by as much.
        let room = px(t.space.s1);
        div()
            .relative()
            .w_full()
            .child(
                // Under the row, and drawn before it, so the bar of the selected tab lies
                // over the hairline.
                div()
                    .absolute()
                    .left_0()
                    .right_0()
                    .bottom_0()
                    .h(px(t.border.width_thin))
                    .bg(color(c.tabs_border)),
            )
            .child(
                div()
                    .id(self.id)
                    .role(Role::TabList)
                    .aria_label(self.label)
                    .flex()
                    .p(room)
                    .m(-room)
                    .overflow_x_scroll()
                    .children(tabs),
            )
    }
}

impl Styled for Tabs {
    fn style(&mut self) -> &mut StyleRefinement {
        &mut self.style
    }
}

impl RenderOnce for Tabs {
    fn render(mut self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let style = std::mem::take(&mut self.style);
        let mut root = self.draw(window, cx);
        root.style().refine(&style);
        root
    }
}

// ---------------------------------------------------------------- skeleton

/// `Text` is one line of body text, `Rect` a block such as a picture, `Circle` an avatar.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum SkeletonShape {
    #[default]
    Text,
    Rect,
    Circle,
}

/// Holds the place of content that is loading. It has no role and no name, so assistive
/// technology passes over it: the view that shows skeletons says that it is loading.
#[derive(IntoElement)]
pub struct Skeleton {
    style: StyleRefinement,
    id: ElementId,
    shape: Option<SkeletonShape>,
    width: Option<Length>,
    height: Option<Length>,
}

impl Skeleton {
    /// GPUI keeps the time of an animation under an id, so the skeleton takes one.
    pub fn new(id: impl Into<ElementId>) -> Self {
        Self {
            style: StyleRefinement::default(),
            id: id.into(),
            shape: None,
            width: None,
            height: None,
        }
    }

    pub const fn shape(mut self, shape: SkeletonShape) -> Self {
        self.shape = Some(shape);
        self
    }

    /// A line and a rectangle are as wide as their parent unless this is set.
    pub fn width(mut self, width: impl Into<Length>) -> Self {
        self.width = Some(width.into());
        self
    }

    /// A rectangle needs a height. A circle is as wide as it is tall.
    pub fn height(mut self, height: impl Into<Length>) -> Self {
        self.height = Some(height.into());
        self
    }
}

/// The color `amount` of the way from one token to another.
fn mix(from: tokens::Color, to: tokens::Color, amount: f32) -> Hsla {
    let channel = |from: u8, to: u8| f32::from(from) + (f32::from(to) - f32::from(from)) * amount;
    Rgba {
        r: channel(from.r, to.r) / 255.0,
        g: channel(from.g, to.g) / 255.0,
        b: channel(from.b, to.b) / 255.0,
        a: from.a + (to.a - from.a) * amount,
    }
    .into()
}

/// How far a pulse is from its resting color, `phase` of the way through one beat: there and
/// back, slowing at both ends.
fn pulse(phase: f32) -> f32 {
    (1.0 - (phase * std::f32::consts::TAU).cos()) / 2.0
}

impl Skeleton {
    /// What the component draws. The app's style goes on the block before the pulse wraps it,
    /// since an animated element takes no style.
    fn draw(self, _window: &mut Window, cx: &mut App) -> AnyElement {
        let t = theme(cx);
        let c = palette(cx);
        let block = div().flex_none().bg(color(c.skeleton_background));
        let block = match self
            .shape
            .or_else(|| defaults(cx).skeleton.shape)
            .unwrap_or_default()
        {
            SkeletonShape::Text => block
                .h(self
                    .height
                    .unwrap_or_else(|| px(t.typography.body.size).into()))
                .w(self.width.unwrap_or_else(|| relative(1.0).into()))
                .rounded(px(t.radius.sm)),
            SkeletonShape::Rect => block
                .when_some(self.height, |block, height| block.h(height))
                .w(self.width.unwrap_or_else(|| relative(1.0).into()))
                .rounded(px(t.radius.md)),
            SkeletonShape::Circle => {
                let diameter = self
                    .height
                    .or(self.width)
                    .unwrap_or_else(|| px(t.pointer.avatar_md).into());
                block.size(diameter).rounded_full()
            }
        };
        let mut block = block;
        block.style().refine(&self.style);
        // GPUI holds a repeating animation still under reduced motion; asking here as well
        // keeps the skeleton from registering one at all.
        if cx.reduce_motion() {
            return block.into_any_element();
        }
        let (rest, highlight) = (c.skeleton_background, c.skeleton_highlight);
        block
            .with_animation(
                self.id,
                Animation::new(t.motion.duration_pulse).repeat(),
                move |block, phase| block.bg(mix(rest, highlight, pulse(phase))),
            )
            .into_any_element()
    }
}

impl Styled for Skeleton {
    fn style(&mut self) -> &mut StyleRefinement {
        &mut self.style
    }
}

impl RenderOnce for Skeleton {
    fn render(self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        self.draw(window, cx)
    }
}

// ---------------------------------------------------------------- avatar

/// `Xl` is for a profile header.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum AvatarSize {
    Sm,
    #[default]
    Md,
    Lg,
    Xl,
}

impl AvatarSize {
    const fn diameter(self, t: &tokens::Theme) -> f32 {
        match self {
            Self::Sm => t.pointer.avatar_sm,
            Self::Md => t.pointer.avatar_md,
            Self::Lg => t.pointer.avatar_lg,
            Self::Xl => t.pointer.avatar_xl,
        }
    }

    /// The type role of the initials.
    const fn typography(self, t: &tokens::Theme) -> tokens::Typography {
        match self {
            Self::Sm => t.typography.footnote,
            Self::Md => t.typography.label,
            Self::Lg => t.typography.body_strong,
            Self::Xl => t.typography.title,
        }
    }

    /// The small size has room for one letter.
    const fn letters(self) -> usize {
        match self {
            Self::Sm => 1,
            _ => 2,
        }
    }
}

/// The first letter of the first `count` words: "Ada Lovelace" gives "AL".
pub fn initials(name: &str, count: usize) -> String {
    name.split_whitespace()
        .take(count)
        .filter_map(|word| word.chars().next())
        .flat_map(char::to_uppercase)
        .collect()
}

/// The circle an avatar and the count at the end of a stack share. In a stack each has a ring
/// in the color of the surface, which reads as a gap between it and the one it overlaps.
fn avatar_circle(size: AvatarSize, ring: bool, t: &tokens::Theme, c: &tokens::Colors) -> Div {
    div()
        .relative()
        .flex()
        .flex_none()
        .items_center()
        .justify_center()
        .size(px(size.diameter(t)))
        .rounded_full()
        .typography(size.typography(t))
        .when(ring, |circle| {
            // A shadow that only spreads: a ring outside the circle that takes no room.
            circle.shadow(vec![BoxShadow {
                color: color(c.avatar_ring),
                offset: point(px(0.0), px(0.0)),
                blur_radius: px(0.0),
                spread_radius: px(t.border.width_thick),
                inset: false,
            }])
        })
}

/// Stands for a person or a team by a picture, or by their initials when there is none. The
/// small size has room for one letter.
#[derive(IntoElement)]
pub struct Avatar {
    style: StyleRefinement,
    name: SharedString,
    size: Option<AvatarSize>,
    src: Option<ImageSource>,
    ring: bool,
}

impl Avatar {
    pub fn new(name: impl Into<SharedString>) -> Self {
        Self {
            style: StyleRefinement::default(),
            name: name.into(),
            size: None,
            src: None,
            ring: false,
        }
    }

    /// Named apart from `Styled::size`, which sets a width and a height.
    pub const fn avatar_size(mut self, size: AvatarSize) -> Self {
        self.size = Some(size);
        self
    }

    /// A picture of the person: a URL, a file path or an image in memory. It fills the circle,
    /// cropped to cover. The initials show while it loads and when it fails.
    ///
    /// GPUI fetches a URL with the HTTP client the app gives it
    /// (`Application::with_http_client`). It has none of its own, so until the app sets one a
    /// URL does not load and the initials stay.
    pub fn src(mut self, src: impl Into<ImageSource>) -> Self {
        self.src = Some(src.into());
        self
    }
}

impl Avatar {
    fn draw(self, _window: &mut Window, cx: &mut App) -> impl IntoElement + Styled {
        let t = theme(cx);
        let c = palette(cx);
        let size = self
            .size
            .or_else(|| defaults(cx).avatar.size)
            .unwrap_or_default();
        avatar_circle(size, self.ring, t, c)
            .bg(color(c.avatar_background))
            .text_color(color(c.avatar_text))
            .child(initials(&self.name, size.letters()))
            // Over the initials, and drawn only once it has loaded, so the initials are what
            // shows until then and when it fails.
            .children(self.src.map(|src| {
                img(src)
                    .absolute()
                    .inset_0()
                    .size_full()
                    .rounded_full()
                    .object_fit(ObjectFit::Cover)
            }))
    }
}

impl Styled for Avatar {
    fn style(&mut self) -> &mut StyleRefinement {
        &mut self.style
    }
}

impl RenderOnce for Avatar {
    fn render(mut self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let style = std::mem::take(&mut self.style);
        let mut root = self.draw(window, cx);
        root.style().refine(&style);
        root
    }
}

/// One of the people in an [`AvatarStack`]. A name alone converts into one.
pub struct Person {
    name: SharedString,
    src: Option<ImageSource>,
}

impl Person {
    pub fn new(name: impl Into<SharedString>) -> Self {
        Self {
            name: name.into(),
            src: None,
        }
    }

    /// A picture of the person, as for [`Avatar::src`].
    pub fn src(mut self, src: impl Into<ImageSource>) -> Self {
        self.src = Some(src.into());
        self
    }
}

impl From<&'static str> for Person {
    fn from(name: &'static str) -> Self {
        Self::new(name)
    }
}

impl From<String> for Person {
    fn from(name: String) -> Self {
        Self::new(name)
    }
}

impl From<SharedString> for Person {
    fn from(name: SharedString) -> Self {
        Self::new(name)
    }
}

/// Several people in the room of one: overlapping avatars, and a count of those that did not
/// fit.
#[derive(IntoElement)]
pub struct AvatarStack {
    style: StyleRefinement,
    id: ElementId,
    people: Vec<Person>,
    max: usize,
    size: Option<AvatarSize>,
    label: Option<SharedString>,
}

impl AvatarStack {
    /// GPUI reports an element to assistive technology only when it has an id, so the stack
    /// takes one.
    pub fn new(
        id: impl Into<ElementId>,
        people: impl IntoIterator<Item = impl Into<Person>>,
    ) -> Self {
        Self {
            style: StyleRefinement::default(),
            id: id.into(),
            people: people.into_iter().map(Into::into).collect(),
            max: 4,
            size: None,
            label: None,
        }
    }

    /// How many avatars to draw before counting the rest. Four unless set.
    pub const fn max(mut self, max: usize) -> Self {
        self.max = max;
        self
    }

    /// Named apart from `Styled::size`, which sets a width and a height.
    pub const fn avatar_size(mut self, size: AvatarSize) -> Self {
        self.size = Some(size);
        self
    }

    /// Names the stack for assistive technology in place of the list of names.
    pub fn label(mut self, label: impl Into<SharedString>) -> Self {
        self.label = Some(label.into());
        self
    }
}

/// How many people a stack counts instead of drawing.
const fn overflow(people: usize, max: usize) -> usize {
    people.saturating_sub(max)
}

impl AvatarStack {
    fn draw(self, _window: &mut Window, cx: &mut App) -> impl IntoElement + Styled {
        let t = theme(cx);
        let c = palette(cx);
        let label = self.label.unwrap_or_else(|| {
            let names: Vec<&str> = self
                .people
                .iter()
                .map(|person| person.name.as_ref())
                .collect();
            names.join(", ").into()
        });
        let hidden = overflow(self.people.len(), self.max);
        // Each one covers a quarter of the one before it.
        let size = self
            .size
            .or_else(|| defaults(cx).avatar_stack.size)
            .unwrap_or_default();
        let overlap = px(-size.diameter(t) / 4.0);
        let avatars = self
            .people
            .into_iter()
            .take(self.max)
            .map(|person| {
                // A part of the stack, so the app's defaults for an avatar do not reach it.
                Avatar {
                    style: StyleRefinement::default(),
                    name: person.name,
                    size: Some(size),
                    src: person.src,
                    ring: true,
                }
                .into_any_element()
            })
            .chain((hidden > 0).then(|| {
                avatar_circle(size, true, t, c)
                    .bg(color(c.avatar_overflow_background))
                    .text_color(color(c.avatar_overflow_text))
                    .child(format!("+{hidden}"))
                    .into_any_element()
            }))
            .enumerate()
            .map(|(index, circle)| {
                div()
                    .flex_none()
                    .when(index > 0, |place| place.ml(overlap))
                    .child(circle)
            });
        // One image to assistive technology: the avatars inside have no id, so GPUI does not
        // report them.
        div()
            .id(self.id)
            .role(Role::Image)
            .aria_label(label)
            .flex()
            .flex_none()
            .items_center()
            .children(avatars)
    }
}

impl Styled for AvatarStack {
    fn style(&mut self) -> &mut StyleRefinement {
        &mut self.style
    }
}

impl RenderOnce for AvatarStack {
    fn render(mut self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let style = std::mem::take(&mut self.style);
        let mut root = self.draw(window, cx);
        root.style().refine(&style);
        root
    }
}

// ---------------------------------------------------------------- spinner

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum SpinnerSize {
    Sm,
    #[default]
    Md,
    Lg,
}

/// Work of unknown length is going on, drawn by GPUI Component's spinner, which stands still
/// when the system asks for reduced motion, and whose drawing comes from the assets the app
/// registers (`gpui_kit::assets::Assets`). It takes the color of the text around it; set another
/// with `.color`. Its size is `.spinner_size`, or else the registered
/// [`Defaults`](crate::Defaults), or else the middle one.
pub fn spinner() -> Spinner {
    Spinner {
        style: StyleRefinement::default(),
        size: None,
        color: None,
    }
}

/// What [`spinner`] returns.
#[derive(IntoElement)]
pub struct Spinner {
    style: StyleRefinement,
    size: Option<SpinnerSize>,
    color: Option<Hsla>,
}

impl Spinner {
    /// Named apart from `Styled::size`, which sets a width and a height.
    pub const fn spinner_size(mut self, size: SpinnerSize) -> Self {
        self.size = Some(size);
        self
    }

    pub fn color(mut self, color: impl Into<Hsla>) -> Self {
        self.color = Some(color.into());
        self
    }
}

impl Spinner {
    fn draw(self, _window: &mut Window, cx: &mut App) -> impl IntoElement + Styled {
        let t = theme(cx);
        let size = self
            .size
            .or_else(|| defaults(cx).spinner.size)
            .unwrap_or_default();
        // GPUI Component's spinner takes no style, so the app's goes on a box around it.
        div().flex_none().child(
            KitSpinner::new()
                .with_size(px(match size {
                    SpinnerSize::Sm => t.pointer.spinner_sm,
                    SpinnerSize::Md => t.pointer.spinner_md,
                    SpinnerSize::Lg => t.pointer.spinner_lg,
                }))
                .when_some(self.color, |spinner, color| spinner.color(color)),
        )
    }
}

impl Styled for Spinner {
    fn style(&mut self) -> &mut StyleRefinement {
        &mut self.style
    }
}

impl RenderOnce for Spinner {
    fn render(mut self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let style = std::mem::take(&mut self.style);
        let mut root = self.draw(window, cx);
        root.style().refine(&style);
        root
    }
}

// ---------------------------------------------------------------- progress bar

/// How far along something is, from 0 to 1. For work of unknown length use a spinner.
#[derive(IntoElement)]
pub struct ProgressBar {
    style: StyleRefinement,
    value: f32,
}

impl ProgressBar {
    pub fn new(value: f32) -> Self {
        Self {
            style: StyleRefinement::default(),
            value,
        }
    }
}

impl ProgressBar {
    fn draw(self, _window: &mut Window, cx: &mut App) -> impl IntoElement + Styled {
        let t = theme(cx);
        let c = palette(cx);
        div()
            .flex_none()
            .w_full()
            .h(px(t.pointer.progress))
            .rounded_full()
            .overflow_hidden()
            .bg(color(c.progress_track))
            .child(
                div()
                    .h_full()
                    .w(relative(self.value.clamp(0.0, 1.0)))
                    .rounded_full()
                    .bg(color(c.progress_fill)),
            )
    }
}

impl Styled for ProgressBar {
    fn style(&mut self) -> &mut StyleRefinement {
        &mut self.style
    }
}

impl RenderOnce for ProgressBar {
    fn render(mut self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let style = std::mem::take(&mut self.style);
        let mut root = self.draw(window, cx);
        root.style().refine(&style);
        root
    }
}

// ---------------------------------------------------------------- slider

type NumberHandler = Rc<dyn Fn(&f32, &mut Window, &mut App)>;

/// `value` on the nearest step counted from `min`, inside the range. A step that is not a
/// positive number leaves the value where it is.
fn snap(value: f32, min: f32, max: f32, step: f32) -> f32 {
    let value = if step > 0.0 && step.is_finite() {
        min + ((value - min) / step).round() * step
    } else {
        value
    };
    value.min(max).max(min)
}

/// How far one press of an arrow key moves: one step, or a hundredth of the range for a
/// slider without steps.
fn key_step(min: f32, max: f32, step: f32) -> f32 {
    if step > 0.0 && step.is_finite() {
        step
    } else {
        (max - min) / 100.0
    }
}

/// How many decimals a value needs to show a step: none for whole steps, one for tenths.
fn decimals(step: f32) -> usize {
    let mut scaled = step.abs();
    let mut decimals = 0;
    while decimals < 4 && (scaled - scaled.round()).abs() > 1e-3 {
        scaled *= 10.0;
        decimals += 1;
    }
    decimals
}

/// What a slider keeps from frame to frame: GPUI Base's state, which its track and thumb
/// move, and the latest handler, which hears of the moves.
struct SliderWatch {
    state: Entity<SliderState>,
    handler: Option<NumberHandler>,
    _subscription: Subscription,
}

/// Picks a number in a range by dragging, by pressing the track, or with the arrow keys, Home
/// and End.
///
/// GPUI Base's unstyled slider pieces give it the dragging, the pressing and its role and
/// value for assistive technology; the track and the thumb are drawn here, because GPUI
/// Component's slider tints them from one color. GPUI has no arrow keys for a slider, so they
/// are handled here.
#[derive(IntoElement)]
pub struct Slider {
    style: StyleRefinement,
    id: ElementId,
    label: SharedString,
    value: f32,
    min: f32,
    max: f32,
    step: f32,
    disabled: bool,
    show_value: bool,
    on_change: Option<NumberHandler>,
}

impl Slider {
    /// The label is drawn above the slider and names it for assistive technology. The range
    /// is 0 to 100 in steps of 1 unless set.
    pub fn new(id: impl Into<ElementId>, label: impl Into<SharedString>, value: f32) -> Self {
        Self {
            style: StyleRefinement::default(),
            id: id.into(),
            label: label.into(),
            value,
            min: 0.0,
            max: 100.0,
            step: 1.0,
            disabled: false,
            show_value: false,
            on_change: None,
        }
    }

    pub const fn min(mut self, min: f32) -> Self {
        self.min = min;
        self
    }

    pub const fn max(mut self, max: f32) -> Self {
        self.max = max;
        self
    }

    /// Values snap to multiples of this, counted from the minimum.
    pub const fn step(mut self, step: f32) -> Self {
        self.step = step;
        self
    }

    pub const fn disabled(mut self, disabled: bool) -> Self {
        self.disabled = disabled;
        self
    }

    /// Shows the value at the end of the label's row.
    pub const fn show_value(mut self, show_value: bool) -> Self {
        self.show_value = show_value;
        self
    }

    /// Called with each new value while the thumb moves. The slider does not move by itself:
    /// the handler decides. Takes a reference, like the handlers of GPUI Component, so
    /// `cx.listener` fits.
    pub fn on_change(mut self, handler: impl Fn(&f32, &mut Window, &mut App) + 'static) -> Self {
        self.on_change = Some(Rc::new(handler));
        self
    }
}

impl Slider {
    fn draw(self, window: &mut Window, cx: &mut App) -> impl IntoElement + Styled {
        let t = theme(cx);
        let c = palette(cx);
        let disabled = self.disabled;
        let (min, step) = (self.min, self.step);
        let max = self.max.max(min);
        let value = self.value.clamp(min, max);

        let watch = window.use_keyed_state((self.id.clone(), "slider"), cx, |window, cx| {
            let state = cx.new(|_| SliderState::new());
            let subscription = cx.subscribe_in(
                &state,
                window,
                |watch: &mut SliderWatch, _, event: &SliderEvent, window, cx| {
                    if let SliderEvent::Change(value) = event
                        && let Some(handler) = watch.handler.clone()
                    {
                        handler(&value.end(), window, cx);
                    }
                },
            );
            SliderWatch {
                state,
                handler: None,
                _subscription: subscription,
            }
        });
        // The handler is new every frame; the subscription calls the latest.
        let state = watch.update(cx, |watch, _| {
            watch.handler.clone_from(&self.on_change);
            watch.state.clone()
        });
        // GPUI Base's state follows the value given here, and is only touched when it differs,
        // since touching it asks for another frame.
        state.update(cx, |state, cx| {
            if state.min_value() != min || state.max_value() != max || state.step_value() != step {
                *state = SliderState::new()
                    .min(min)
                    .max(max)
                    .step(step)
                    .default_value(value);
                cx.notify();
            } else if state.value().end() != value {
                state.set_value(value, window, cx);
            }
        });

        let fraction = if max > min {
            (value - min) / (max - min)
        } else {
            0.0
        };
        let thumb = px(t.pointer.slider_thumb);
        let track = px(t.pointer.slider_track);
        // The thumb's center travels from end to end of the track, so the track reaches half
        // a thumb past the range on each side, and the thumb stays inside the slider.
        let half = thumb / 2.0;
        let mark = if disabled {
            c.slider_disabled_fill
        } else {
            c.slider_fill
        };
        let thumb_border = if disabled {
            c.slider_disabled_fill
        } else {
            c.slider_thumb_border
        };
        let focus = focus_handle(&self.id, window, cx);
        // A press focuses the slider for the arrow keys; the ring is for the keyboard.
        let ring = !disabled && focus.is_focused(window) && window.last_input_was_keyboard();

        let indicator = SliderIndicator::new(&state)
            .relative()
            .w_full()
            .h(track)
            .child(
                div()
                    .absolute()
                    .top_0()
                    .bottom_0()
                    .left(-half)
                    .right(-half)
                    .rounded_full()
                    .bg(color(c.slider_track)),
            )
            .child(
                div()
                    .absolute()
                    .top_0()
                    .bottom_0()
                    .left(-half)
                    .right(relative(1.0 - fraction))
                    .rounded_full()
                    .bg(color(mark)),
            )
            .child(
                SliderThumb::new(&state)
                    .disabled(disabled)
                    .absolute()
                    .top((track - thumb) / 2.0)
                    .left(relative(fraction))
                    .ml(-half)
                    .size(thumb)
                    .rounded_full()
                    .border(px(t.border.width_thick))
                    .border_color(color(thumb_border))
                    .bg(color(c.slider_thumb))
                    .when(ring, |thumb| thumb.focus_ring_style(window, cx)),
            );
        let slider = BaseSlider::new(&state)
            .disabled(disabled)
            .accessibility_label(self.label.clone())
            .when(!disabled, |slider| {
                slider.track_focus(&focus.clone().tab_index(0).tab_stop(true))
            })
            .flex()
            .w_full()
            .child(
                // The whole height that takes a press, which a pointer can hit.
                SliderTrack::new(&state)
                    .disabled(disabled)
                    .flex()
                    .items_center()
                    .w_full()
                    .h(px(t.pointer.target_min))
                    .px(half)
                    .child(indicator),
            );

        let shown = self.show_value.then(|| {
            div()
                .flex_none()
                .typography(t.typography.detail)
                .text_color(color(c.text_secondary))
                // Figures of one width, so the label row does not shift as the value changes.
                .font_features(FontFeatures(Arc::new(vec![("tnum".into(), 1)])))
                .child(format!("{value:.0$}", decimals(step)))
        });
        let on_change = self.on_change;
        div()
            .flex()
            .flex_col()
            .gap(px(t.space.s1))
            .w_full()
            .child(
                div()
                    .flex()
                    .items_center()
                    .justify_between()
                    .gap(px(t.space.s3))
                    .child(field_label(self.label, disabled, t, c))
                    .children(shown),
            )
            .child(slider)
            .when(!disabled, |root| {
                root
                    // The thumb keeps its press from the slider, so the focus is taken
                    // before either hears of it.
                    .capture_any_mouse_down(move |_, window, cx| focus.focus(window, cx))
                    .on_key_down(move |event: &KeyDownEvent, window, cx| {
                        if event.keystroke.modifiers.modified() {
                            return;
                        }
                        let by = key_step(min, max, step);
                        let next = match event.keystroke.key.as_str() {
                            "left" | "down" => value - by,
                            "right" | "up" => value + by,
                            "pagedown" => value - by * 10.0,
                            "pageup" => value + by * 10.0,
                            "home" => min,
                            "end" => max,
                            _ => return,
                        };
                        cx.stop_propagation();
                        let next = snap(next, min, max, step);
                        if next != value
                            && let Some(on_change) = &on_change
                        {
                            on_change(&next, window, cx);
                        }
                    })
            })
    }
}

impl Styled for Slider {
    fn style(&mut self) -> &mut StyleRefinement {
        &mut self.style
    }
}

impl RenderOnce for Slider {
    fn render(mut self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let style = std::mem::take(&mut self.style);
        let mut root = self.draw(window, cx);
        root.style().refine(&style);
        root
    }
}

// ---------------------------------------------------------------- list row

pub(crate) type ClickHandler = Rc<dyn Fn(&ClickEvent, &mut Window, &mut App)>;

/// One line of a list or a settings view. Separate rows with a divider. A row that can be
/// clicked can also be reached and pressed with the keyboard. Style it like any element, as a
/// sidebar rounds its rows.
#[derive(IntoElement)]
pub struct ListRow {
    id: ElementId,
    style: StyleRefinement,
    title: SharedString,
    description: Option<SharedString>,
    leading: Option<AnyElement>,
    trailing: Option<AnyElement>,
    chevron: bool,
    disabled: bool,
    selected: bool,
    compact: bool,
    title_hidden: bool,
    on_click: Option<ClickHandler>,
}

impl ListRow {
    pub fn new(id: impl Into<ElementId>, title: impl Into<SharedString>) -> Self {
        Self {
            id: id.into(),
            style: StyleRefinement::default(),
            title: title.into(),
            description: None,
            leading: None,
            trailing: None,
            chevron: false,
            disabled: false,
            selected: false,
            compact: false,
            title_hidden: false,
            on_click: None,
        }
    }

    /// Draws the leading element alone, centered, and leaves the title to assistive
    /// technology: a row of a collapsed sidebar.
    pub(crate) const fn title_hidden(mut self) -> Self {
        self.title_hidden = true;
        self
    }

    /// Marks the row as the current choice: the open page of a sidebar, the picked item of a
    /// menu. The title is set heavier as well as the row tinted, so the choice does not
    /// depend on color.
    pub const fn selected(mut self, selected: bool) -> Self {
        self.selected = selected;
        self
    }

    /// A lower row with smaller type, for a menu or a sidebar, where many rows share little
    /// room.
    pub const fn compact(mut self) -> Self {
        self.compact = true;
        self
    }

    pub fn description(mut self, description: impl Into<SharedString>) -> Self {
        self.description = Some(description.into());
        self
    }

    /// In front of the title: an avatar or an icon.
    pub fn leading(mut self, element: impl IntoElement) -> Self {
        self.leading = Some(element.into_any_element());
        self
    }

    /// At the far end: a value, a badge or a switch.
    pub fn trailing(mut self, element: impl IntoElement) -> Self {
        self.trailing = Some(element.into_any_element());
        self
    }

    /// Draws a chevron at the far end, for a row that leads somewhere else.
    pub const fn chevron(mut self) -> Self {
        self.chevron = true;
        self
    }

    pub const fn disabled(mut self, disabled: bool) -> Self {
        self.disabled = disabled;
        self
    }

    /// Makes the whole row clickable.
    pub fn on_click(
        mut self,
        handler: impl Fn(&ClickEvent, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_click = Some(Rc::new(handler));
        self
    }
}

impl Styled for ListRow {
    fn style(&mut self) -> &mut StyleRefinement {
        &mut self.style
    }
}

impl RenderOnce for ListRow {
    fn render(self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let t = theme(cx);
        let c = palette(cx);
        let title_color = if self.disabled {
            c.text_secondary
        } else {
            c.text_primary
        };
        let on_click = self.on_click.filter(|_| !self.disabled);
        let (min_height, padding, title_style, description_style) = if self.compact {
            let title = if self.selected {
                t.typography.label
            } else {
                t.typography.detail
            };
            (
                t.pointer.list_row_compact,
                t.space.s1,
                title,
                t.typography.footnote,
            )
        } else {
            let title = if self.selected {
                t.typography.body_strong
            } else {
                t.typography.body
            };
            (t.pointer.list_row, t.space.s2, title, t.typography.detail)
        };
        // Secondary text does not read on the pressed step of the selected fill, so a
        // selected row keeps its hover color while pressed.
        let (hover, pressed) = if self.selected {
            (
                c.list_row_background_selected_hover,
                c.list_row_background_selected_hover,
            )
        } else {
            (c.list_row_background_hover, c.list_row_background_pressed)
        };
        let focus = on_click
            .is_some()
            .then(|| focus_handle(&self.id, window, cx));
        let focused = focus.as_ref().is_some_and(|focus| focus.is_focused(window));
        let mut row = div()
            .id(self.id)
            // With a role GPUI reports the row, and with it whether it is the selected one.
            .role(Role::ListItem)
            .aria_label(self.title.clone())
            .when(self.selected, |row| {
                row.aria_selected(true)
                    .bg(color(c.list_row_background_selected))
            })
            .flex()
            .items_center()
            .gap(px(t.space.s3))
            .w_full()
            .min_h(px(min_height))
            .px(px(t.space.s4))
            .py(px(padding));
        if self.title_hidden {
            row = row.justify_center().px(px(0.0)).children(self.leading);
        } else {
            row = row
                .children(self.leading)
                .child(
                    div()
                        .flex_1()
                        .min_w_0()
                        .flex()
                        .flex_col()
                        .gap(px(t.space.s0_5))
                        .child(
                            div()
                                .typography(title_style)
                                .text_color(color(title_color))
                                .child(self.title),
                        )
                        .children(self.description.map(|description| {
                            div()
                                .typography(description_style)
                                .text_color(color(c.text_secondary))
                                .child(description)
                        })),
                )
                .children(self.trailing)
                .when(self.chevron, |row| {
                    row.child(
                        icon(tokens::Icon::ChevronRight)
                            .icon_size(IconSize::Sm)
                            .text_color(color(c.text_tertiary)),
                    )
                });
        }
        row.style().refine(&self.style);
        row.when_some(on_click.zip(focus), |row, (on_click, focus)| {
            row.track_focus(&focus.tab_index(0).tab_stop(true))
                .hover(|row| row.bg(color(hover)))
                .active(|row| row.bg(color(pressed)))
                // A click does not move the focus here, as on a button, so the ring shows
                // only when the keyboard got there.
                .on_mouse_down(MouseButton::Left, |_, window, _| window.prevent_default())
                .on_click(move |event, window, cx| on_click(event, window, cx))
        })
        .when(focused, |row| row.focus_ring_style(window, cx))
    }
}

// ---------------------------------------------------------------- accordion

/// One item of an [`Accordion`]: the value it stands for, its title, and the body that opens
/// under the title.
pub struct AccordionItem {
    value: SharedString,
    title: SharedString,
    description: Option<SharedString>,
    content: AnyElement,
}

impl AccordionItem {
    /// The body is set in body text, in the secondary color, unless it sets its own.
    pub fn new(
        value: impl Into<SharedString>,
        title: impl Into<SharedString>,
        content: impl IntoElement,
    ) -> Self {
        Self {
            value: value.into(),
            title: title.into(),
            description: None,
            content: content.into_any_element(),
        }
    }

    /// A line under the title.
    pub fn description(mut self, description: impl Into<SharedString>) -> Self {
        self.description = Some(description.into());
        self
    }
}

type ValuesHandler = Rc<dyn Fn(&[SharedString], &mut Window, &mut App)>;

/// The values that are open after the item `value` is pressed: it closes if it was open; if
/// not it opens, alone unless `multiple`.
fn toggle_expanded(
    expanded: &[SharedString],
    value: &SharedString,
    multiple: bool,
) -> Vec<SharedString> {
    if expanded.contains(value) {
        expanded
            .iter()
            .filter(|open| *open != value)
            .cloned()
            .collect()
    } else if multiple {
        expanded.iter().chain([value]).cloned().collect()
    } else {
        vec![value.clone()]
    }
}

/// Items whose bodies open and close under their titles: one at a time, or several with
/// `multiple`. Which are open is the app's business: the accordion holds no state.
///
/// GPUI Base's unstyled accordion gives each title row its role and its expanded state, and
/// its reveal opens the body. The rows are drawn here, with a hairline between items, and the
/// motion takes the design system's duration and easing, because GPUI Component's accordion is
/// a bordered card that opens on a spring.
#[derive(IntoElement)]
pub struct Accordion {
    style: StyleRefinement,
    id: ElementId,
    items: Vec<AccordionItem>,
    expanded: Vec<SharedString>,
    multiple: bool,
    on_change: Option<ValuesHandler>,
}

impl Accordion {
    pub fn new(id: impl Into<ElementId>, items: impl IntoIterator<Item = AccordionItem>) -> Self {
        Self {
            style: StyleRefinement::default(),
            id: id.into(),
            items: items.into_iter().collect(),
            expanded: Vec::new(),
            multiple: false,
            on_change: None,
        }
    }

    /// The values of the items that are open.
    pub fn expanded(mut self, values: impl IntoIterator<Item = impl Into<SharedString>>) -> Self {
        self.expanded = values.into_iter().map(Into::into).collect();
        self
    }

    /// Lets several items be open at once. Unless it is set, opening one closes the others.
    pub const fn multiple(mut self, multiple: bool) -> Self {
        self.multiple = multiple;
        self
    }

    /// Called with the values that are open after a title was pressed. Takes a reference,
    /// like the handlers of GPUI Component, so `cx.listener` fits.
    pub fn on_change(
        mut self,
        handler: impl Fn(&[SharedString], &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_change = Some(Rc::new(handler));
        self
    }
}

impl Accordion {
    fn draw(self, window: &mut Window, cx: &mut App) -> impl IntoElement + Styled {
        let t = theme(cx);
        let c = palette(cx);
        let hairline = px(t.border.width_thin);
        let [x1, y1, x2, y2] = t.motion.easing_standard;
        let expanded = Rc::new(self.expanded);
        let items = self
            .items
            .into_iter()
            .map(|item| {
                let open = expanded.contains(&item.value);
                let key = |part: &str| -> ElementId {
                    (self.id.clone(), format!("{part}-{}", item.value)).into()
                };
                // Under reduced motion the transition lands at once, so the body does not
                // animate.
                let progress = transition(
                    key("motion"),
                    if open { 1.0_f32 } else { 0.0 },
                    Transition::new(t.motion.duration_normal).ease(cubic_bezier(x1, y1, x2, y2)),
                    window,
                    cx,
                )
                .clamp(0.0, 1.0);
                let trigger_id = key("trigger");
                let focus = focus_handle(&trigger_id, window, cx);
                let focused = focus.is_focused(window);
                let on_change = self.on_change.clone().map(|on_change| {
                    let (expanded, value, multiple) =
                        (expanded.clone(), item.value.clone(), self.multiple);
                    move |_: bool, _: &ClickEvent, window: &mut Window, cx: &mut App| {
                        on_change(&toggle_expanded(&expanded, &value, multiple), window, cx);
                    }
                });
                let trigger = AccordionTrigger::new(trigger_id)
                    .open(open)
                    .track_focus(&focus.tab_index(0).tab_stop(true))
                    .aria_label(item.title.clone())
                    .flex()
                    .items_center()
                    .gap(px(t.space.s3))
                    .w_full()
                    .min_h(px(t.pointer.list_row))
                    .px(px(t.space.s4))
                    .py(px(t.space.s2))
                    .hover(|row| row.bg(color(c.accordion_header_background_hover)))
                    .active(|row| row.bg(color(c.accordion_header_background_pressed)))
                    // A click does not move the focus here, as on a button, so the ring shows
                    // only when the keyboard got there.
                    .on_mouse_down(MouseButton::Left, |_, window, _| window.prevent_default())
                    .when_some(on_change, |trigger, on_change| trigger.on_change(on_change))
                    .when(focused, |trigger| trigger.focus_ring_style(window, cx))
                    .child(
                        div()
                            .flex_1()
                            .min_w_0()
                            .flex()
                            .flex_col()
                            .child(
                                div()
                                    .typography(t.typography.body_strong)
                                    .text_color(color(c.text_primary))
                                    .child(item.title),
                            )
                            .children(item.description.map(|description| {
                                div()
                                    .typography(t.typography.detail)
                                    .text_color(color(c.text_secondary))
                                    .child(description)
                            })),
                    )
                    .child(
                        // Half a turn as the body opens: the chevron points up when open.
                        icon(tokens::Icon::ChevronDown)
                            .icon_size(IconSize::Sm)
                            .text_color(color(c.accordion_icon))
                            .rotate(percentage(progress / 2.0)),
                    );
                // Mounted from the frame it starts to open, so the reveal can measure it
                // before it grows, and until it has closed.
                let panel = (open || progress > 0.0).then(|| {
                    AccordionPanel::new()
                        .id(key("panel"))
                        .open(true)
                        .w_full()
                        .child(MotionReveal::new(
                            key("reveal"),
                            progress,
                            div()
                                .px(px(t.space.s4))
                                .pb(px(t.space.s4))
                                .typography(t.typography.body)
                                .text_color(color(c.text_secondary))
                                .child(item.content)
                                .into_any_element(),
                        ))
                });
                BaseAccordionItem::new()
                    .open(open)
                    .header(AccordionHeader::new(trigger).id(key("header")).w_full())
                    .when_some(panel, |item, panel| item.panel(panel))
                    .flex()
                    .flex_col()
                    .w_full()
                    .border_b(hairline)
                    .border_color(color(c.accordion_border))
            })
            .collect::<Vec<_>>();
        BaseAccordion::new(self.id)
            .flex()
            .flex_col()
            .w_full()
            .border_t(hairline)
            .border_color(color(c.accordion_border))
            .children(items)
    }
}

impl Styled for Accordion {
    fn style(&mut self) -> &mut StyleRefinement {
        &mut self.style
    }
}

impl RenderOnce for Accordion {
    fn render(mut self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let style = std::mem::take(&mut self.style);
        let mut root = self.draw(window, cx);
        root.style().refine(&style);
        root
    }
}

// ---------------------------------------------------------------- icon

/// `Xs` fits inside a badge, `Sm` and `Md` sit beside text, `Lg` stands alone, and `Xl`
/// illustrates, as in an empty state.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum IconSize {
    Xs,
    Sm,
    #[default]
    Md,
    Lg,
    Xl,
}

impl IconSize {
    pub(crate) const fn side(self, t: &tokens::Theme) -> f32 {
        match self {
            Self::Xs => t.pointer.icon_xs,
            Self::Sm => t.pointer.icon_sm,
            Self::Md => t.pointer.icon_md,
            Self::Lg => t.pointer.icon_lg,
            Self::Xl => t.pointer.icon_xl,
        }
    }
}

/// An icon of the design system. It takes the color of the text around it; set another with
/// `.text_color`. Its size is `.icon_size`, or else the registered
/// [`Defaults`](crate::Defaults), or else the middle one.
pub fn icon(name: tokens::Icon) -> IconElement {
    IconElement {
        name,
        filled: false,
        size: None,
        rotation: None,
        style: StyleRefinement::default(),
    }
}

/// The icon with its shapes filled, so that a selected state shows in the form and not in the
/// color alone: a heart that was pressed, a bookmark that is saved. Only for icons made of
/// closed shapes.
pub fn icon_filled(name: tokens::Icon) -> IconElement {
    IconElement {
        filled: true,
        ..icon(name)
    }
}

/// What [`icon`] and [`icon_filled`] return. Named apart from the icon names, `tokens::Icon`.
#[derive(IntoElement)]
pub struct IconElement {
    name: tokens::Icon,
    filled: bool,
    size: Option<IconSize>,
    rotation: Option<Radians>,
    style: StyleRefinement,
}

impl IconElement {
    /// Named apart from `Styled::size`, which sets a width and a height.
    pub const fn icon_size(mut self, size: IconSize) -> Self {
        self.size = Some(size);
        self
    }

    /// Turns the drawing about its center, as a chevron does when what it opens opens.
    pub fn rotate(mut self, radians: impl Into<Radians>) -> Self {
        self.rotation = Some(radians.into());
        self
    }
}

impl Styled for IconElement {
    fn style(&mut self) -> &mut StyleRefinement {
        &mut self.style
    }
}

impl RenderOnce for IconElement {
    fn render(mut self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let size = self
            .size
            .or_else(|| defaults(cx).icon.size)
            .unwrap_or_default();
        // The drawing is generated from design/icons, so no asset has to be registered for it.
        let drawing = if self.filled {
            self.name.filled_svg()
        } else {
            self.name.svg()
        };
        // GPUI Component's icon keeps its color apart from its style, and paints over the
        // style's with it.
        let ink = self.style.text.color.take();
        let mut icon = KitIcon::default()
            .data(drawing.as_bytes())
            .size(px(size.side(theme(cx))))
            .flex_none()
            .when_some(self.rotation, |icon, radians| icon.rotate(radians))
            .when_some(ink, |icon, ink| icon.text_color(ink));
        icon.style().refine(&self.style);
        icon
    }
}

#[cfg(test)]
mod tests {
    use gpui_kit::SharedString;

    use super::{
        Step, decimals, initials, key_step, move_index, overflow, pulse, snap, toggle_expanded,
    };

    #[test]
    fn the_arrow_keys_go_round_the_ends() {
        assert_eq!(move_index(Some(0), 3, Step::Next), Some(1));
        assert_eq!(move_index(Some(2), 3, Step::Next), Some(0));
        assert_eq!(move_index(Some(0), 3, Step::Previous), Some(2));
        assert_eq!(move_index(None, 3, Step::Next), Some(0));
        assert_eq!(move_index(None, 3, Step::Previous), Some(2));
        assert_eq!(move_index(Some(1), 3, Step::First), Some(0));
        assert_eq!(move_index(Some(1), 3, Step::Last), Some(2));
        assert_eq!(move_index(None, 0, Step::Next), None);
    }

    #[test]
    fn a_slider_value_snaps_to_its_steps_inside_its_range() {
        assert_eq!(snap(33.0, 0.0, 100.0, 5.0), 35.0);
        assert_eq!(snap(32.0, 0.0, 100.0, 5.0), 30.0);
        assert_eq!(snap(104.0, 0.0, 100.0, 1.0), 100.0);
        assert_eq!(snap(-3.0, 0.0, 100.0, 1.0), 0.0);
        // Steps are counted from the minimum.
        assert_eq!(snap(4.0, 1.0, 10.0, 2.0), 5.0);
        // Without a step the value is kept.
        assert_eq!(snap(3.3, 0.0, 10.0, 0.0), 3.3);
        assert_eq!(key_step(0.0, 50.0, 0.0), 0.5);
        assert_eq!(key_step(0.0, 50.0, 5.0), 5.0);
    }

    #[test]
    fn a_value_shows_as_many_decimals_as_its_step() {
        assert_eq!(decimals(1.0), 0);
        assert_eq!(decimals(5.0), 0);
        assert_eq!(decimals(0.5), 1);
        assert_eq!(decimals(0.1), 1);
        assert_eq!(decimals(0.25), 2);
    }

    #[test]
    fn opening_an_item_closes_the_others_unless_several_may_be_open() {
        let values = |values: &[&'static str]| -> Vec<SharedString> {
            values
                .iter()
                .map(|value| SharedString::from(*value))
                .collect()
        };
        let open = values(&["a"]);
        assert_eq!(toggle_expanded(&open, &"b".into(), false), values(&["b"]));
        assert_eq!(
            toggle_expanded(&open, &"b".into(), true),
            values(&["a", "b"])
        );
        assert_eq!(toggle_expanded(&open, &"a".into(), false), values(&[]));
        assert_eq!(
            toggle_expanded(&values(&["a", "b"]), &"a".into(), true),
            values(&["b"])
        );
    }

    #[test]
    fn a_pulse_goes_to_the_highlight_and_back_once_per_beat() {
        assert!(pulse(0.0).abs() < 1e-6);
        assert!((pulse(0.5) - 1.0).abs() < 1e-6);
        assert!(pulse(1.0).abs() < 1e-6);
        assert!((pulse(0.25) - pulse(0.75)).abs() < 1e-6);
    }

    #[test]
    fn a_stack_counts_the_people_it_does_not_draw() {
        assert_eq!(overflow(3, 4), 0);
        assert_eq!(overflow(4, 4), 0);
        assert_eq!(overflow(7, 4), 3);
    }

    #[test]
    fn initials_take_the_first_letter_of_each_word() {
        assert_eq!(initials("Ada Lovelace", 2), "AL");
        assert_eq!(initials("  grace   brewster hopper ", 2), "GB");
        assert_eq!(initials("Plato", 2), "P");
        assert_eq!(initials("김 민준", 2), "김민");
        assert_eq!(initials("Ada Lovelace", 1), "A");
        assert_eq!(initials("", 2), "");
    }
}
