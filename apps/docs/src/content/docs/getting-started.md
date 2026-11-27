---
title: Getting started
description: Scaffold a new xds project, run it locally, and customize the design tokens.
---

xds is a project template rather than a package dependency. Running `xds create` copies the design tokens, component libraries, and a starter app for each selected target into a repository you own and edit directly.

## Create a project

No prebuilt release of `xds` has been published yet. Until the first release is out, build it from a local checkout:

```sh
git clone https://github.com/kjmin-dev/xds && cd xds
mise install
cargo install --path cli
```

Then scaffold a new project:

```sh
xds create my-app
```

By default, `xds` prompts for a project name, the targets to include, and a color theme, starting from the defaults (the directory name, `web-react`, and `indigo`). Pass flags to skip the prompts, or pass `--yes` to accept all defaults:

```sh
xds create my-app --name orbit --targets web-react,kotlin-compose --theme ocean
xds create my-app --yes
```

Available targets:

| Target | Runs on | Stack |
| --- | --- | --- |
| `web-react` | Browsers | React 19, Vite, Tailwind v4, Zag.js |
| `web-solid` | Browsers | SolidJS 2 (release candidate), Vite, Tailwind v4, Zag.js |
| `web-vue` | Browsers | Vue 3, Vite, Tailwind v4, Zag.js |
| `web-svelte` | Browsers | Svelte 5, Vite, Tailwind v4, Zag.js |
| `desktop-electron` | macOS, Windows, Linux | Electron (wraps a web target) |
| `desktop-tauri` | macOS, Windows, Linux | Tauri 2 (wraps a web target) |
| `desktop-gpui` | macOS | Rust, GPUI, GPUI Component |
| `mobile-react-native` | iOS, Android | React Native, Expo |
| `kotlin-compose` | Android, iOS, desktop | Kotlin Multiplatform, Compose Multiplatform |
| `dart-flutter` | Android, iOS | Dart, Flutter widgets |

Multiple web targets can live in the same project; each gets its own app directory, dev port, and `mise` alias.

## Run it

The project uses [mise](https://mise.jdx.dev) to pin toolchains and run tasks:

```sh
cd my-app
mise trust
mise install
mise run fmt
mise run check
```

Run `mise run fmt` once before the first `mise run check`—replacing the placeholder name changes line lengths and import order. When a web target is included, `mise run check` runs component behavior tests in Google Chrome, so Chrome needs to be installed. When `mobile-react-native` is included, it also bundles the Expo app for iOS and Android and verifies that native packages match the Expo SDK versions. `xds create` prints the dev command for each selected target (for example, `mise run //web:dev`).

Every starter app includes a design preview screen showing all tokens and components together.

## Customize the design

1. Edit the token JSON files under `design/tokens`, or switch themes with `xds theme <name>`.
2. Run `mise run tokens` to regenerate the platform files. The build fails if a token is malformed or if any color pairing drops below its WCAG contrast threshold.
3. Commit both the token sources and the generated files.

## Next steps

- [Commands](/cli/commands/) — full reference for `xds` commands and flags.
- [How it fits together](/design-system/overview/) — token tiers, platform architecture, and the component contract.
- [Colors](/tokens/colors/) — all semantic and component color tokens in light and dark modes.
