// A release build on Windows would otherwise open a console window next to the app.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{WebviewUrl, WebviewWindowBuilder, webview::NewWindowResponse};

fn main() {
    // `--path /design?theme=dark#buttons` opens the web app at that address, as a browser would.
    let path = std::env::args()
        .skip_while(|argument| argument != "--path")
        .nth(1)
        .unwrap_or_default();
    tauri::Builder::default()
        .setup(move |app| {
            WebviewWindowBuilder::new(
                app,
                "main",
                WebviewUrl::App(path.trim_start_matches('/').into()),
            )
            .title("Acme")
            .inner_size(1200.0, 800.0)
            // Only the app's own pages: a link to a website must not replace the app.
            .on_navigation(|url| {
                matches!(
                    (url.scheme(), url.host_str()),
                    ("tauri", Some("localhost")) | ("http" | "https", Some("tauri.localhost"))
                ) || (cfg!(debug_assertions)
                    && url.scheme() == "http"
                    && url.host_str() == Some("localhost")
                    && url.port() == Some(5177))
            })
            .on_new_window(|_, _| NewWindowResponse::Deny)
            .build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("the app starts");
}
