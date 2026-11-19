<!-- @if template -->
<!-- The README of a project made by `xds create`. Files in cli/overlay are laid over the -->
<!-- project root, with the same `@if` blocks and the same renaming as the rest of the template. -->
<!-- @endif -->
# Acme

A single set of design tokens drives a component library for each client, paired with a small app wired up to use it.

| Client | Stack | Components | App |
| --- | --- | --- | --- |
<!-- @if web-react -->
| Web | React 19, Vite, Tailwind v4, Zag.js | `packages/ui`, `packages/ui-core` | `apps/web` |
<!-- @endif -->
<!-- @if web-solid -->
| Web | SolidJS 2 (release candidate), Vite, Tailwind v4, Zag.js | `packages/ui-solid`, `packages/ui-core` | `apps/web-solid` |
<!-- @endif -->
<!-- @if web-vue -->
| Web | Vue 3, Vite, Tailwind v4, Zag.js | `packages/ui-vue`, `packages/ui-core` | `apps/web-vue` |
<!-- @endif -->
<!-- @if web-svelte -->
| Web | Svelte 5, Vite, Tailwind v4, Zag.js | `packages/ui-svelte`, `packages/ui-core` | `apps/web-svelte` |
<!-- @endif -->
<!-- @if desktop-electron -->
| Desktop (Windows, macOS, Linux) | Electron, Chromium | Web app selected at creation | `apps/desktop-electron` |
<!-- @endif -->
<!-- @if desktop-tauri -->
| Desktop (Windows, macOS, Linux) | Tauri 2, system WebView | Web app selected at creation | `apps/desktop-tauri` |
<!-- @endif -->
<!-- @if desktop-gpui -->
| Desktop (macOS) | Rust, GPUI, GPUI Component | `crates/acme-ui` | `apps/desktop` |
<!-- @endif -->
<!-- @if mobile-react-native -->
| Mobile | React Native, Expo | `packages/ui-native` | `apps/mobile` |
<!-- @endif -->
<!-- @if dart-flutter -->
| Mobile | Dart, Flutter widgets | `flutter/ui` | `flutter/app` |
<!-- @endif -->
<!-- @if kotlin-compose -->
| Android, iOS, desktop | Kotlin, Compose Multiplatform | `kotlin/ui` | `kotlin/androidApp`, `kotlin/iosApp`, `kotlin/desktopApp` |
<!-- @endif -->

See the [design system documentation](docs/design-system.md) for details on how the tokens and components are structured.

## Getting started

