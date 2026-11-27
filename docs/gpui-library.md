# The GPUI library

The xds components for GPUI desktop apps are built as crates for crates.io. They are the same components and tokens that `xds create` copies into a GPUI project, packaged and renamed for apps that do not use the scaffold. The design behind them is in [xds as a library](library.md).

| Crate | Contents |
| --- | --- |
| `xds-ui` | The components, the theme and defaults they draw with (`set_theme`, `set_defaults`) and the design preview. It re-exports `xds-tokens` as `xds_ui::tokens` and the GPUI Kit it is built for as `xds_ui::gpui_kit` |
| `xds-tokens` | The token types (`Theme`, `Colors`, `Sizes` and one struct per group of shared values), `DEFAULT_THEME`, the preset themes in `themes`, and the icons. It has no dependencies |

The crates are built and checked on every change, and the release workflow publishes them to crates.io once their check passes. A version on crates.io is never replaced, only yanked. To try the crates of a commit no release has published, an app builds them with `node crates-io/build.ts` and patches them in (see below), or takes the components through `xds create`.

The GPUI channel has `preview` stability while GPUI is 0.x. crates.io has nothing like npm's dist-tags, so the crates carry the release's version as it is, and a 0.x version already lets a minor release break. GPUI keeps no compatibility between its releases, so each release of `xds-ui` is built for exactly one GPUI Kit, which it asks for with an exact requirement. This release is built for GPUI Kit 0.9.1 (GPUI 0.3.12 and GPUI Component 0.9.1) and Rust 1.100 or later, and checked on macOS, where the desktop target is checked.

```toml
# Cargo.toml of a GPUI app
[dependencies]
xds-ui = "0.1.0"
# The GPUI Kit that this release of xds-ui is built for, exactly: two GPUI Kits in one app do
# not share their types.
gpui-kit = "=0.9.1"
```

An app that names `gpui-kit` itself asks for the same exact version. One that reaches GPUI only through `xds_ui::gpui_kit` needs no line of its own. A newer GPUI Kit comes with a new release of `xds-ui`. Nothing else from xds is required: no token build, no CLI and no styling tool. The components draw on GPUI Component, which `xds-ui` brings. Spinners draw GPUI Component's loader, so the app registers its assets, `gpui_kit::assets::Assets`, as a GPUI Component app does.

## Use the components

Set the components up once with `init`, before the first window opens, then use them in any view:

```rust
use xds_ui::gpui_kit::{self, AppContext as _, Context, IntoElement, ParentElement as _, Render, Window};
use xds_ui::{ButtonVariant, TextVariant, button, text};

struct Home;

impl Render for Home {
    fn render(&mut self, _: &mut Window, _: &mut Context<Self>) -> impl IntoElement {
        gpui_kit::div()
            .child(text("Welcome").variant(TextVariant::Title))
            .child(button("save", "Save").variant(ButtonVariant::Primary))
    }
}

fn main() {
    gpui_kit::application()
        .with_assets(gpui_kit::assets::Assets)
        .run(|cx| {
            xds_ui::init(cx);
            gpui_kit::open_window(Default::default(), cx, |_, cx| cx.new(|_| Home))
                .expect("the window opens");
        });
}
```

`init` sets up GPUI Component and registers the default theme with the app, which it applies to GPUI Component's own theme too. The color mode follows the system's appearance when the app starts. The design preview is `DesignPreview::open(cx)`. It shows every token and component as a scaffolded app's design window does.

## Scrolling

GPUI draws no scrollbar of its own: an element with `overflow_y_scroll` scrolls and shows nothing that says so. The components draw GPUI Component's scrollbar where they scroll (a sidebar's places, a select's list, a dialog's body, and the design preview), with no track and a thumb in the theme's colors: `border.strong` at rest, which stands 3:1 from every surface, and `text.secondary` under the pointer and while it is dragged.

A view of the app that scrolls draws the same scrollbar. Keep the scroll position in a `ScrollHandle`, and put the scrollbar on a frame around the scrolling element, since a scrollbar inside it would scroll away with the content:

```rust
use xds_ui::gpui_kit::component::scroll::ScrollableElement as _;
use xds_ui::gpui_kit::{
    InteractiveElement as _, IntoElement, ParentElement as _, ScrollHandle,
    StatefulInteractiveElement as _, Styled as _, div,
};

fn page(scroll: &ScrollHandle, content: impl IntoElement) -> impl IntoElement {
    div()
        .relative()
        .size_full()
        .child(
            div()
                .id("page")
                .size_full()
                .overflow_y_scroll()
                .track_scroll(scroll)
                .child(content),
        )
        .vertical_scrollbar(scroll)
}
```

