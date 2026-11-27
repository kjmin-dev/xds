//! How a pointer moves between the places of an app: the sidebar, the desktop counterpart of
//! the tab bar on touch.
//!
//! GPUI Component has a sidebar of its own, with groups, menus and a collapsed mode, but it
//! takes its look from its own theme and its rows are not this design system's list rows. The
//! sidebar is drawn here, from list rows and tooltips.

use std::rc::Rc;
use std::sync::Arc;

use acme_tokens as tokens;
use gpui_kit::component::scroll::ScrollableElement as _;
use gpui_kit::prelude::FluentBuilder as _;
use gpui_kit::{
    AnyElement, App, ElementId, FontFeatures, InteractiveElement as _, IntoElement,
    ParentElement as _, Refineable as _, RenderOnce, Role, ScrollHandle, SharedString,
    StatefulInteractiveElement as _, StyleRefinement, Styled, Window, div, px,
};

use crate::components::count_text;
use crate::controls::{IconSize, ListRow, ValueHandler, icon, icon_filled};
use crate::overlays::tooltip;
use crate::theme::{TypographyExt as _, color, palette, theme};

/// One place of a [`Sidebar`].
pub struct SidebarItem {
    value: SharedString,
    label: SharedString,
    icon: tokens::Icon,
    count: i64,
}

impl SidebarItem {
    /// The icon stands for the place on its own when the sidebar is collapsed. Choose one made
    /// of closed shapes: it is drawn filled for the current place.
    pub fn new(
        value: impl Into<SharedString>,
        label: impl Into<SharedString>,
        icon: tokens::Icon,
    ) -> Self {
        Self {
            value: value.into(),
            label: label.into(),
            icon,
            count: 0,
        }
    }

    /// How many things the place holds, at the end of its row: a count of things, not of
    /// unread ones, so it is a quiet number and not a badge. Zero shows nothing.
    pub const fn count(mut self, count: i64) -> Self {
        self.count = count;
        self
    }
}

/// A group of places of a [`Sidebar`], under an optional title.
pub struct SidebarSection {
    title: Option<SharedString>,
    items: Vec<SidebarItem>,
}

impl SidebarSection {
    pub fn new(items: impl IntoIterator<Item = SidebarItem>) -> Self {
        Self {
            title: None,
            items: items.into_iter().collect(),
        }
    }

    /// A title over the places. A collapsed sidebar has no room for it, and parts its sections
    /// with hairlines instead.
    pub fn title(mut self, title: impl Into<SharedString>) -> Self {
        self.title = Some(title.into());
        self
    }
}

/// The top-level places of an app where a pointer is used. Each place is a compact list row;
/// the current one is selected and its icon filled. Collapsed, the sidebar is a rail of icons,
/// each named by a tooltip. Give it the height of the window: its places scroll when they do
/// not fit, and the header and the footer stay.
#[derive(IntoElement)]
pub struct Sidebar {
    style: StyleRefinement,
    id: ElementId,
    label: SharedString,
    sections: Vec<SidebarSection>,
    value: Option<SharedString>,
    collapsed: bool,
    header: Option<AnyElement>,
    footer: Option<AnyElement>,
    on_change: Option<ValueHandler>,
}

impl Sidebar {
    /// The label names the sidebar for assistive technology.
    pub fn new(
        id: impl Into<ElementId>,
        label: impl Into<SharedString>,
        sections: impl IntoIterator<Item = SidebarSection>,
    ) -> Self {
        Self {
            style: StyleRefinement::default(),
            id: id.into(),
            label: label.into(),
            sections: sections.into_iter().collect(),
            value: None,
            collapsed: false,
            header: None,
            footer: None,
            on_change: None,
        }
    }

    /// The value of the current place.
    pub fn value(mut self, value: impl Into<SharedString>) -> Self {
        self.value = Some(value.into());
        self
    }

    /// Shows the places as icons only, at the width of a rail.
    pub const fn collapsed(mut self, collapsed: bool) -> Self {
        self.collapsed = collapsed;
        self
    }

    /// At the top, such as the app's name. It is drawn when collapsed too, so it should fit
    /// the rail then.
    pub fn header(mut self, element: impl IntoElement) -> Self {
        self.header = Some(element.into_any_element());
        self
    }

    /// At the bottom, such as the account. As with the header, it should fit the rail when the
    /// sidebar is collapsed.
    pub fn footer(mut self, element: impl IntoElement) -> Self {
        self.footer = Some(element.into_any_element());
        self
    }