Install [mise](https://mise.jdx.dev) to set up the pinned toolchains:

```sh
mise trust
mise install
mise run check          # everything CI runs
```

The first run resolves dependencies and generates the lockfiles. Commit them to version control.

| Task | Command |
| --- | --- |
<!-- @if web-react -->
| Start the web app | `mise run //web:dev`, then open `http://localhost:5173` |
| Open the web design preview | Visit `http://localhost:5173/design` |
<!-- @endif -->
<!-- @if web-solid -->
| Start the Solid web app | `mise run //web-solid:dev`, then open `http://localhost:5174` |
| Open the Solid design preview | Visit `http://localhost:5174/design` |
<!-- @endif -->
<!-- @if web-vue -->
| Start the Vue web app | `mise run //web-vue:dev`, then open `http://localhost:5175` |
| Open the Vue design preview | Visit `http://localhost:5175/design` |
<!-- @endif -->
<!-- @if web-svelte -->
| Start the Svelte web app | `mise run //web-svelte:dev`, then open `http://localhost:5176` |
| Open the Svelte design preview | Visit `http://localhost:5176/design` |
<!-- @endif -->
<!-- @if desktop-electron -->
| Run the Electron shell | `mise run //desktop-electron:dev` |
<!-- @endif -->
<!-- @if desktop-tauri -->
| Run the Tauri shell | `mise run //desktop-tauri:dev` |
<!-- @endif -->
<!-- @if desktop-gpui -->
| Start the desktop app | `mise run //desktop:dev` |
| Open the desktop design preview | `mise run //desktop:design` |
<!-- @endif -->
<!-- @if mobile-react-native -->
| Start the mobile app | `mise run //mobile:ios` or `mise run //mobile:android` |
| Check the mobile app against its Expo SDK | `mise run //mobile:check`, `mise run //mobile:bundle` |
<!-- @endif -->
<!-- @if dart-flutter -->
| Start the Flutter app | `mise run //flutter:ios` or `mise run //flutter:android` |
| Verify Flutter or render its preview | `mise run //flutter:check`, `mise run //flutter:render` |
<!-- @endif -->
<!-- @if kotlin-compose -->
| Start the Compose desktop app | `mise run //kotlin:desktop` |
| Open the Compose design preview | `mise run //kotlin:design` |
| Install the Android app on a device or emulator | `mise run //kotlin:android` |
<!-- @endif -->
| Regenerate token files | `mise run tokens` |
| Switch the color theme | `mise run theme <name>` (`mise run theme` lists available themes) |
<!-- @if js-workspace rust-workspace dart-flutter -->
| Format the codebase | `mise run fmt` |
<!-- @endif -->
| List all tasks | `mise tasks --all` |

<!-- @if js-workspace -->
On the command line, `mise run check:js` type-checks and runs oxlint's type-aware rules with [tsrs](https://github.com/oxc-project/tsrs), an experimental Rust port of TypeScript 7.1, pinned to an exact release. Editors keep TypeScript's own language server; point them at the root `typescript` package, the version tsrs is held to. Upgrade the two together in the catalog in `pnpm-workspace.yaml`, taking the tsrs release that ports the new TypeScript version (`pnpm view tsrs@<release> tsrs.typescriptVersion` shows the version a release ports); `mise run check:js` fails while they differ.

<!-- @endif -->
<!-- @if web-vue -->
The Vue packages check their `.vue` files with vue-tsc instead, on [typescript-native-bridge](https://www.npmjs.com/package/typescript-native-bridge), which keeps the TypeScript 6 API that vue-tsc and Vite's compiler for `.vue` files need over the TypeScript 7 checker.
<!-- @endif -->
<!-- @if web-svelte -->
The Svelte packages type-check with svelte-check, on the same TypeScript 7 (`@typescript/native` in the catalog). `.pnpmfile.cjs` gives svelte-check the TypeScript 6 it reads the components with; it goes once svelte-check runs on TypeScript 7 alone.

<!-- @endif -->
<!-- @if ui-core -->
The tests of the web components run in Google Chrome, which `mise run check` needs installed.
<!-- @endif -->
<!-- @if desktop-tauri -->
Install the [Tauri build prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS. Build the native installer with `mise run //desktop-tauri:build`.
<!-- @endif -->
<!-- @if desktop-electron -->
Package the Electron app for this OS with `mise run //desktop-electron:build`.
<!-- @endif -->
<!-- @if desktop-gpui -->
The GPUI app requires macOS.
<!-- @endif -->
<!-- @if mobile-react-native -->
On mobile, use the button on the home screen to open the design preview.

`mise run check:js` also checks the mobile app against its Expo SDK: `mise run //mobile:check` fails when a native package is not at the version the installed SDK expects, and `mise run //mobile:bundle` bundles the app for iOS and Android. Add native packages with `pnpm exec expo install` in `apps/mobile`; AGENTS.md explains how to move to the next SDK.
<!-- @endif -->

## Changing the design

1. Edit the token JSON files in `design/tokens`.
2. Run `mise run tokens` to regenerate the platform files. The build fails if a token is malformed or if any color pairing falls below its contrast threshold.
3. Commit both the updated token JSON files and the generated output.

## Layout

```text
design/tokens/          the source of truth
design/themes/          color themes: an accent ramp and a neutral ramp each
tools/design-build/     tokens to platform files, plus the contrast check
<!-- @if js-tokens -->
packages/tokens/        generated CSS and TypeScript
<!-- @endif -->
<!-- @if web-react -->
packages/ui/            React web components
apps/web/               React app
<!-- @endif -->
<!-- @if ui-core -->
packages/ui-core/       behavior tests of the web components; prop types, classes, and CSS of the Zag.js ones
<!-- @endif -->
<!-- @if web-solid -->
packages/ui-solid/      Solid web components
apps/web-solid/         Solid app
<!-- @endif -->
<!-- @if web-vue -->
packages/ui-vue/        Vue web components
apps/web-vue/           Vue app
<!-- @endif -->
<!-- @if web-svelte -->
packages/ui-svelte/     Svelte web components
apps/web-svelte/        Svelte app
<!-- @endif -->
<!-- @if mobile-react-native -->
packages/ui-native/     React Native components
apps/mobile/            Expo app
<!-- @endif -->
<!-- @if desktop-gpui -->
crates/acme-tokens/     generated Rust
crates/acme-ui/         GPUI components
apps/desktop/           GPUI app
<!-- @endif -->
<!-- @if kotlin-compose -->
kotlin/                 Compose Multiplatform: generated Kotlin, components, and the apps
<!-- @endif -->
```

## Adding a client later

This project was scaffolded with [xds](https://github.com/kjmin-dev/xds), which recorded the project name, selected client stacks, and active theme in `.xds.json`. To add another stack later:

```sh
xds list                # the stacks that exist
xds add <target>
```
