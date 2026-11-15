# Working in this repository

This repository is the xds template: a single set of design tokens, component libraries for seven clients (four of them for the web), a sample app for each client, and the `xds` CLI that scaffolds a new project with a chosen subset of clients. `acme` is the placeholder name replaced by `xds create`, so keep it in all package names, identifiers, and file paths.

## Where things are

| Path | Contents |
| --- | --- |
| `design/tokens` | Design tokens in DTCG format (the single source of truth) |
| `design/themes` | Color themes, each defining an accent ramp and a neutral ramp |
| `design/components.json` | Component contract: variants, sizes, tones, and the source file for each client |
| `tools/design-build` | Token compiler and WCAG contrast checker |
| `packages/ui`, `packages/ui-solid`, `packages/ui-vue`, `packages/ui-svelte`, `packages/ui-native`, `crates/acme-ui`, `kotlin/ui` | Component libraries for the web (React, Solid, Vue, and Svelte), React Native, GPUI, and Compose |
| `packages/ui-core` | What the web libraries share: the prop types, class recipes, and stylesheet of their components, the DOM helpers their behavior needs, the web design preview as data (`src/preview`), and the behavior tests that each of them runs. It imports no framework |
| `apps/*`, `kotlin/*App` | Client apps, each with a design preview screen |
| `cli`, `template.json` | The `xds` CLI and the manifest mapping repository paths to client targets |

## Rules

