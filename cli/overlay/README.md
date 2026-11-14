<!-- @if template -->
<!-- The README of a project made by `xds create`. Files in cli/overlay are laid over the -->
<!-- project root, with the same `@if` blocks and the same renaming as the rest of the template. -->
<!-- @endif -->
# Acme

A single set of design tokens drives a component library for each client, paired with a small app wired up to use it.

| Client | Stack | Components | App |
| --- | --- | --- | --- |
<!-- @if web-react -->
| Web | React 19, Vite, Tailwind v4, HeroUI v3 | `packages/ui` | `apps/web` |
<!-- @endif -->
<!-- @if desktop-gpui -->
| Desktop (macOS) | Rust, GPUI, GPUI Component | `crates/acme-ui` | `apps/desktop` |
<!-- @endif -->
<!-- @if mobile-react-native -->
| Mobile | React Native, Expo | `packages/ui-native` | `apps/mobile` |
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
<!-- @if desktop-gpui -->
| Start the desktop app | `mise run //desktop:dev` |
| Open the desktop design preview | `mise run //desktop:design` |
<!-- @endif -->
<!-- @if mobile-react-native -->
| Start the mobile app | `mise run //mobile:ios` or `mise run //mobile:android` |
<!-- @endif -->
<!-- @if kotlin-compose -->
| Start the Compose desktop app | `mise run //kotlin:desktop` |
| Open the Compose design preview | `mise run //kotlin:design` |
| Install the Android app on a device or emulator | `mise run //kotlin:android` |
<!-- @endif -->
| Regenerate token files | `mise run tokens` |
| Switch the color theme | `mise run theme <name>` (`mise run theme` lists available themes) |
<!-- @if js-workspace rust-workspace -->
| Format the codebase | `mise run fmt` |
<!-- @endif -->
| List all tasks | `mise tasks --all` |

<!-- @if desktop-gpui -->
The desktop app requires macOS.
<!-- @endif -->
<!-- @if mobile-react-native -->
On mobile, use the button on the home screen to open the design preview.
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
packages/ui/            web components
apps/web/               React app
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
