//! Draws the design preview off screen into PNG files: every page of it, one window height at a
//! time, and the preview with each overlay open, in both color modes.
//!
//! ```text
//! cargo run --package acme-ui --example render_preview -- <directory>
//! ```
//!
//! The pictures are `page-<n>-<mode>.png` and `<overlay>-<mode>.png`. GPUI draws them with the
//! Metal renderer a window uses, at the main display's scale, on a clock that only moves when
//! this program moves it. So two builds of the components that draw the same pixels give the
//! same files on the same Mac, which is what the library's consumer check compares
//! (`crates-io/consumer.ts` in the xds repository).
//!
//! The scrollbars are the exception: GPUI Component shows and hides them on the real clock. The
//! pictures keep them in view, so that a scrollbar is in a picture or not by what the components
//! draw, never by how long the picture took.

use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Duration;

use acme_tokens::Mode;
use acme_ui::{DesignPreview, PreviewOverlay};
use gpui_kit::component::Theme;
use gpui_kit::component::scroll::ScrollbarMode;
use gpui_kit::{
    AnyWindowHandle, AppContext as _, Bounds, Entity, VisualTestAppContext, WindowBounds,
    WindowOptions, point, px, size,
};

/// The size the desktop app opens the preview at.
const WIDTH: f32 = 960.0;
const HEIGHT: f32 = 820.0;

/// How far the clock moves between two frames, and how many frames a picture waits. A second
/// is enough for the page to be laid out and scrolled, its pictures to be decoded and an
/// overlay's entrance to finish. What repeats, a spinner or a skeleton's pulse, is caught at the
/// same moment of its cycle on every run.
const FRAME: Duration = Duration::from_millis(16);
const FRAMES: usize = 64;

fn main() {
    let Some(out) = std::env::args().nth(1).map(PathBuf::from) else {
        eprintln!("usage: render_preview <directory>");
        std::process::exit(2);
    };
    std::fs::create_dir_all(&out).expect("the output directory could not be made");

    let mut cx = VisualTestAppContext::with_asset_source(
        gpui_kit::platform::current_platform(false),
        Arc::new(gpui_kit::assets::Assets),
    );
    cx.update(|cx| {
        acme_ui::init(cx);
        Theme::set_scrollbar_mode(ScrollbarMode::Always, cx);
    });

    let mut written = 0;
    for (mode, name) in [(Mode::Light, "light"), (Mode::Dark, "dark")] {
        cx.update(|cx| acme_ui::set_mode(mode, cx));

        let (window, preview) = open(&mut cx, 0.0, None);
        settle(&mut cx, window);
        let height = cx.read(|cx| f32::from(preview.read(cx).scroll_height()));
        let pages = (height / HEIGHT).ceil() as usize + 1;
        for page in 0..pages {
            // The last page stops where the page does.
            let offset = (page as f32 * HEIGHT).min(height);
            cx.update(|cx| preview.update(cx, |preview, cx| preview.scroll_to(offset, cx)));
            settle(&mut cx, window);
            save(
                &mut cx,
                window,
                &out,
                &format!("page-{:02}-{name}", page + 1),
            );
            written += 1;
        }
        close(&mut cx, window);

        for overlay in PreviewOverlay::ALL {
            let (window, _) = open(&mut cx, 0.0, Some(overlay));
            settle(&mut cx, window);
            save(&mut cx, window, &out, &format!("{}-{name}", overlay.name()));
            written += 1;
            close(&mut cx, window);
        }
    }
    println!("Drew {written} pictures into {}", out.display());
}

/// A window off screen, at the size the app opens the preview at, with the preview as a script
/// asks for it.
fn open(
    cx: &mut VisualTestAppContext,
    offset: f32,
    overlay: Option<PreviewOverlay>,
) -> (AnyWindowHandle, Entity<DesignPreview>) {
    let options = WindowOptions {
        window_bounds: Some(WindowBounds::Windowed(Bounds {
            origin: point(px(-10_000.0), px(-10_000.0)),
            size: size(px(WIDTH), px(HEIGHT)),
        })),
        focus: false,
        show: true,
        ..Default::default()
    };
    cx.update(|cx| {
        gpui_kit::open_window(options, cx, |window, cx| {
            cx.new(|cx| DesignPreview::scripted(offset, overlay, window, cx))
        })
        .expect("the preview window could not open")
    })
}

/// Draws frame after frame on the program's clock.
fn settle(cx: &mut VisualTestAppContext, window: AnyWindowHandle) {
    for _ in 0..FRAMES {
        cx.update_window(window, |_, window, cx| {
            window.refresh();
            window.draw(cx).clear(cx);
        })
        .expect("the preview window is open");
        cx.advance_clock(FRAME);
        cx.run_until_parked();
    }
}

fn save(cx: &mut VisualTestAppContext, window: AnyWindowHandle, out: &Path, name: &str) {
    let picture = cx
        .capture_screenshot(window)
        .expect("the window could not be drawn into a picture");
    picture
        .save(out.join(format!("{name}.png")))
        .expect("the picture could not be written");
}

fn close(cx: &mut VisualTestAppContext, window: AnyWindowHandle) {
    cx.update_window(window, |_, window, _| window.remove_window())
        .expect("the preview window is open");
    cx.run_until_parked();
}
