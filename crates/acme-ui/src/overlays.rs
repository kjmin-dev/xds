//! What opens over the window: the menu, the dialog, the toast and the tooltip.
//!
//! GPUI Component supplies how they behave where it can: its popover places the menu, moves the
//! focus into it, dismisses it and gives the focus back, and the unstyled dialog and positioner
//! underneath it (GPUI Base) trap the focus, answer Escape and the scrim, and keep a popup
//! inside the window. Their surfaces are drawn here from the tokens, because the ready-made
//! ones take their look from GPUI Component's theme. GPUI Component's tooltips are drawn by a
//! layer of its own, in its theme, so the tooltip's delay and dismissal are kept here too, and
//! only its role and its placement come from GPUI Base. GPUI Base's toasts are a stack the app
//! pushes to, with motion of its own, not one toast that `open` decides, so the toast is drawn
//! here whole.
//!
//! All of them are drawn after the rest of the window, so they need nothing from the app but
//! a window opened with `gpui_kit::open_window` and `acme_ui::init`, which binds the keys of
//! GPUI Base's dialog and popover.

use std::cell::Cell;
use std::rc::Rc;
use std::time::Duration;

use acme_tokens as tokens;
use gpui_kit::base::animation::cubic_bezier;
use gpui_kit::base::{
    Dialog as DialogHost, DialogBackdrop, DialogDescription, DialogPopup, DialogTitle, ElementExt,
    Placement, Positioner, Tooltip as TooltipPopup,
};
use gpui_kit::component::{
    Selectable, ThemeStyled,
    popover::{Popover, PopoverState},
};
use gpui_kit::prelude::FluentBuilder;
use gpui_kit::{
    Anchor, Animation, AnimationExt, AnyElement, App, Bounds, BoxShadow, ClickEvent, DispatchPhase,
    Div, ElementId, Entity, FocusHandle, InteractiveElement, IntoElement, KeyDownEvent,
    MouseButton, ParentElement, Pixels, RenderOnce, Role, ScrollHandle, SharedString, Stateful,
    StatefulInteractiveElement, StyleRefinement, Styled, Task, WeakFocusHandle, Window, anchored,
    canvas, deferred, div, point, px,
};

use crate::components::{ControlSize, field_frame, field_label, field_note, field_outline, shadow};
use crate::controls::{ClickHandler, IconSize, Step, ValueHandler, focus_handle, icon, move_index};
use crate::theme::{TypographyExt, color, palette};

/// Called when an overlay asks to be closed. Takes a reference, like the handlers of GPUI
/// Component, so `cx.listener` fits.
type CloseHandler = Rc<dyn Fn(&(), &mut Window, &mut App)>;

/// Above a dialog, which GPUI Base draws from priority 10, and its popups, at 100; under a
/// tooltip, at 200.
const TOAST_PRIORITY: usize = 150;
const TOOLTIP_PRIORITY: usize = 200;

/// How an overlay comes in: over `motion.duration.normal`, slowing into place.
fn entrance() -> Animation {
    let [x1, y1, x2, y2] = tokens::MOTION_EASING_ENTER;
    Animation::new(tokens::MOTION_DURATION_NORMAL).with_easing(cubic_bezier(x1, y1, x2, y2))
}

/// A token shadow while its surface fades in. GPUI fades each thing it paints by itself, and
/// a shadow is painted whole under its surface, so it would show through a surface that is
/// still translucent. Its ink follows the cube of the fade: out of sight until the surface
/// covers it.
fn fading_shadow(token: tokens::Shadow, fade: f32) -> Vec<BoxShadow> {
    let mut shadows = shadow(token);
    for shadow in &mut shadows {
        shadow.color.a *= fade * fade * fade;
    }
    shadows
}

/// What a closed dialog or toast leaves in the view. Out of the flow, as the open one is, so
/// the gap of the parent's layout does not count it and opening it moves nothing.
fn closed() -> AnyElement {
    div().absolute().into_any_element()
}

// ---------------------------------------------------------------- menu

/// The edge of the trigger a menu lines up with.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum MenuAlign {
    #[default]
    Start,
    End,
}

/// One action of a [`Menu`].
pub struct MenuItem {
    label: SharedString,
    description: Option<SharedString>,
    icon: Option<tokens::Icon>,
    on_select: Option<ClickHandler>,
    danger: bool,
    disabled: bool,
    selected: bool,
}

impl MenuItem {
    pub fn new(label: impl Into<SharedString>) -> Self {
        Self {
            label: label.into(),
            description: None,
            icon: None,
            on_select: None,
            danger: false,
            disabled: false,
            selected: false,
        }
    }

    /// A second line under the label, for an option of a select.
    fn description(mut self, description: Option<SharedString>) -> Self {
        self.description = description;
        self
    }

    /// An icon in front of the label.
    pub fn icon(mut self, icon: tokens::Icon) -> Self {
        self.icon = Some(icon);
        self
    }

