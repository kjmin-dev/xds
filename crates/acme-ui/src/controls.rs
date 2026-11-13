//! Selection controls, and the pieces a list is made of.
//!
//! The switch and the checkbox come from GPUI Component, which gives them focus and keyboard
//! handling; `set_mode` points their colors at the tokens. The rest are drawn here.

use std::rc::Rc;

use acme_tokens as tokens;
use gpui_kit::component::{checkbox::Checkbox, switch::Switch};
use gpui_kit::prelude::FluentBuilder;
use gpui_kit::{
    AnyElement, App, ClickEvent, ElementId, InteractiveElement, IntoElement, ParentElement,
    RenderOnce, SharedString, StatefulInteractiveElement, Styled, Window, div, px, relative,
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

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum AvatarSize {
    Sm,
    #[default]
    Md,
    Lg,
}

/// The first letter of the first `count` words: "Ada Lovelace" gives "AL".
pub fn initials(name: &str, count: usize) -> String {
    name.split_whitespace()
        .take(count)
        .filter_map(|word| word.chars().next())
        .flat_map(char::to_uppercase)
        .collect()
}

/// Stands for a person or a team by their initials. The small size has room for one letter.
#[derive(IntoElement)]
pub struct Avatar {
    name: SharedString,
    size: AvatarSize,
}

impl Avatar {
    pub fn new(name: impl Into<SharedString>) -> Self {
        Self {
            name: name.into(),
            size: AvatarSize::default(),
        }
    }

    pub fn size(mut self, size: AvatarSize) -> Self {
        self.size = size;
        self
    }
}

impl RenderOnce for Avatar {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let c = palette(cx);
        let (diameter, style, letters) = match self.size {
            AvatarSize::Sm => (tokens::POINTER.avatar_sm, tokens::TYPOGRAPHY_FOOTNOTE, 1),
            AvatarSize::Md => (tokens::POINTER.avatar_md, tokens::TYPOGRAPHY_LABEL, 2),
            AvatarSize::Lg => (tokens::POINTER.avatar_lg, tokens::TYPOGRAPHY_BODY_STRONG, 2),
        };
        div()
            .flex()
            .flex_none()
            .items_center()
            .justify_center()
            .size(px(diameter))
            .rounded_full()
            .bg(color(c.avatar_background))
            .text_color(color(c.avatar_text))
            .typography(style)
            .child(initials(&self.name, letters))
    }
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

type ClickHandler = Rc<dyn Fn(&ClickEvent, &mut Window, &mut App)>;

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
            on_click: None,
        }
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
        div()
            .id(self.id)
            .flex()
            .items_center()
            .gap(px(tokens::SPACE_3))
            .w_full()
            .min_h(px(tokens::POINTER.list_row))
            .px(px(tokens::SPACE_4))
            .py(px(tokens::SPACE_2))
            .children(self.leading)
            .child(
                div()
                    .flex_1()
                    .flex()
                    .flex_col()
                    .gap(px(tokens::SPACE_0_5))
                    .child(
                        div()
                            .typography(tokens::TYPOGRAPHY_BODY)
                            .text_color(color(title_color))
                            .child(self.title),
                    )
                    .children(self.description.map(|description| {
                        div()
                            .typography(tokens::TYPOGRAPHY_DETAIL)
                            .text_color(color(c.text_secondary))
                            .child(description)
                    })),
            )
            .children(self.trailing)
            .when(self.chevron, |row| {
                row.child(
                    div()
                        .flex_none()
                        .typography(tokens::TYPOGRAPHY_BODY)
                        .text_color(color(c.text_tertiary))
                        .child("›"),
                )
            })
            .when_some(on_click, |row, on_click| {
                row.hover(|row| row.bg(color(c.list_row_background_hover)))
                    .active(|row| row.bg(color(c.list_row_background_pressed)))
                    .on_click(move |event, window, cx| on_click(event, window, cx))
            })
    }
}

#[cfg(test)]
mod tests {
    use super::initials;

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
