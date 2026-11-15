# Contributing

## Setup

Install [mise](https://mise.jdx.dev) to set up the toolchain and run the test suite:

```sh
mise install
mise run check
```

`mise run check` runs the same checks as CI, so make sure it passes locally before opening a pull request. The GPUI desktop checks require macOS, the Kotlin checks download Gradle and the required Android SDK components on their first run, and the web components' behavior tests run in the installed Google Chrome.

## Guidelines for changes

- After editing tokens, run `mise run tokens` and commit the generated files along with your changes. CI fails if the generated output is out of date.
- Keep the component set in sync across all clients. If you add a component, variant, or tone, add it under the same name to every library (`packages/ui`, `packages/ui-solid`, `packages/ui-native`, `crates/acme-ui`, and `kotlin/ui`) as well as each client's design preview. TopBar, TabBar, and BottomSheet are only implemented on the two touch clients, and Tooltip and Sidebar only on the pointer clients (the two web clients and GPUI).
- The web apps share one design preview, written as typed data in `packages/ui-core/src/preview` and drawn by a small renderer in each web library. Show a web component there once, not in each app, and add it to each renderer's `COMPONENTS`; [its README](packages/ui-core/src/preview/README.md) explains the data and what a renderer for another framework needs.
- On the web, the libraries share `packages/ui-core` and must look and behave the same. The React and the Solid library take their classes and CSS from `packages/ui-core`, which imports no framework so that a library for another framework can reuse it. Their overlays and composite controls take their behavior from Zag.js; their selection controls and fields are native inputs. Change the look of a web component in `packages/ui-core`, and compare the design previews of every web library in light and dark mode.
- Define component colors as tokens rather than hardcoding values. Each component reads its colors from a dedicated group in `color.light.json` and `color.dark.json`, and every foreground/background pairing it renders must be registered in `tools/design-build/src/contrast.ts`.
- Do not edit theme color values by hand. `design/themes/indigo.json` is the reference theme, and the other themes are generated from it by `tools/design-build/src/make-theme.ts`. The script preserves the relative luminance of each step so that all contrast ratios hold. To add a new theme, run that script with a target hue; the test suite checks every file in `design/themes` against all contrast pairings.
- Mark files and code blocks that apply only to specific clients. `template.json` maps paths to clients, and shared files wrap client-specific lines in `@if <names>` and `@endif` comments, where a name is a target or a shared unit such as `js-workspace`. `xds create` relies on both mechanisms (see [docs/cli.md](docs/cli.md) for details), and `cargo test --package xds` scaffolds a project for each client to verify that no unexpected files or markers remain.
- Check the design preview manually. Because there is no screenshot comparison in CI, open the preview in both light and dark modes on every client you touch. For Compose, `mise run //kotlin:render` renders preview images to `kotlin/build/preview`. On the web, `mise run compare:previews` compares the React and Solid previews pixel by pixel, every section and every open overlay, in both modes.
- Test how an interactive web component behaves. `packages/ui-core/test/behavior.ts` checks the keyboard, focus, and ARIA state of each one in headless Chrome, against the screens in `scenarios.ts`, which are written as data like the design preview, and every web library draws those screens with its own components and runs the checks from its `test/behavior.test.tsx`. When you add or change one, add to both files in `packages/ui-core/test`.
- Upgrade TypeScript and tsrs together. Type checking on the command line (`mise run check:js` and each package's `typecheck` script) and oxlint's type-aware rules run on tsrs, an experimental Rust port of TypeScript 7.1 built from one TypeScript commit. Editors keep TypeScript's own language server; the root `typescript` package is the version to point them at. Both are exact pins in the catalog in `pnpm-workspace.yaml`: when you move `typescript`, move `tsrs` to the release that ports the same version (`pnpm view tsrs@<release> tsrs.typescriptVersion` shows the version a release ports). `mise run check:js` fails while the two differ.

## Style

Run `mise run fmt` to format the codebase: it applies oxlint's fixes, then formats with oxfmt and rustfmt. Keep code comments focused on why something is done a certain way rather than restating what the code does.
