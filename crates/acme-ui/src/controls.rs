//! Selection controls, and the pieces a list is made of.
//!
//! The switch and the checkbox come from GPUI Component, which gives them focus and keyboard
//! handling; `set_mode` points their colors at the tokens. The rest are drawn here.

use std::rc::Rc;

use acme_tokens as tokens;
use gpui_kit::component::{Icon, Sizable, checkbox::Checkbox, spinner::Spinner, switch::Switch};
use gpui_kit::prelude::FluentBuilder;
use gpui_kit::{
    AnyElement, App, BoxShadow, ClickEvent, Div, ElementId, ImageSource, InteractiveElement,
    IntoElement, ObjectFit, ParentElement, RenderOnce, Role, SharedString,
    StatefulInteractiveElement, Styled, StyledImage, Window, div, img, point, px, relative,
};

use crate::components::{ControlSize, shadow};
use crate::theme::{TypographyExt, color, palette};

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

// ---------------------------------------------------------------- segmented control

type SelectHandler = Rc<dyn Fn(&usize, &mut Window, &mut App)>;

/// A choice between a few views or modes, all visible at once. The selected segment is outlined
/// as well as filled, so the choice does not depend on telling two greys apart.
#[derive(IntoElement)]
pub struct SegmentedControl {
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
            id: id.into(),
            labels: labels.into_iter().map(Into::into).collect(),
            selected: 0,
            on_change: None,
        }
    }

    /// The index of the selected segment.
    pub fn selected(mut self, index: usize) -> Self {
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

impl RenderOnce for SegmentedControl {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        const INSET: f32 = 2.0;
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
                .px(px(tokens::SPACE_4))
                .rounded(px(tokens::RADIUS_MD - INSET))
                // Present on every segment, and transparent until selected, so selecting does
                // not move the text.
                .border(px(tokens::BORDER_WIDTH_THIN))
                .border_color(gpui_kit::transparent_black())
                .typography(tokens::TYPOGRAPHY_LABEL)
                .text_color(color(c.segmented_text))
                .when(selected, |segment| {
                    segment
                        .bg(color(c.segmented_selected_background))
                        .border_color(color(c.segmented_selected_border))
                        // Raised: a faint shadow under the hairline sets it apart from the track.
                        .shadow(shadow(tokens::SHADOW_SUBTLE))
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
            .h(ControlSize::Md.height())
            .p(px(INSET))
            .rounded(px(tokens::RADIUS_MD))
            .bg(color(c.segmented_track))
            .children(segments)
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
    fn diameter(self) -> f32 {
        match self {
            AvatarSize::Sm => tokens::POINTER.avatar_sm,
            AvatarSize::Md => tokens::POINTER.avatar_md,
            AvatarSize::Lg => tokens::POINTER.avatar_lg,
            AvatarSize::Xl => tokens::POINTER.avatar_xl,
        }
    }

    /// The type role of the initials.
    fn typography(self) -> tokens::Typography {
        match self {
            AvatarSize::Sm => tokens::TYPOGRAPHY_FOOTNOTE,
            AvatarSize::Md => tokens::TYPOGRAPHY_LABEL,
            AvatarSize::Lg => tokens::TYPOGRAPHY_BODY_STRONG,
            AvatarSize::Xl => tokens::TYPOGRAPHY_TITLE,
        }
    }

    /// The small size has room for one letter.
    fn letters(self) -> usize {
        match self {
            AvatarSize::Sm => 1,
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
fn avatar_circle(size: AvatarSize, ring: bool, c: &tokens::Colors) -> Div {
    div()
        .relative()
        .flex()
        .flex_none()
        .items_center()
        .justify_center()
        .size(px(size.diameter()))
        .rounded_full()
        .typography(size.typography())
        .when(ring, |circle| {
            // A shadow that only spreads: a ring outside the circle that takes no room.
            circle.shadow(vec![BoxShadow {
                color: color(c.avatar_ring),
                offset: point(px(0.0), px(0.0)),
                blur_radius: px(0.0),
                spread_radius: px(tokens::BORDER_WIDTH_THICK),
                inset: false,
            }])
        })
}

/// Stands for a person or a team by a picture, or by their initials when there is none. The
/// small size has room for one letter.
#[derive(IntoElement)]
pub struct Avatar {
    name: SharedString,
    size: AvatarSize,
    src: Option<ImageSource>,
    ring: bool,
}

impl Avatar {
    pub fn new(name: impl Into<SharedString>) -> Self {
        Self {
            name: name.into(),
            size: AvatarSize::default(),
            src: None,
            ring: false,
        }
    }

    pub fn size(mut self, size: AvatarSize) -> Self {
        self.size = size;
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

impl RenderOnce for Avatar {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let c = palette(cx);
        avatar_circle(self.size, self.ring, c)
            .bg(color(c.avatar_background))
            .text_color(color(c.avatar_text))
            .child(initials(&self.name, self.size.letters()))
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
    id: ElementId,
    people: Vec<Person>,
    max: usize,
    size: AvatarSize,
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
            id: id.into(),
            people: people.into_iter().map(Into::into).collect(),
            max: 4,
            size: AvatarSize::default(),
            label: None,
        }
    }

    /// How many avatars to draw before counting the rest. Four unless set.
    pub fn max(mut self, max: usize) -> Self {
        self.max = max;
        self
    }

    pub fn size(mut self, size: AvatarSize) -> Self {
        self.size = size;
        self
    }

    /// Names the stack for assistive technology in place of the list of names.
    pub fn label(mut self, label: impl Into<SharedString>) -> Self {
        self.label = Some(label.into());
        self
    }
}

/// How many people a stack counts instead of drawing.
fn overflow(people: usize, max: usize) -> usize {
    people.saturating_sub(max)
}

impl RenderOnce for AvatarStack {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
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
        let overlap = px(-self.size.diameter() / 4.0);
        let size = self.size;
        let avatars = self
            .people
            .into_iter()
            .take(self.max)
            .map(|person| {
                Avatar {
                    name: person.name,
                    size,
                    src: person.src,
                    ring: true,
                }
                .into_any_element()
            })
            .chain((hidden > 0).then(|| {
                avatar_circle(size, true, c)
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

// ---------------------------------------------------------------- spinner

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum SpinnerSize {
    Sm,
    #[default]
    Md,
    Lg,
}

/// Work of unknown length is going on. It takes the color of the text around it; set another
/// with `.color`. The result is a GPUI Component spinner, which stands still when the system
/// asks for reduced motion, and whose drawing comes from the assets the app registers
/// (`gpui_kit::assets::Assets`).
pub fn spinner(size: SpinnerSize) -> Spinner {
    Spinner::new().with_size(px(match size {
        SpinnerSize::Sm => tokens::POINTER.spinner_sm,
        SpinnerSize::Md => tokens::POINTER.spinner_md,
        SpinnerSize::Lg => tokens::POINTER.spinner_lg,
    }))
}

// ---------------------------------------------------------------- progress bar

/// How far along something is, from 0 to 1. For work of unknown length use a spinner.
#[derive(IntoElement)]
pub struct ProgressBar {
    value: f32,
}

impl ProgressBar {
    pub fn new(value: f32) -> Self {
        Self { value }
    }
}

impl RenderOnce for ProgressBar {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let c = palette(cx);
        div()
            .flex_none()
            .w_full()
            .h(px(tokens::POINTER.progress))
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

// ---------------------------------------------------------------- list row

pub(crate) type ClickHandler = Rc<dyn Fn(&ClickEvent, &mut Window, &mut App)>;

/// One line of a list or a settings view. Separate rows with a divider.
#[derive(IntoElement)]
pub struct ListRow {
    id: ElementId,
    title: SharedString,
    description: Option<SharedString>,
    leading: Option<AnyElement>,
    trailing: Option<AnyElement>,
    chevron: bool,
    disabled: bool,
    selected: bool,
    compact: bool,
    on_click: Option<ClickHandler>,
}

impl ListRow {
    pub fn new(id: impl Into<ElementId>, title: impl Into<SharedString>) -> Self {
        Self {
            id: id.into(),
            title: title.into(),
            description: None,
            leading: None,
            trailing: None,
            chevron: false,
            disabled: false,
            selected: false,
            compact: false,
            on_click: None,
        }
    }

    /// Marks the row as the current choice: the open page of a sidebar, the picked item of a
    /// menu. The title is set heavier as well as the row tinted, so the choice does not
    /// depend on color.
    pub fn selected(mut self, selected: bool) -> Self {
        self.selected = selected;
        self
    }

    /// A lower row with smaller type, for a menu or a sidebar, where many rows share little
    /// room.
    pub fn compact(mut self) -> Self {
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
    pub fn chevron(mut self) -> Self {
        self.chevron = true;
        self
    }

    pub fn disabled(mut self, disabled: bool) -> Self {
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

impl RenderOnce for ListRow {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let c = palette(cx);
        let title_color = if self.disabled {
            c.text_secondary
        } else {
            c.text_primary
        };
        let on_click = self.on_click.filter(|_| !self.disabled);
        let (min_height, padding, title_style, description_style) = if self.compact {
            let title = if self.selected {
                tokens::TYPOGRAPHY_LABEL
            } else {
                tokens::TYPOGRAPHY_DETAIL
            };
            (
                tokens::POINTER.list_row_compact,
                tokens::SPACE_1,
                title,
                tokens::TYPOGRAPHY_FOOTNOTE,
            )
        } else {
            let title = if self.selected {
                tokens::TYPOGRAPHY_BODY_STRONG
            } else {
                tokens::TYPOGRAPHY_BODY
            };
            (
                tokens::POINTER.list_row,
                tokens::SPACE_2,
                title,
                tokens::TYPOGRAPHY_DETAIL,
            )
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
        div()
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
            .gap(px(tokens::SPACE_3))
            .w_full()
            .min_h(px(min_height))
            .px(px(tokens::SPACE_4))
            .py(px(padding))
            .children(self.leading)
            .child(
                div()
                    .flex_1()
                    .flex()
                    .flex_col()
                    .gap(px(tokens::SPACE_0_5))
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
                    icon(tokens::Icon::ChevronRight, IconSize::Sm)
                        .text_color(color(c.text_tertiary)),
                )
            })
            .when_some(on_click, |row, on_click| {
                row.hover(|row| row.bg(color(hover)))
                    .active(|row| row.bg(color(pressed)))
                    .on_click(move |event, window, cx| on_click(event, window, cx))
            })
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
    pub(crate) fn side(self) -> f32 {
        match self {
            IconSize::Xs => tokens::POINTER.icon_xs,
            IconSize::Sm => tokens::POINTER.icon_sm,
            IconSize::Md => tokens::POINTER.icon_md,
            IconSize::Lg => tokens::POINTER.icon_lg,
            IconSize::Xl => tokens::POINTER.icon_xl,
        }
    }
}

/// An icon of the design system. It takes the color of the text around it; set another with
/// `.text_color`.
pub fn icon(icon: tokens::Icon, size: IconSize) -> Icon {
    // The drawing is generated from design/icons, so no asset has to be registered for it.
    Icon::default()
        .data(icon.svg().as_bytes())
        .size(px(size.side()))
        .flex_none()
}

/// The icon with its shapes filled, so that a selected state shows in the form and not in the
/// color alone: a heart that was pressed, a bookmark that is saved. Only for icons made of
/// closed shapes.
pub fn icon_filled(icon: tokens::Icon, size: IconSize) -> Icon {
    Icon::default()
        .data(icon.filled_svg().as_bytes())
        .size(px(size.side()))
        .flex_none()
}

#[cfg(test)]
mod tests {
    use super::{initials, overflow};

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
