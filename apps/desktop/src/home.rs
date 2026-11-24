//! The first window of the app. Replace it with your own.

use acme_ui::{
    Badge, BadgeTone, ButtonVariant, ControlSize, DesignPreview, TextTone, TextVariant, button,
    card, color, palette, text, theme,
};
use gpui_kit::{
    App, AppContext as _, Bounds, Context, IntoElement, ParentElement as _, Render, Styled as _,
    Window, WindowBounds, WindowOptions, div, px, size,
};

pub struct Home;

impl Home {
    pub fn open(cx: &mut App) {
        let options = WindowOptions {
            window_bounds: Some(WindowBounds::Windowed(Bounds::centered(
                None,
                size(px(560.0), px(360.0)),
                cx,
            ))),
            ..Default::default()
        };
        gpui_kit::open_window(options, cx, |_, cx| cx.new(|_| Self))
            .expect("the home window could not open");
        cx.activate(true);
    }
}

impl Render for Home {
    fn render(&mut self, _window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let t = theme(cx);
        let colors = palette(cx);
        div()
            .size_full()
            .flex()
            .flex_col()
            .gap(px(t.space.s6))
            .p(px(t.space.s6))
            .bg(color(colors.background_base))
            .text_color(color(colors.text_primary))
            .child(text("Acme").variant(TextVariant::Display))
            .child(
                card(cx)
                    .child(
                        div()
                            .flex()
                            .items_center()
                            .justify_between()
                            .child(text("Your app starts here").variant(TextVariant::Heading))
                            .child(Badge::new("GPUI").tone(BadgeTone::Accent)),
                    )
                    .child(
                        text(
                            "This window is apps/desktop/src/home.rs. Build it from the \
                             components in the acme-ui crate.",
                        )
                        .variant(TextVariant::Body)
                        .tone(TextTone::Secondary),
                    )
                    .child(
                        div().flex().child(
                            button("open-design-preview", "Open the design preview")
                                .variant(ButtonVariant::Primary)
                                .control_size(ControlSize::Md)
                                .on_click(|_, _, cx| DesignPreview::open(cx)),
                        ),
                    ),
            )
    }
}
