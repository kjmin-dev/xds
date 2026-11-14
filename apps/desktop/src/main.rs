//! The Acme desktop app.
//!
//!   acme [--light | --dark]            the app
//!   acme --design [--light | --dark]   the design preview: every token and component
//!   acme --design --scroll <pixels>    the preview, scrolled down, for scripted screenshots
//!   acme --design --open <overlay>     the preview with `menu`, `dialog`, `toast` or `tooltip`
//!                                      open, for scripted screenshots of what only opens on a
//!                                      press or a hover
//!
//! Without `--light` or `--dark` the app follows the system appearance.

mod home;

use std::time::Duration;

use acme_ui::PreviewOverlay;
use gpui_kit::assets::Assets;
use gpui_kit::{KeyBinding, actions};

use crate::home::Home;

actions!(acme, [Quit]);

struct Options {
    /// Open the design preview instead of the app.
    design: bool,
    mode: Option<acme_tokens::Mode>,
    /// How far down the design preview starts.
    scroll: f32,
    /// An overlay the design preview starts with open.
    open: Option<PreviewOverlay>,
    /// Quit after this long. For smoke tests.
    exit_after: Option<Duration>,
}

impl Options {
    fn from_env() -> Result<Self, String> {
        let args: Vec<String> = std::env::args().skip(1).collect();
        let has = |flag: &str| args.iter().any(|arg| arg == flag);
        let value = |flag: &str| {
            args.iter()
                .position(|arg| arg == flag)
                .and_then(|index| args.get(index + 1))
        };
        let exit_after = value("--exit-after")
            .and_then(|seconds| seconds.parse().ok())
            .map(Duration::from_secs_f64);
        let scroll = value("--scroll")
            .and_then(|pixels| pixels.parse().ok())
            .unwrap_or(0.0);
        let open = value("--open").map(|name| name.parse()).transpose()?;
        let mode = if has("--light") {
            Some(acme_tokens::Mode::Light)
        } else if has("--dark") {
            Some(acme_tokens::Mode::Dark)
        } else {
            None
        };
        Ok(Self {
            // An overlay only opens in the preview, so asking for one asks for the preview.
            design: has("--design") || open.is_some(),
            mode,
            scroll,
            open,
            exit_after,
        })
    }
}

fn main() {
    let options = match Options::from_env() {
        Ok(options) => options,
        Err(message) => {
            eprintln!("acme: {message}");
            std::process::exit(2);
        }
    };

    gpui_kit::application().with_assets(Assets).run(move |cx| {
        acme_ui::init(cx);
        cx.bind_keys([KeyBinding::new("cmd-q", Quit, None)]);
        cx.on_action(|_: &Quit, cx| cx.quit());

        if let Some(mode) = options.mode {
            acme_ui::set_mode(mode, cx);
        }
        if options.design {
            acme_ui::DesignPreview::open_scripted(options.scroll, options.open, cx);
        } else {
            Home::open(cx);
        }

        if let Some(exit_after) = options.exit_after {
            cx.spawn(async move |cx| {
                cx.background_executor().timer(exit_after).await;
                cx.update(|cx| cx.quit());
            })
            .detach();
        }
    });
}
