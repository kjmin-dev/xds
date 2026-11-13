//! The first window of the app. Replace it with your own.

use acme_tokens as tokens;
use acme_ui::{
    Badge, BadgeTone, ButtonVariant, ControlSize, DesignPreview, button, card, color, palette, text,
};
use gpui_kit::{
    App, AppContext, Bounds, Context, IntoElement, ParentElement, Render, Styled, Window,
    WindowBounds, WindowOptions, div, px, size,
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
        gpui_kit::open_window(options, cx, |_, cx| cx.new(|_| Home))
            .expect("the home window could not open");
        cx.activate(true);
    }
}

impl Render for Home {
    fn render(&mut self, _window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let colors = palette(cx);
        div()
            .size_full()
            .flex()
            .flex_col()
            .gap(px(tokens::SPACE_6))
            .p(px(tokens::SPACE_6))
            .bg(color(colors.background_base))
            .text_color(color(colors.text_primary))
            .child(text("Acme", tokens::TYPOGRAPHY_DISPLAY))
            .child(
                card(cx)
                    .child(
                        div()
                            .flex()
                            .items_center()
                            .justify_between()
                            .child(text("Your app starts here", tokens::TYPOGRAPHY_HEADING))
                            .child(Badge::new("GPUI").tone(BadgeTone::Accent)),
                    )
                    .child(
                        text(
                            "This window is apps/desktop/src/home.rs. Build it from the \
                             components in the acme-ui crate.",
                            tokens::TYPOGRAPHY_BODY,
                        )
                        .text_color(color(colors.text_secondary)),
                    )
                    .child(
                        div().flex().child(
                            button(
                                "open-design-preview",
                                "Open the design preview",
                                ButtonVariant::Primary,
                                ControlSize::Md,
                            )
                            .on_click(|_, _, cx| DesignPreview::open(cx)),
                        ),
                    ),
            )
    }
}