    /// Called when the item is chosen. The menu closes after it.
    pub fn on_select(
        mut self,
        handler: impl Fn(&ClickEvent, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_select = Some(Rc::new(handler));
        self
    }

    /// For an action that destroys.
    pub fn danger(mut self, danger: bool) -> Self {
        self.danger = danger;
        self
    }

    pub fn disabled(mut self, disabled: bool) -> Self {
        self.disabled = disabled;
        self
    }

    /// Marks the item as the current choice, with a check mark at its end.
    pub fn selected(mut self, selected: bool) -> Self {
        self.selected = selected;
        self
    }
}

enum MenuEntry {
    Item(MenuItem),
    Separator,
}

/// A list of actions that opens from a control. A press outside it, Escape, or choosing an
/// item closes it. GPUI Component's popover places it under the trigger, keeps it inside the
/// window, moves the focus into it and gives the focus back.
#[derive(IntoElement)]
pub struct Menu {
    id: ElementId,
    label: SharedString,
    trigger: Option<AnyElement>,
    entries: Vec<MenuEntry>,
    align: MenuAlign,
    default_open: bool,
}

impl Menu {
    /// The label names the menu for assistive technology.
    pub fn new(id: impl Into<ElementId>, label: impl Into<SharedString>) -> Self {
        Self {
            id: id.into(),
            label: label.into(),
            trigger: None,
            entries: Vec::new(),
            align: MenuAlign::default(),
            default_open: false,
        }
    }

    /// The control that opens the menu: usually a button or an icon button. The menu takes
    /// the press, so the control needs no handler of its own.
    pub fn trigger(mut self, trigger: impl IntoElement) -> Self {
        self.trigger = Some(trigger.into_any_element());
        self
    }

    pub fn item(mut self, item: MenuItem) -> Self {
        self.entries.push(MenuEntry::Item(item));
        self
    }

    /// A line between groups of items.
    pub fn separator(mut self) -> Self {
        self.entries.push(MenuEntry::Separator);
        self
    }

    pub fn align(mut self, align: MenuAlign) -> Self {
        self.align = align;
        self
    }

    /// Whether the menu is open when it first appears. After that it opens and closes itself.
    pub fn default_open(mut self, open: bool) -> Self {
        self.default_open = open;
        self
    }
}

/// Wraps the trigger so that it tells assistive technology which menu it opens and whether
/// that menu is open. The popover asks this of its trigger through `Selectable`.
#[derive(IntoElement)]
struct MenuTrigger {
    label: SharedString,
    element: Option<AnyElement>,
    open: bool,
}

impl Selectable for MenuTrigger {
    fn selected(mut self, selected: bool) -> Self {
        self.open = selected;
        self
    }