    /// Called with the value of the place that was chosen. The sidebar does not move by itself:
    /// the handler decides. Takes a reference, like the handlers of GPUI Component, so
    /// `cx.listener` fits.
    pub fn on_change(
        mut self,
        handler: impl Fn(&SharedString, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_change = Some(Rc::new(handler));
        self
    }
}

impl Sidebar {
    fn draw(self, window: &mut Window, cx: &mut App) -> impl IntoElement + Styled {
        let t = theme(cx);
        let c = palette(cx);
        let collapsed = self.collapsed;
        let hairline = px(t.border.width_thin);
        let inset = px(t.space.s2);
        let sections = self
            .sections
            .into_iter()
            .enumerate()
            .map(|(index, section)| {
                let heading = if collapsed {
                    // The rail has no room for words; a line still parts the groups.
                    (index > 0).then(|| {
                        div()
                            .mx(inset)
                            .mb(inset)
                            .h(hairline)
                            .bg(color(c.sidebar_border))
                    })
                } else {
                    section.title.map(|title| {
                        div()
                            .px(inset)
                            .pb(px(t.space.s1))
                            .typography(t.typography.footnote)
                            .text_color(color(c.sidebar_section_title))
                            .truncate()
                            .child(title)
                    })
                };
                let rows = section.items.into_iter().map(|item| {
                    let current = self.value.as_ref() == Some(&item.value);
                    // Filled as well as tinted, so the current place does not show by color
                    // alone.
                    let glyph = if current {
                        icon_filled(item.icon)
                            .icon_size(IconSize::Md)
                            .text_color(color(c.text_primary))
                    } else {
                        icon(item.icon)
                            .icon_size(IconSize::Md)
                            .text_color(color(c.text_secondary))
                    };
                    let on_change = self.on_change.clone();
                    let value = item.value.clone();
                    let row =
                        ListRow::new((self.id.clone(), item.value.clone()), item.label.clone())
                            .compact()
                            .selected(current)
                            .leading(glyph)
                            .rounded(px(t.radius.md))
                            .on_click(move |_, window, cx| {
                                if let Some(on_change) = &on_change {
                                    on_change(&value, window, cx);
                                }
                            });
                    if collapsed {
                        tooltip(
                            (self.id.clone(), format!("tooltip-{}", item.value)),
                            item.label,
                            row.title_hidden(),
                        )
                        .into_any_element()
                    } else if item.count > 0 {
                        row.trailing(
                            div()
                                .flex_none()
                                .typography(t.typography.detail)
                                .text_color(color(c.text_secondary))
                                // Figures of one width, so the counts line up.
                                .font_features(FontFeatures(Arc::new(vec![("tnum".into(), 1)])))
                                .child(count_text(item.count, 99)),
                        )
                        .into_any_element()
                    } else {
                        row.into_any_element()
                    }
                });
                // The hairline of the rail parts the groups by itself, so it needs less room.
                let gap = if collapsed { t.space.s2 } else { t.space.s4 };
                div()
                    .flex()
                    .flex_col()
                    .when(index > 0, |section| section.mt(px(gap)))
                    .children(heading)
                    .children(rows)
            })
            .collect::<Vec<_>>();
        let width = if collapsed {
            t.pointer.sidebar_rail
        } else {
            t.pointer.sidebar
        };
        // A scrolling area clips what it holds, and the focus ring of a row lies outside the
        // row. The area is this much larger on every side, and pulled back by as much, so the
        // ring has room and the rows stay where they were.
        let room = px(t.space.s1);
        let scroll = window
            .use_keyed_state((self.id.clone(), "scroll"), cx, |_, _| ScrollHandle::new())
            .read(cx)
            .clone();
        div()
            .id(self.id.clone())
            .role(Role::Navigation)
            .aria_label(self.label)
            .flex()
            .flex_col()
            .flex_none()
            .gap(inset)
            .w(px(width))
            .h_full()
            .p(inset)
            .bg(color(c.sidebar_background))
            .border_r(hairline)
            .border_color(color(c.sidebar_border))
            .children(
                self.header
                    .map(|header| div().flex().flex_none().child(header)),
            )
            .child(
                // The frame takes the area's place in the sidebar and holds the scrollbar, which
                // would scroll away with the places if it were inside the area. On the right the
                // area reaches the sidebar's edge, so the scrollbar lies in the padding there.
                div()
                    .relative()
                    .flex_1()
                    .min_h_0()
                    .flex()
                    .flex_col()
                    .m(-room)
                    .mr(-inset)
                    .child(
                        div()
                            .id((self.id, "places"))
                            .flex_1()
                            .min_h_0()
                            .flex()
                            .flex_col()
                            .p(room)
                            .pr(inset)
                            .overflow_y_scroll()
                            .track_scroll(&scroll)
                            .children(sections),
                    )
                    .vertical_scrollbar(&scroll),
            )
            .children(
                self.footer
                    .map(|footer| div().flex().flex_none().child(footer)),
            )
    }
}

impl Styled for Sidebar {
    fn style(&mut self) -> &mut StyleRefinement {
        &mut self.style
    }
}

impl RenderOnce for Sidebar {
    fn render(mut self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let style = std::mem::take(&mut self.style);
        let mut root = self.draw(window, cx);
        root.style().refine(&style);
        root
    }
}