The frame takes the place of the scrolling element in the layout. As a flex item it also takes that element's `flex_1()` and `min_h_0()`: without a minimum height of zero, a flex item grows to its content and never scrolls.

When scrollbars show is GPUI Component's setting, which `init` takes from the system: while scrolling where the system hides scrollbars, and under the pointer otherwise. `Theme::set_scrollbar_mode(ScrollbarMode::Always, cx)`, with `xds_ui::gpui_kit::component::{Theme, scroll::ScrollbarMode}`, keeps them in view, and `set_mode` and `set_theme` leave the choice alone.

## Customization

The layers below follow [Customization](library.md#customization). GPUI has no context that reaches a part of a window together with the overlays opened from it: a menu, a select's list or a dialog is drawn after the rest of the window, outside the element that opened it. So the mode, the theme and the defaults are registered with the app and apply to all of it, as GPUI Component's own theme does. Each can change while the app is running, and the windows redraw.

| Layer | In GPUI |
| --- | --- |
| 0. Mode | `set_mode(Mode::Dark, cx)`, with `xds_ui::tokens::Mode`. Without it, the app takes the system's appearance at `init` |
| 1. Preset | `set_theme(&tokens::themes::OCEAN_THEME, cx)`. Presets: `FOREST_THEME`, `INDIGO_THEME` (the default), `OCEAN_THEME`, `PLUM_THEME`, `SUNSET_THEME` |
| 2 to 5. Theme file | Write a [theme file](cli.md#xds-check-theme-file), then run `xds export-theme brand.json --format gpui -o src/brand.rs`. It checks the file like `xds check-theme` and writes `pub const BRAND_THEME: Theme`. Register it as `set_theme(&brand::BRAND_THEME, cx)` |
| 6. Component defaults | `set_defaults(Defaults { button: ButtonDefaults { variant: Some(ButtonVariant::Primary), ..Default::default() }, ..Default::default() }, cx)` gives the components a variant, size, tone, shape, ratio or layout when the app passes none |
| 7. Instance | Every component takes GPUI's `Styled` methods (`.w_full()`, `.mt_4()`, `.text_color(…)`), which go on its root element, or on its surface for an overlay, after the component's own style, and slots where the contract has them (`leading`, `trailing`, `action`) |

```rust
mod brand; // written by `xds export-theme --format gpui`

fn setup(cx: &mut App) {
    xds_ui::init(cx);
    xds_ui::set_theme(&brand::BRAND_THEME, cx);
    xds_ui::set_mode(Mode::Dark, cx);
}
```

A theme is a value of `xds_ui::tokens::Theme`: the colors of both modes (`Colors`), the sizes of both input devices (`Sizes`) and one struct per group of shared values (`SpaceTokens`, `RadiusTokens`, `TypographyTokens`, …). `DEFAULT_THEME` is the library's own. `set_theme` takes a `&'static Theme`, so a theme is a constant, as a preset and what `xds export-theme` writes are. A theme made while the app runs is given a static place once, with `Box::leak`. The components read the theme in effect with `theme(cx)` and `palette(cx)`, which an app's own views can read too: `theme(cx).space.s4`, `palette(cx).text_secondary`. The font families of a theme apply: the components draw text in the first family of the list that GPUI draws, and in the system's UI font when it draws none of them.

### Defaults

```rust
set_defaults(
    Defaults {
        button: ButtonDefaults { size: Some(ControlSize::Lg), ..Default::default() },
        badge: BadgeDefaults { tone: Some(BadgeTone::Accent) },
        ..Default::default()
    },
    cx,
);
```

An option passed to the component wins over the defaults. `set_defaults` replaces the defaults registered before. The defaults apply to the app's own components. The parts a component draws itself, such as a banner's action button or the avatars of a stack, keep their look.

| Component | Options | Set with |
| --- | --- | --- |
| `button`, `icon_button` | `variant`, `size` | `.variant`, `.control_size` |
| `text` | `variant`, `tone` | `.variant`, `.tone` |
| `Badge`, `Banner` | `tone` | `.tone` |
| `Avatar`, `AvatarStack` | `size` | `.avatar_size` |
| `icon` | `size` | `.icon_size` |
| `spinner` | `size` | `.spinner_size` |
| `Skeleton` | `shape` | `.shape` |
| `Thumbnail` | `ratio` | `.ratio` |
| `MediaCard` | `layout` | `.layout` |

A size is set with a method named for the component, because `Styled::size` sets a width and a height.

## How the crates are built and checked

`node crates-io/build.ts` builds the crates into `crates-io/dist`: each as the `.crate` file crates.io takes, and unpacked beside it in `crates-io/dist/unpacked`. It:

- creates a project with `xds create --name xds --targets desktop-gpui`, so the crates are renamed from `acme` to `xds` the way `xds create` renames a project, and fails if `acme` is left in any packaged file;
- adds the preset themes, written as `xds export-theme --format gpui` writes a theme file, as `xds_tokens::themes`;
- gives both crates the release version, the license, the repository, a README, keywords and a category, gives `xds-ui` an exact requirement on the `xds-tokens` of the same release, and leaves the examples and their dev-dependencies out;
- packages both with `cargo package`, which builds each from its packaged sources as crates.io will serve them, against the other as packaged;
- fails unless `xds-ui` asks for exactly the GPUI Kit this repository pins (`gpui-kit = "=0.9.1"` in `Cargo.toml`), and this page tells an app to write the same requirement.

`node crates-io/consumer.ts` (`mise run check:library-gpui`) is the external consumer check for this channel. It runs on macOS, where GPUI draws with Metal. It builds a new crate outside the repository, which has nothing of xds's but its dependency on `xds-ui` at the release version, served from the packaged crates in place of crates.io's (`[patch.crates-io]`), and on the GPUI Kit `xds-ui` is built for. The crate draws every page of the design preview and the preview with each overlay open, off screen, in both modes, with the same program a scaffolded project runs as `cargo run --package <name>-ui --example render_preview`, and compares each picture, pixel by pixel, with a project that `xds create` makes from this repository under the name `xds`. GPUI draws them on a clock that only the program moves, so the same components give the same pictures on the same Mac. The scrollbars, which GPUI Component shows and hides on the real clock, are kept in view for the pictures. The check repeats the comparison with a custom theme ([`npm/web/consumer/brand.json`](../npm/web/consumer/brand.json), which the web library's check uses too). The library's crate registers it with the constant `xds export-theme --format gpui` writes. The scaffolded project draws it with its token build. The check fails if the custom theme changes none of the library's pictures, which would show only that both sides ignore it.

CI runs the check on every change, on macOS. The release workflow builds the crates with the release's own CLI, runs the check, keeps the `.crate` files it checked as the run's `gpui-crates` artifact, and publishes them with `node crates-io/publish.ts`.

## How the crates are published

`node crates-io/publish.ts` publishes `xds-tokens`, then `xds-ui`, with the `CARGO_REGISTRY_TOKEN` secret: an API token of an owner of both crates, scoped to `publish-new` and `publish-update`. cargo uploads only what it packages itself, so the script has cargo package the crates again from the project `build.ts` left in `crates-io/dist/.work`, without building them, and fails unless the files are byte for byte the ones the check consumed. cargo then publishes them and waits until crates.io serves `xds-tokens` before it publishes `xds-ui`, which asks for it. A version crates.io already has is skipped, so a rerun after a partial failure publishes the rest.

With `--dry-run`, which a [rehearsal of the release](cli.md#rehearsing-a-release) passes, nothing is published: cargo goes up to the upload, and crates.io must accept the token for each crate. The script asks crates.io to publish each crate with an empty crate file. crates.io checks the token and its scopes for that crate before it reads the file, so a refused token is answered with an authentication error, and an accepted one with the refusal of the empty file. Nothing can be published that way.

Once both crates exist, crates.io can take them from this repository's release workflow by [trusted publishing](https://rust-lang.github.io/rfcs/3691-trusted-publishing-cratesio.html) instead of a token. That needs the crates to exist first, so the first release publishes with the token.

### Trying crates no release has published

Build them, then point an app at them in its `Cargo.toml`:

```toml
[dependencies]
xds-ui = "0.1.0"
gpui-kit = "=0.9.1"

[patch.crates-io]
xds-ui = { path = "/path/to/xds/crates-io/dist/unpacked/xds-ui-0.1.0" }
xds-tokens = { path = "/path/to/xds/crates-io/dist/unpacked/xds-tokens-0.1.0" }
```