    fn is_selected(&self) -> bool {
        self.open
    }
}

impl RenderOnce for MenuTrigger {
    fn render(self, _window: &mut Window, _cx: &mut App) -> impl IntoElement {
        div()
            .id("menu-trigger")
            .role(Role::Group)
            .aria_label(self.label)
            .aria_expanded(self.open)
            .flex()
            .flex_none()
            .children(self.element)
    }
}

/// One row of a menu, or of a select's list, which is a listbox to assistive technology and
/// says which `role` its rows have. `focus` is the row's own; the select makes its rows'
/// handles itself, so the list can open with the focus on the chosen one.
fn menu_row(
    id: ElementId,
    item: &MenuItem,
    role: Role,
    focus: FocusHandle,
    popover: Entity<PopoverState>,
    window: &mut Window,
    cx: &mut App,
) -> AnyElement {
    let c = palette(cx);
    let (text, mark, hover, pressed) = if item.disabled {
        (
            c.menu_text_disabled,
            c.menu_text_disabled,
            c.menu_background,
            c.menu_background,
        )
    } else if item.danger {
        (
            c.menu_danger_text,
            c.menu_danger_text,
            c.menu_danger_background_hover,
            c.menu_danger_background_hover,
        )
    } else {
        (
            c.menu_text,
            c.menu_icon,
            c.menu_item_background_hover,
            c.menu_item_background_pressed,
        )
    };
    let focused = !item.disabled && focus.is_focused(window);
    let on_select = item.on_select.clone();
    let row_height = px(tokens::POINTER.list_row_compact);
    let label = div().min_w_0().truncate().child(item.label.clone());
    div()
        .id(id)
        .role(role)
        .aria_label(item.label.clone())
        .when_some(item.description.clone(), |row, description| {
            row.aria_description(description)
        })
        .when(item.selected, |row| row.aria_selected(true))
        .flex()
        .flex_none()
        .items_center()
        .gap(px(tokens::SPACE_2))
        .px(px(tokens::SPACE_2))
        .rounded(px(tokens::RADIUS_SM))
        .typography(tokens::TYPOGRAPHY_DETAIL)
        .whitespace_nowrap()
        .text_color(color(text))
        .children(
            item.icon
                .map(|name| icon(name, IconSize::Sm).text_color(color(mark))),
        )
        .map(|row| match &item.description {
            None => row.h(row_height).child(label.flex_1()),
            // Two lines: the row grows past the compact height to hold them.
            Some(description) => row.min_h(row_height).py(px(tokens::SPACE_1)).child(
                div()
                    .flex_1()
                    .min_w_0()
                    .flex()
                    .flex_col()
                    .child(label)
                    .child(
                        div()
                            .min_w_0()
                            .truncate()
                            .typography(tokens::TYPOGRAPHY_FOOTNOTE)
                            .text_color(color(if item.disabled {
                                c.menu_text_disabled
                            } else {
                                c.text_secondary
                            }))
                            .child(description.clone()),
                    ),
            ),
        })
        // A mark as well as a state for assistive technology, so the choice can be seen.
        .when(item.selected, |row| {
            row.child(icon(tokens::Icon::Check, IconSize::Sm))
        })
        .when(!item.disabled, |row| {
            row.track_focus(&focus.tab_index(0).tab_stop(true))
                // The keyboard's place in the menu looks like the pointer's.
                .when(focused, |row| row.bg(color(hover)))
                .hover(|row| row.bg(color(hover)))
                .active(|row| row.bg(color(pressed)))
                .on_mouse_down(MouseButton::Left, |_, window, _| window.prevent_default())
                .on_click(move |event, window, cx| {
                    if let Some(on_select) = &on_select {
                        on_select(event, window, cx);
                    }
                    popover.update(cx, |popover, cx| popover.dismiss(window, cx));
                })
        })
        .into_any_element()
}

impl RenderOnce for Menu {
    fn render(self, _window: &mut Window, _cx: &mut App) -> impl IntoElement {
        let id = self.id.clone();
        let label = self.label.clone();
        // The popover builds its content whenever it draws, so the entries are shared with it.
        let entries = Rc::new(self.entries);
        Popover::new(self.id)
            // The surface is drawn below, from the menu's own tokens.
            .appearance(false)
            // This names the corner of the menu that meets the trigger: under it, at its
            // start or its end.
            .anchor(match self.align {
                MenuAlign::Start => Anchor::TopLeft,
                MenuAlign::End => Anchor::TopRight,
            })
            .offset(px(tokens::SPACE_1))
            .default_open(self.default_open)
            .trigger(MenuTrigger {
                label: self.label,
                element: self.trigger,
                open: false,
            })
            .content(move |_, window, cx| {
                let c = palette(cx);
                let popover = cx.entity();
                let mut stops = Vec::new();
                let rows = entries
                    .iter()
                    .enumerate()
                    .map(|(index, entry)| match entry {
                        MenuEntry::Item(item) => {
                            let row_id: ElementId = (id.clone(), index.to_string()).into();
                            let focus = focus_handle(&row_id, window, cx);
                            if !item.disabled {
                                stops.push((index, focus.clone()));
                            }
                            menu_row(
                                row_id,
                                item,
                                Role::MenuItem,
                                focus,
                                popover.clone(),
                                window,
                                cx,
                            )
                        }
                        MenuEntry::Separator => div()
                            .flex_none()
                            .my(px(tokens::SPACE_1))
                            .h(px(tokens::BORDER_WIDTH_THIN))
                            .bg(color(c.menu_border))
                            .into_any_element(),
                    })
                    .collect::<Vec<_>>();
                menu_surface(Role::Menu, label.clone(), rows, stops, None, cx)
            })
    }
}

/// The surface of a menu and of a select's list. The arrow keys move between the rows that
/// can be chosen, and Home and End go to the first and the last. `stops` are those rows, each
/// with its place among the children, which is where `scroll` scrolls to bring it into view.
fn menu_surface(
    role: Role,
    label: SharedString,
    rows: Vec<AnyElement>,
    stops: Vec<(usize, FocusHandle)>,
    scroll: Option<ScrollHandle>,
    cx: &App,
) -> Stateful<Div> {
    let c = palette(cx);
    let surface = div()
        .id("menu")
        .role(role)
        .aria_label(label)
        .flex()
        .flex_col()
        // Four times `space.12`: the least a menu is wide. Beyond that it is as wide as its
        // longest row.
        .min_w(px(tokens::SPACE_12 * 4.0))
        .p(px(tokens::SPACE_1))
        .rounded(px(tokens::RADIUS_MD))
        .border(px(tokens::BORDER_WIDTH_THIN))
        .border_color(color(c.menu_border))
        .bg(color(c.menu_background))
        .shadow(shadow(tokens::SHADOW_RAISED))
        .children(rows);
    let surface = match &scroll {
        Some(scroll) => surface.overflow_y_scroll().track_scroll(scroll),
        None => surface,
    };
    surface.on_key_down(move |event: &KeyDownEvent, window, cx| {
        if event.keystroke.modifiers.modified() {
            return;
        }
        let step = match event.keystroke.key.as_str() {
            "down" => Step::Next,
            "up" => Step::Previous,
            "home" => Step::First,
            "end" => Step::Last,
            _ => return,
        };
        let current = stops.iter().position(|(_, focus)| focus.is_focused(window));
        let Some(next) = move_index(current, stops.len(), step) else {
            return;
        };
        cx.stop_propagation();
        let (child, focus) = &stops[next];
        if let Some(scroll) = &scroll {
            scroll.scroll_to_item(*child);
        }
        focus.focus(window, cx);
    })
}

// ---------------------------------------------------------------- select

/// One choice of a [`Select`]: the value it stands for, and what it shows.
pub struct SelectOption {
    value: SharedString,
    label: SharedString,
    description: Option<SharedString>,
}

impl SelectOption {
    pub fn new(value: impl Into<SharedString>, label: impl Into<SharedString>) -> Self {
        Self {
            value: value.into(),
            label: label.into(),
            description: None,
        }
    }

