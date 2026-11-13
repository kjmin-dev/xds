//! The Acme desktop app.
//!
//!   acme [--light | --dark]            the app
//!   acme --design [--light | --dark]   the design preview: every token and component
//!
//! Without `--light` or `--dark` the app follows the system appearance.

mod home;

use std::time::Duration;

use gpui_kit::assets::Assets;
use gpui_kit::{KeyBinding, actions};

use crate::home::Home;

actions!(acme, [Quit]);

struct Options {
    /// Open the design preview instead of the app.
    design: bool,
    mode: Option<acme_tokens::Mode>,
    /// Quit after this long. For smoke tests.
    exit_after: Option<Duration>,
}

impl Options {
    fn from_env() -> Self {
        let args: Vec<String> = std::env::args().skip(1).collect();
        let has = |flag: &str| args.iter().any(|arg| arg == flag);
        let exit_after = args
            .iter()
            .position(|arg| arg == "--exit-after")
            .and_then(|index| args.get(index + 1))
            .and_then(|seconds| seconds.parse().ok())
            .map(Duration::from_secs_f64);
        let mode = if has("--light") {
            Some(acme_tokens::Mode::Light)
        } else if has("--dark") {
            Some(acme_tokens::Mode::Dark)
        } else {
            None
        };
        Self {
            design: has("--design"),
            mode,
            exit_after,
        }
    }
}

fn main() {
    let options = Options::from_env();

    gpui_kit::application().with_assets(Assets).run(move |cx| {
        acme_ui::init(cx);
        cx.bind_keys([KeyBinding::new("cmd-q", Quit, None)]);
        cx.on_action(|_: &Quit, cx| cx.quit());

        if let Some(mode) = options.mode {
            acme_ui::set_mode(mode, cx);
        }
        if options.design {
            acme_ui::DesignPreview::open(cx);
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
