# Contributing

## Setup

Install [mise](https://mise.jdx.dev) to set up the toolchain and run the test suite:

```sh
mise install
mise run check
```

`mise run check` runs the same checks as CI, so make sure it passes locally before opening a pull request. The GPUI desktop checks require macOS, and the Kotlin checks download Gradle and the required Android SDK components on their first run.

## Guidelines for changes

- After editing tokens, run `mise run tokens` and commit the generated files along with your changes. CI fails if the generated output is out of date.
- Keep the component set in sync across all clients. If you add a component, variant, or tone, add it under the same name to all four libraries (`packages/ui`, `packages/ui-native`, `crates/acme-ui`, and `kotlin/ui`) as well as each client's design preview. TopBar, TabBar, and BottomSheet are only implemented on the two touch clients, and Tooltip and Sidebar only on the two pointer clients (web and GPUI).
- Define component colors as tokens rather than hardcoding values. Each component reads its colors from a dedicated group in `color.light.json` and `color.dark.json`, and every foreground/background pairing it renders must be registered in `tools/design-build/src/contrast.ts`.
- Do not edit theme color values by hand. `design/themes/indigo.json` is the reference theme, and the other themes are generated from it by `tools/design-build/src/make-theme.ts`. The script preserves the relative luminance of each step so that all contrast ratios hold. To add a new theme, run that script with a target hue; the test suite checks every file in `design/themes` against all contrast pairings.
- Mark files and code blocks that apply only to specific clients. `template.json` maps paths to clients, and shared files wrap client-specific lines in `@if <names>` and `@endif` comments, where a name is a target or a shared unit such as `js-workspace`. `xds create` relies on both mechanisms (see [docs/cli.md](docs/cli.md) for details), and `cargo test --package xds` scaffolds a project for each client to verify that no unexpected files or markers remain.
- Check the design preview manually. Because there is no automated screenshot comparison, open the preview in both light and dark modes on every client you touch. For Compose, `mise run //kotlin:render` renders preview images to `kotlin/build/preview`.

## Style

Run `mise run fmt` to format the codebase: it applies oxlint's fixes, then formats with oxfmt and rustfmt. Keep code comments focused on why something is done a certain way rather than restating what the code does.