    /// A line under the label, in the list.
    pub fn description(mut self, description: impl Into<SharedString>) -> Self {
        self.description = Some(description.into());
        self
    }
}

/// How many rows a select's list shows before it scrolls.
const SELECT_ROWS: f32 = 8.0;

/// A field for choosing one option from a list too long to show at once. Closed, it looks like
/// a text field: the same label, box, description and error. Pressed, it opens the options
/// under it, as wide as the field, on the surface and with the rows of a menu; the chosen one
/// has a check mark. Choosing one calls `on_change` and closes the list; Escape or a press
/// outside closes it too.
///
/// GPUI Component's popover holds the list, as it holds a menu: it places it, moves the focus
/// into it, closes it and gives the focus back.
#[derive(IntoElement)]
pub struct Select {
    id: ElementId,
    label: SharedString,
    options: Vec<SelectOption>,
    value: Option<SharedString>,
    placeholder: Option<SharedString>,
    description: Option<SharedString>,
    error: Option<SharedString>,
    disabled: bool,
    on_change: Option<ValueHandler>,
    default_open: bool,
}

impl Select {
    /// The label is drawn above the field and names it for assistive technology.
    pub fn new(
        id: impl Into<ElementId>,
        label: impl Into<SharedString>,
        options: impl IntoIterator<Item = SelectOption>,
    ) -> Self {
        Self {
            id: id.into(),
            label: label.into(),
            options: options.into_iter().collect(),
            value: None,
            placeholder: None,
            description: None,
            error: None,
            disabled: false,
            on_change: None,
            default_open: false,
        }
    }