- Design tokens are the source of truth. Never edit generated files (`packages/tokens/src/generated`, `crates/acme-tokens/src/generated.rs`, `kotlin/ui/src/commonMain/kotlin/acme/tokens/Tokens.kt`). Edit the JSON files in `design/tokens`, run `mise run tokens`, and commit both the token sources and the generated files.
- Components must take all colors, sizes, and spacing from tokens. Do not hardcode hex colors in components, and prefer tokens over raw pixel values. Component-specific colors belong in that component's group in both `color.light.json` and `color.dark.json`.
- Every foreground and background color pair rendered together by a component must have an entry in `tools/design-build/src/contrast.ts`. The token build fails if any pairing falls below its required contrast ratio.
- Every component, variant, size, and tone must exist across all clients under the same name and appear in each client's design preview. TopBar, TabBar, and BottomSheet are touch-only exceptions and exist only on React Native and Compose. Tooltip and Sidebar are pointer-only exceptions and exist only on the web targets (React, Solid, Vue, and Svelte) and GPUI. Update `design/components.json` in the same change. A difference between clients that is not in the contract's names (an option only some clients have, a part the platform draws, a different presentation for touch) is listed in that component's `differences`.
- The web apps share one design preview, written once as typed data in `packages/ui-core/src/preview` and drawn by each web library's renderer (`src/preview.tsx`, `src/preview.ts` in Vue, or the `src/preview` directory in Svelte, on the library's `./preview` subpath). Add a web component to the preview there, not in an app: put its props in `components.ts`, show it in `sections.ts`, and add it to the `COMPONENTS` of each renderer, which fails to typecheck until it is there and takes every prop the data passes. Its `README.md` says how a renderer works.
- On the web, the libraries share `packages/ui-core` and must look and behave the same. A component in any of them takes its classes and its CSS from `packages/ui-core`; the overlays and the composite controls take their behavior from Zag.js, and the selection controls and fields are native inputs. Change a component's look or a behavior that does not depend on the framework in `packages/ui-core`, then check every web library against it in both color modes. `packages/ui-core` keeps one copy of what the web libraries share, including the DOM helpers their behavior needs, so it never imports a framework, and its CSS selects on its own part classes, native pseudo-classes, `aria-*` attributes, and Zag's state attributes.
- Do not edit theme color ramps by hand. `design/themes/indigo.json` is the reference theme; generate new themes with `node tools/design-build/src/make-theme.ts <name> --hue <0-360>`.
- Every top-level path in the repository must be accounted for in `template.json` (under a target, a shared group, `common`, or `exclude`). Target-specific lines in shared files must be wrapped in `@if <names>` and `@endif` comments. A name is a target id or a shared unit from `template.json`; use the unit (`@if js-workspace`) when the lines serve every target that requires it, so that a new target gets them too. Use `@if template` for lines needed only in this template repository.
- Machine-written JSON files under `design/` must be formatted with `JSON.stringify(value, null, 2)` followed by a trailing newline.
- Write comments that explain why, not what.
- Fix what the linter reports. Where a rule is wrong for one deliberate line, disable it there with `// oxlint-disable-next-line <plugin>/<rule> -- <why>`; a directive that no longer suppresses anything fails `mise run check:js`.
- On the command line, type checking (each package's `typecheck` script, `tsrs --noEmit`) and oxlint's type-aware rules (`tsrs-lint`) run on tsrs, an experimental Rust port of TypeScript 7.1. Editors keep TypeScript's own language server; the root `typescript` package is the version to point them at, and the one tsrs is held to. tsrs is built from one TypeScript commit, so the pnpm catalog pins both exactly and they move together: to upgrade TypeScript, change both, taking the tsrs release that ports the new version (`pnpm view tsrs@<release> tsrs.typescriptVersion` shows the version a release ports). `mise run check:js` fails while they differ. Build scripts do not type-check; `check:js` does it once, before the web builds. The Vue packages are the exception: `.vue` files need vue-tsc (`vue-tsc --noEmit`), which runs on the TypeScript 6 API that typescript-native-bridge keeps over the TypeScript 7 checker; those packages take that `typescript` from the `vue` catalog, and Vite's compiler for `.vue` files needs it too.
- The Svelte packages (`packages/ui-svelte`, `apps/web-svelte`) type-check with svelte-check instead, whose `--tsgo-experimental-api` checks them with TypeScript 7, found as `@typescript/native` at the catalog's `typescript` version. svelte-check still reads `.svelte` files with TypeScript 6's JavaScript API, so `.pnpmfile.cjs` gives it a TypeScript 6 of its own; delete the hook and the alias once svelte-check runs on TypeScript 7 alone. Upgrade svelte-check together with TypeScript. oxlint lints the script of a `.svelte` file, but not with its type-aware rules, and leaves unused names there to svelte-check (`noUnusedLocals`).
- Add a native package to the Expo app with `pnpm exec expo install <package>` in `apps/mobile`, not `pnpm add`, so that it gets the version the Expo SDK expects. See "Moving to the next Expo SDK" below.

## Commands

| Task | Command |
| --- | --- |
| Run all CI checks | `mise run check` |
| Regenerate token files | `mise run tokens` |
| Verify generated files are up to date | `mise run check:generated` |
| Format code | `mise run fmt` |
| TypeScript lint (type-aware rules on tsrs-lint), typecheck (tsrs, and svelte-check for Svelte), tests, web builds, and the Expo app's SDK check and bundle | `mise run check:js` |
| Web component behavior tests, in headless Google Chrome | `pnpm --filter @acme/ui test` (React), `pnpm --filter @acme/ui-solid test` (Solid), `pnpm --filter @acme/ui-vue test` (Vue), `pnpm --filter @acme/ui-svelte test` (Svelte) |
| Compare the web apps' design previews pixel by pixel, in headless Google Chrome | `mise run compare:previews` |
| Rust lint and tests | `mise run check:rust`, `mise run check:desktop` (macOS), `mise run check:cli` |
| Kotlin tests and builds | `mise run //kotlin:check` |
| Check the Expo app's native packages against its SDK, and bundle it for iOS and Android | `mise run //mobile:check`, `mise run //mobile:bundle` |
| Run the CLI from source | `mise run xds -- list` |
| List or apply a theme | `mise run theme`, `mise run theme ocean` |

Use `xds tokens`, `xds components`, `xds contrast`, and `xds doctor` to inspect the design system instead of reading JSON files by hand; pass `--json` for structured output. See `docs/cli.md` for details.

## Checking a UI change

There is no automated visual regression test, so inspect the design preview in both light and dark modes on every client you modify. On the web, `mise run compare:previews` starts every web app and compares their previews with each other pixel by pixel: every section and every `?open=` overlay, at 1280 and 390 px, in both modes. A difference is a library drawing a component differently, since every app draws the same data. It is not part of `mise run check`.

How the interactive web components behave (keyboard, focus, and ARIA state) is tested in the Google Chrome installed on the machine, with the same checks for every web library. The checks are in `packages/ui-core/test`: `behavior.ts` finds elements by role and name and depends on no framework, and `scenarios.ts` writes the screen each check runs against as data, in the form of the design preview's. Each library's test file (`test/behavior.test.tsx` in `packages/ui` for React and `packages/ui-solid` for Solid, `test/behavior.test.ts` in `packages/ui-vue` for Vue and `packages/ui-svelte` for Svelte) draws those screens with the library's preview renderer and runs the checks. When you add or change an interactive web component, add its scenario and its checks to `packages/ui-core/test`; the libraries' test files do not change.

| Client | How to open a specific section directly |
| --- | --- |
| Web (React) | Run `mise run //web:dev`, then open `http://localhost:5173/design#buttons` (each section has an anchor; `?theme=light` or `?theme=dark` pins the color mode; `?open=menu`, `select`, `dialog`, `toast`, or `tooltip` opens that overlay) |
| Web (Solid) | Run `mise run //web-solid:dev`, then open `http://localhost:5174/design#buttons` (the same preview, anchors, and parameters as the React app's, drawn by the Solid library; it must look the same) |
| Web (Vue) | Run `mise run //web-vue:dev`, then open `http://localhost:5175/design#buttons` (the same preview, anchors, and parameters as the React app's, drawn by the Vue library; it must look the same) |
| Web (Svelte) | Run `mise run //web-svelte:dev`, then open `http://localhost:5176/design#buttons` (the same preview, anchors, and parameters as the React app's, drawn by the Svelte library; it must look the same) |
| GPUI desktop | `cargo run --package acme-desktop -- --design --dark --scroll 800` (`--open menu`, `select`, `dialog`, `toast`, or `tooltip` opens that overlay) |
| React Native | Pass `?from=<section number>`, `?sheet=1`, `?menu=1`, `?select=1`, `?dialog=1`, or `?toast=1` to the design screen route |
| Compose | `mise run //kotlin:render` renders PNG screenshots to `kotlin/build/preview` |

## Changing the CLI

`cargo test --package xds` scaffolds a test project for every individual client and every combination of clients. The test suite fails if any repository file is not mapped in `template.json`, if any conditional comment marker is unbalanced, or if an unreplaced placeholder remains in a generated project. Files under `cli/overlay` are copied over the root of generated projects using the same conditional markers and placeholder renaming.

## Moving to the next Expo SDK

The Expo app stays on the versions its SDK expects: `mise run //mobile:check` fails when an installed native package differs from the list in the installed `expo` package. It reads only that list, offline, so it does not fail when Expo publishes a newer patch; moving to one is a change of its own.

1. Wait until the `expo` release is a day old (pnpm's minimum release age) and, for a new SDK, until `https://api.expo.dev/v2/versions/latest` lists Expo Go for it: `mise run //mobile:ios` runs the app in Expo Go.
2. In `apps/mobile`, run `pnpm add expo@~<sdk>.0.<patch>`, then `pnpm exec expo install --fix`, which moves every native package to the SDK's version. It leaves `typescript` alone: `expo.install.exclude` in `apps/mobile/package.json` keeps the catalog's version, which moves with tsrs.
3. Give `packages/ui-native` the app's new versions in its peer and dev dependencies.
4. Compare the React version the SDK pins with the catalog's in `pnpm-workspace.yaml`, which the web targets share. If they cannot take the SDK's React, give the two mobile packages a named catalog of their own (`catalogs.native`, under `@if mobile-react-native`) rather than versions of their own.
5. Read the breaking changes of the SDK and of its React Native release, then run `mise run check:js` and open the design preview in Expo Go on iOS and Android, in both color modes.