    /// The value of the chosen option. Nothing is chosen unless this is set.
    pub fn value(mut self, value: impl Into<SharedString>) -> Self {
        self.value = Some(value.into());
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

    /// Called with the value of the option that was chosen. The select does not choose by
    /// itself: the handler decides. Takes a reference, like the handlers of GPUI Component, so
    /// `cx.listener` fits.
    pub fn on_change(
        mut self,
        handler: impl Fn(&SharedString, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_change = Some(Rc::new(handler));
        self
    }

    /// Whether the list is open when the select first appears, for a screenshot of the
    /// design preview. After that it opens and closes itself.
    pub(crate) fn default_open(mut self, open: bool) -> Self {
        self.default_open = open;
        self
    }
}

/// The box of a select, which opens its list. The popover tells it through `Selectable` whether
/// the list is open, which it tells assistive technology.
#[derive(IntoElement)]
struct SelectField {
    id: ElementId,
    label: SharedString,
    shown: Option<SharedString>,
    placeholder: Option<SharedString>,
    invalid: bool,
    disabled: bool,
    open: bool,
    /// Where the box was last drawn as wide, which is how wide the list is.
    width: Rc<Cell<Pixels>>,
}

impl Selectable for SelectField {
    fn selected(mut self, selected: bool) -> Self {
        self.open = selected;
        self
    }

    fn is_selected(&self) -> bool {
        self.open
    }
}

impl RenderOnce for SelectField {
    fn render(self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let c = palette(cx);
        let radius = px(tokens::RADIUS_MD);
        let focus = focus_handle(&self.id, window, cx);
        let focused = !self.disabled && focus.is_focused(window);
        let (text, text_color) = match self.shown.clone() {
            Some(shown) => (shown, c.field_text),
            None => (self.placeholder.unwrap_or_default(), c.field_placeholder),
        };
        let frame = field_frame(self.invalid, self.disabled, focused, radius, window, cx)
            .id(self.id)
            // A combo box that opens a list, and says whether it is open.
            .role(Role::ComboBox)
            .aria_label(self.label)
            .aria_expanded(self.open)
            .when_some(self.shown, |frame, shown| frame.aria_value(shown))
            .when(!self.disabled, |frame| {
                frame
                    .track_focus(&focus.tab_index(0).tab_stop(true))
                    // A click opens the list, which takes the focus, so the box does not take
                    // it first and show a ring when the list closes.
                    .on_mouse_down(MouseButton::Left, |_, window, _| window.prevent_default())
            })
            .items_center()
            .gap(px(tokens::SPACE_2))
            .h(ControlSize::Md.height())
            // As far from the edge as the text of a text field is.
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
                icon(tokens::Icon::ChevronsUpDown, IconSize::Sm)
                    .text_color(color(c.field_placeholder)),
            );
        let (width, open) = (self.width, self.open);
        field_outline(self.invalid, radius, c, frame)
            .w_full()
            .on_prepaint(move |bounds, window, _| {
                // The list was built before the box was laid out. When the box has changed
                // width since, as on the first frame, build it again.
                if width.replace(bounds.size.width) != bounds.size.width && open {
                    window.request_animation_frame();
                }
            })
    }
}

/// Where a select's list is scrolled to, kept while it is open.
struct ListScroll {
    handle: ScrollHandle,
    /// Whether the list has been scrolled to the chosen option since it opened.
    placed: bool,
}

impl RenderOnce for Select {
    fn render(self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let c = palette(cx);
        let chosen = self.value.as_ref().and_then(|value| {
            self.options
                .iter()
                .position(|option| &option.value == value)
        });
        let width = window
            .use_keyed_state((self.id.clone(), "width"), cx, |_, _| {
                Rc::new(Cell::new(Pixels::ZERO))
            })
            .read(cx)
            .clone();
        let field = SelectField {
            id: (self.id.clone(), "field").into(),
            label: self.label.clone(),
            shown: chosen.map(|index| self.options[index].label.clone()),
            placeholder: self.placeholder,
            invalid: self.error.is_some(),
            disabled: self.disabled,
            open: false,
            width: width.clone(),
        };
        let control = if self.disabled {
            field.into_any_element()
        } else {
            // The rows' focus handles are made here, outside the list, so the popover can
            // give the focus to the chosen row as the list opens.
            let rows: Vec<(ElementId, FocusHandle)> = (0..self.options.len())
                .map(|index| {
                    let id: ElementId = (self.id.clone(), index.to_string()).into();
                    let focus = focus_handle(&id, window, cx);
                    (id, focus)
                })
                .collect();
            let opening = rows
                .get(chosen.unwrap_or(0))
                .map(|(_, focus)| focus.clone());
            let (id, label, on_change) = (self.id.clone(), self.label.clone(), self.on_change);
            let options = Rc::new(self.options);
            Popover::new(self.id.clone())
                // The surface is the menu's, drawn below.
                .appearance(false)
                .anchor(Anchor::TopLeft)
                .offset(px(tokens::SPACE_1))
                .default_open(self.default_open)
                // The box fills the width of the field, and the list is anchored to it.
                .trigger_style(StyleRefinement::default().w_full())
                .when_some(opening, |popover, focus| popover.track_focus(&focus))
                .trigger(field)
                .content(move |_, window, cx| {
                    let popover = cx.entity();
                    let scroll =
                        window.use_keyed_state((id.clone(), "scroll"), cx, |_, _| ListScroll {
                            handle: ScrollHandle::new(),
                            placed: false,
                        });
                    let scroll = scroll.update(cx, |scroll, _| {
                        if !scroll.placed {
                            // GPUI scrolls to a row against the list's bounds, which it only
                            // knows once the list has been laid out; until then, wait a frame.
                            if scroll.handle.bounds().size.height > Pixels::ZERO {
                                scroll.placed = true;
                                if let Some(chosen) = chosen {
                                    scroll.handle.scroll_to_item(chosen);
                                }
                            } else {
                                window.request_animation_frame();
                            }
                        }
                        scroll.handle.clone()
                    });
                    let items = options.iter().enumerate().map(|(index, option)| {
                        let on_change = on_change.clone();
                        let value = option.value.clone();
                        MenuItem::new(option.label.clone())
                            .description(option.description.clone())
                            .selected(chosen == Some(index))
                            .on_select(move |_, window, cx| {
                                if let Some(on_change) = &on_change {
                                    on_change(&value, window, cx);
                                }
                            })
                    });
                    let mut stops = Vec::new();
                    let list = items
                        .zip(&rows)
                        .enumerate()
                        .map(|(index, (item, (row_id, focus)))| {
                            stops.push((index, focus.clone()));
                            menu_row(
                                row_id.clone(),
                                &item,
                                Role::ListBoxOption,
                                focus.clone(),
                                popover.clone(),
                                window,
                                cx,
                            )
                        })
                        .collect::<Vec<_>>();
                    let inset = tokens::SPACE_1 + tokens::BORDER_WIDTH_THIN;
                    let width = width.get();
                    menu_surface(Role::ListBox, label.clone(), list, stops, Some(scroll), cx)
                        .max_h(px(
                            tokens::POINTER.list_row_compact * SELECT_ROWS + inset * 2.0
                        ))
                        // As wide as the field, once the field has been laid out.
                        .when(width > Pixels::ZERO, |list| list.min_w(width).w(width))
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

// ---------------------------------------------------------------- dialog

/// Where the focus was before a dialog took it, kept from frame to frame.
struct DialogFocus {
    handle: FocusHandle,
    previous: Option<WeakFocusHandle>,
    open: bool,
}

/// A window that interrupts the view for a confirmation or a short task. It does not close
/// itself: `open` decides, and `on_close` says when Escape or a press outside asks for it.
/// Add the body as children.
///
/// GPUI Base's unstyled dialog holds it: it keeps the focus inside, answers Escape and the
/// press on the scrim, and draws over the rest of the window.
#[derive(IntoElement)]
pub struct Dialog {
    id: ElementId,
    title: SharedString,
    description: Option<SharedString>,
    open: bool,
    dismissible: bool,
    on_close: Option<CloseHandler>,
    body: Vec<AnyElement>,
    actions: Vec<AnyElement>,
}

impl Dialog {
    pub fn new(id: impl Into<ElementId>, title: impl Into<SharedString>) -> Self {
        Self {
            id: id.into(),
            title: title.into(),
            description: None,
            open: false,
            dismissible: true,
            on_close: None,
            body: Vec::new(),
            actions: Vec::new(),
        }
    }

    pub fn open(mut self, open: bool) -> Self {
        self.open = open;
        self
    }

    pub fn description(mut self, description: impl Into<SharedString>) -> Self {
        self.description = Some(description.into());
        self
    }

    /// A button at the end of the dialog. Add the main action last.
    pub fn action(mut self, action: impl IntoElement) -> Self {
        self.actions.push(action.into_any_element());
        self
    }

    /// Whether Escape and a press on the scrim ask to close. Turn it off for a question that
    /// must be answered.
    pub fn dismissible(mut self, dismissible: bool) -> Self {
        self.dismissible = dismissible;
        self
    }

    /// Called when Escape or a press on the scrim asks to close the dialog.
    pub fn on_close(mut self, handler: impl Fn(&(), &mut Window, &mut App) + 'static) -> Self {
        self.on_close = Some(Rc::new(handler));
        self
    }
}

impl ParentElement for Dialog {
    fn extend(&mut self, elements: impl IntoIterator<Item = AnyElement>) {
        self.body.extend(elements);
    }
}

impl RenderOnce for Dialog {
    fn render(self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let c = palette(cx);
        let focus = window.use_keyed_state(self.id.clone(), cx, |_, cx| DialogFocus {
            handle: cx.focus_handle(),
            previous: None,
            open: false,
        });
        let open = self.open;
        let handle = focus.update(cx, |focus, cx| {
            if open && !focus.open {
                focus.previous = window.focused(cx).map(|handle| handle.downgrade());
                focus.handle.focus(window, cx);
            } else if !open && focus.open {
                // Back to where it was; and off the dialog in any case, which is gone.
                match focus.previous.take().and_then(|handle| handle.upgrade()) {
                    Some(previous) => previous.focus(window, cx),
                    None => window.blur(cx),
                }
            }
            focus.open = open;
            focus.handle.clone()
        });
        if !open {
            return closed();
        }

        let margin = px(tokens::SPACE_4);
        let scrolls = self.description.is_some() || !self.body.is_empty();
        let popup = DialogPopup::new()
            .flex()
            .flex_col()
            .gap(px(tokens::SPACE_4))
            .w_full()
            .max_w(px(tokens::POINTER.dialog))
            // The title and the actions stay; what is between them scrolls.
            .max_h(window.viewport_size().height - margin * 2.0)
            .p(px(tokens::SPACE_6))
            .rounded(px(tokens::RADIUS_LG))
            .border(px(tokens::BORDER_WIDTH_THIN))
            .border_color(color(c.dialog_border))
            .bg(color(c.dialog_background))
            .text_color(color(c.dialog_text))
            .typography(tokens::TYPOGRAPHY_BODY)
            .child(
                DialogTitle::new()
                    .flex_none()
                    .typography(tokens::TYPOGRAPHY_TITLE)
                    .text_color(color(c.dialog_title))
                    .child(self.title.clone()),
            )
            .when(scrolls, |popup| {
                popup.child(
                    div()
                        .id("dialog-body")
                        .flex()
                        .flex_col()
                        .gap(px(tokens::SPACE_4))
                        .min_h_0()
                        .overflow_y_scroll()
                        .children(
                            self.description
                                .map(|description| DialogDescription::new().child(description)),
                        )
                        .children(self.body),
                )
            })
            .when(!self.actions.is_empty(), |popup| {
                popup.child(
                    div()
                        .flex()
                        .flex_none()
                        .justify_end()
                        .gap(px(tokens::SPACE_2))
                        .children(self.actions),
                )
            })
            // GPUI cannot scale what it has laid out, so of the fade and the slight scale the
            // dialog comes in with, the fade is what it does.
            .with_animation("dialog-popup", entrance(), |popup, fade| {
                popup
                    .opacity(fade)
                    .shadow(fading_shadow(tokens::SHADOW_OVERLAY, fade))
            });
        let scrim = DialogBackdrop::new()
            .size_full()
            .bg(color(c.scrim))
            .with_animation("dialog-scrim", entrance(), |scrim, fade| {
                scrim.opacity(fade)
            });
        let on_close = self.on_close;
        DialogHost::new(cx)
            .focus_handle(handle)
            .accessibility_label(self.title)
            .close_on_escape(self.dismissible)
            .close_on_backdrop_press(self.dismissible)
            // Enter is for the button that has the focus; the dialog has no answer of its own.
            .on_ok(|_, _, _| false)
            .on_open_change(move |open, _, window, cx| {
                if !open && let Some(on_close) = &on_close {
                    on_close(&(), window, cx);
                }
            })
            // Never closer than this to an edge of the window.
            .p(margin)
            .backdrop(scrim)
            .popup(popup)
            .into_any_element()
    }
}

// ---------------------------------------------------------------- toast

/// The clock of a toast, kept from frame to frame.
#[derive(Default)]
struct ToastTimer {
    /// Whether this showing of the toast has started its clock, so that the frames that
    /// follow do not start it again.
    started: bool,
    task: Option<Task<()>>,
    on_close: Option<CloseHandler>,
}

/// A short message about what just happened, which leaves on its own. It does not close
/// itself: `open` decides, and `on_close` says when its time is up or its action was chosen.
/// It sits at the bottom of the window, over everything else, wherever it is put in the view.
#[derive(IntoElement)]
pub struct Toast {
    id: ElementId,
    message: SharedString,
    open: bool,
    on_close: Option<CloseHandler>,
    action: Option<(SharedString, ClickHandler)>,
    duration: Duration,
}

impl Toast {
    pub fn new(id: impl Into<ElementId>, message: impl Into<SharedString>) -> Self {
        Self {
            id: id.into(),
            message: message.into(),
            open: false,
            on_close: None,
            action: None,
            duration: tokens::MOTION_DURATION_TOAST,
        }
    }

    pub fn open(mut self, open: bool) -> Self {
        self.open = open;
        self
    }

    /// Called when the toast has been shown for its duration, and after its action.
    pub fn on_close(mut self, handler: impl Fn(&(), &mut Window, &mut App) + 'static) -> Self {
        self.on_close = Some(Rc::new(handler));
        self
    }

    /// One thing to do about the message, such as "Undo". Choosing it also closes the toast.
    pub fn action(
        mut self,
        label: impl Into<SharedString>,
        handler: impl Fn(&ClickEvent, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.action = Some((label.into(), Rc::new(handler)));
        self
    }

    /// How long the toast stays. `motion.duration.toast` unless set; zero keeps it until it
    /// is closed.
    pub fn duration(mut self, duration: Duration) -> Self {
        self.duration = duration;
        self
    }
}

impl RenderOnce for Toast {
    fn render(self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let c = palette(cx);
        let timer =
            window.use_keyed_state((self.id.clone(), "timer"), cx, |_, _| ToastTimer::default());
        let (open, duration) = (self.open, self.duration);
        timer.update(cx, |timer, cx| {
            // The handler is new every frame; the clock calls the latest.
            timer.on_close = self.on_close.clone();
            if !open {
                timer.started = false;
                timer.task = None;
            } else if !timer.started {
                timer.started = true;
                timer.task = (!duration.is_zero()).then(|| {
                    cx.spawn_in(window, async move |timer, cx| {
                        cx.background_executor().timer(duration).await;
                        let _ = timer.update_in(cx, |timer, window, cx| {
                            if let Some(on_close) = timer.on_close.clone() {
                                on_close(&(), window, cx);
                            }
                        });
                    })
                });
            }
        });
        if !open {
            return closed();
        }

        let action = self.action.map(|(label, handler)| {
            let id: ElementId = (self.id.clone(), "action").into();
            let focus = focus_handle(&id, window, cx);
            let focused = focus.is_focused(window);
            let on_close = self.on_close.clone();
            let target = px(tokens::POINTER.target_min);
            div()
                .id(id)
                .role(Role::Button)
                .aria_label(label.clone())
                .track_focus(&focus.tab_index(0).tab_stop(true))
                .flex()
                .flex_none()
                .items_center()
                .justify_center()
                .min_w(target)
                .min_h(target)
                .rounded(px(tokens::RADIUS_SM))
                .typography(tokens::TYPOGRAPHY_LABEL)
                .whitespace_nowrap()
                .text_color(color(c.toast_action))
                .on_mouse_down(MouseButton::Left, |_, window, _| window.prevent_default())
                .on_click(move |event, window, cx| {
                    handler(event, window, cx);
                    if let Some(on_close) = &on_close {
                        on_close(&(), window, cx);
                    }
                })
                .when(focused, |action| action.focus_ring_style(window, cx))
                .child(label)
        });
        let surface = div()
            .id(self.id)
            // A status: read out when it appears, without taking the focus.
            .role(Role::Status)
            .aria_label(self.message.clone())
            // What the toast covers is the toast's; the rest of the window stays in reach.
            .occlude()
            .flex()
            .items_center()
            .gap(px(tokens::SPACE_4))
            .max_w(px(tokens::POINTER.toast))
            .py(px(tokens::SPACE_3))
            .px(px(tokens::SPACE_4))
            .rounded(px(tokens::RADIUS_MD))
            .bg(color(c.toast_background))
            .child(
                div()
                    .flex_1()
                    .min_w_0()
                    .typography(tokens::TYPOGRAPHY_DETAIL)
                    .text_color(color(c.toast_text))
                    .child(self.message),
            )
            .children(action)
            .with_animation("toast", entrance(), |surface, fade| {
                surface
                    // Up into place by `space.2`.
                    .top(px(tokens::SPACE_2 * (1.0 - fade)))
                    .opacity(fade)
                    .shadow(fading_shadow(tokens::SHADOW_RAISED, fade))
            });
        let viewport = window.viewport_size();
        deferred(
            anchored().position(point(px(0.0), px(0.0))).child(
                // The size of the window, to put the toast at the bottom center of it,
                // `space.4` from the edges. It takes no presses itself.
                div()
                    .absolute()
                    .top_0()
                    .left_0()
                    .w(viewport.width)
                    .h(viewport.height)
                    .flex()
                    .items_end()
                    .justify_center()
                    .p(px(tokens::SPACE_4))
                    .child(surface),
            ),
        )
        .with_priority(TOAST_PRIORITY)
        .into_any_element()
    }
}

// ---------------------------------------------------------------- tooltip

/// The side of the control a tooltip shows on. It goes to the other side when it does not
/// fit.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum TooltipPlacement {
    #[default]
    Top,
    Bottom,
}

/// What a tooltip knows from frame to frame.
#[derive(Default)]
struct TooltipState {
    hovered: bool,
    /// The pointer has rested on the control for the delay.
    rested: bool,
    /// A press or Escape hid the tooltip. It stays hidden until the pointer and the focus
    /// have both left the control.
    dismissed: bool,
    delay: Option<Task<()>>,
    /// Where the control was last drawn, which is where the tooltip is placed.
    bounds: Rc<Cell<Bounds<Pixels>>>,
}

/// Names a control when the pointer rests on it or the keyboard focuses it. The tooltip holds
/// nothing that can be pressed, and it is not the control's name: give the control a label of
/// its own.
pub fn tooltip(
    id: impl Into<ElementId>,
    label: impl Into<SharedString>,
    child: impl IntoElement,
) -> Tooltip {
    Tooltip {
        id: id.into(),
        label: label.into(),
        shortcut: None,
        placement: TooltipPlacement::default(),
        child: child.into_any_element(),
        pinned: false,
    }
}

/// What [`tooltip`] returns: the control, and the tooltip that shows with it. GPUI Base's
/// positioner places the tooltip and keeps it inside the window.
#[derive(IntoElement)]
pub struct Tooltip {
    id: ElementId,
    label: SharedString,
    shortcut: Option<SharedString>,
    placement: TooltipPlacement,
    child: AnyElement,
    pinned: bool,
}

impl Tooltip {
    /// A key hint shown after the label, such as "⌘B".
    pub fn shortcut(mut self, shortcut: impl Into<SharedString>) -> Self {
        self.shortcut = Some(shortcut.into());
        self
    }

    pub fn placement(mut self, placement: TooltipPlacement) -> Self {
        self.placement = placement;
        self
    }

    /// Shows the tooltip whatever the pointer does, for a screenshot of the design preview.
    pub(crate) fn pinned(mut self, pinned: bool) -> Self {
        self.pinned = pinned;
        self
    }
}

impl RenderOnce for Tooltip {
    fn render(self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let c = palette(cx);
        let state = window.use_keyed_state(self.id.clone(), cx, |_, _| TooltipState::default());
        // Not a stop of its own: it is here to tell whether the focus is on the control inside.
        let focus = focus_handle(&(self.id.clone(), "focus").into(), window, cx);
        // At once when the keyboard brought the focus; a click that left it there says nothing.
        let focused = focus.contains_focused(window, cx) && window.last_input_was_keyboard();
        let (visible, bounds) = state.update(cx, |state, _| {
            if !state.hovered && !focused {
                state.dismissed = false;
            }
            (
                !state.dismissed && (state.rested || focused),
                state.bounds.clone(),
            )
        });
        let visible = visible || self.pinned;

        let wrapper = div()
            .id(self.id)
            .track_focus(&focus)
            .flex()
            .flex_none()
            .on_hover({
                let state = state.clone();
                move |hovered, window, cx| {
                    let hovered = *hovered;
                    state.update(cx, |state, cx| {
                        state.hovered = hovered;
                        state.rested = false;
                        state.delay = hovered.then(|| {
                            cx.spawn_in(window, async move |state, cx| {
                                cx.background_executor()
                                    .timer(tokens::MOTION_DURATION_TOOLTIP_DELAY)
                                    .await;
                                let _ = state.update_in(cx, |state, _, cx| {
                                    state.rested = true;
                                    cx.notify();
                                });
                            })
                        });
                        cx.notify();
                    });
                }
            })
            // Before the control hears of the press, which it may keep to itself.
            .capture_any_mouse_down({
                let state = state.clone();
                move |_, _, cx| {
                    state.update(cx, |state, cx| {
                        state.dismissed = true;
                        state.delay = None;
                        cx.notify();
                    });
                }
            })
            .child(self.child)
            .on_prepaint({
                let bounds = bounds.clone();
                move |drawn, window, _| {
                    // The tooltip was placed before the control was laid out. When the control
                    // has moved since, as when the view scrolls, place it again.
                    if bounds.replace(drawn) != drawn && visible {
                        window.request_animation_frame();
                    }
                }
            });
        if !visible {
            return wrapper;
        }

        let hairline = px(tokens::BORDER_WIDTH_THIN);
        let popup = TooltipPopup::new("tooltip")
            .flex()
            .items_center()
            .gap(px(tokens::SPACE_2))
            .py(px(tokens::SPACE_1))
            .px(px(tokens::SPACE_2))
            .rounded(px(tokens::RADIUS_SM))
            .bg(color(c.tooltip_background))
            .text_color(color(c.tooltip_text))
            .typography(tokens::TYPOGRAPHY_FOOTNOTE)
            .whitespace_nowrap()
            .child(self.label)
            .children(self.shortcut.map(|shortcut| {
                // A box of its own, outlined in the color of the text.
                div()
                    .px(px(tokens::SPACE_1))
                    .rounded(px(tokens::RADIUS_SM))
                    .border(hairline)
                    .border_color(color(c.tooltip_text))
                    .child(shortcut)
            }));
        let gap = px(tokens::SPACE_1);
        let placed = Positioner::side(bounds.get())
            .placement(match self.placement {
                TooltipPlacement::Top => Placement::Top,
                TooltipPlacement::Bottom => Placement::Bottom,
            })
            .offset(gap)
            .margin(gap)
            .child(popup);
        // Escape hides the tooltip wherever the focus is, so it is heard at the window.
        let escape = canvas(|_, _, _| {}, {
            let state = state.downgrade();
            move |_, _, window, _| {
                window.on_key_event(move |event: &KeyDownEvent, phase, _, cx| {
                    if phase == DispatchPhase::Capture && event.keystroke.key == "escape" {
                        let _ = state.update(cx, |state, cx| {
                            state.dismissed = true;
                            cx.notify();
                        });
                    }
                });
            }
        })
        .absolute()
        .size_0();
        wrapper
            .child(escape)
            .child(deferred(placed).with_priority(TOOLTIP_PRIORITY))
    }
}
