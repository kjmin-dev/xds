<!-- @if template -->
<!-- The AGENTS.md of a project made by `xds create`: what a coding agent needs to know to work -->
<!-- in it. The repository's own AGENTS.md is at the root. -->
<!-- @endif -->
# Working in Acme

Acme is built around a shared design system: a single set of design tokens and a component library for each client that consumes them.

## Where things are

| Path | Contents |
| --- | --- |
| `design/tokens` | Design tokens in DTCG format (the single source of truth) |
| `design/themes` | Color themes, each defining an accent ramp and a neutral ramp |
| `design/components.json` | Component contract: variants, sizes, tones, and the source file for each client |
| `tools/design-build` | Token compiler and WCAG contrast checker |
<!-- @if js-tokens -->
| `packages/tokens` | Generated CSS and TypeScript token files. Do not edit |
<!-- @endif -->
<!-- @if web-react -->
| `packages/ui`, `apps/web` | Web component library (React, Tailwind, Zag.js) and the web app |
<!-- @endif -->
<!-- @if web-solid -->
| `packages/ui-solid`, `apps/web-solid` | Web component library (Solid, Tailwind, Zag.js) and the Solid web app |
<!-- @endif -->
<!-- @if web-vue -->
| `packages/ui-vue`, `apps/web-vue` | Web component library (Vue, Tailwind, Zag.js) and the Vue web app |
<!-- @endif -->
<!-- @if web-svelte -->
| `packages/ui-svelte`, `apps/web-svelte` | Web component library (Svelte, Tailwind, Zag.js) and the Svelte web app |
<!-- @endif -->
<!-- @if ui-core -->
| `packages/ui-core` | What the web libraries share: the prop types, class recipes, and stylesheet of their components, the DOM helpers their behavior needs, the web design preview as data (`src/preview`), and the behavior tests that each of them runs |
<!-- @endif -->
<!-- @if mobile-react-native -->
| `packages/ui-native`, `apps/mobile` | React Native component library and the Expo app |
<!-- @endif -->
<!-- @if desktop-gpui -->
| `crates/acme-tokens` | Generated Rust token crate. Do not edit |
| `crates/acme-ui`, `apps/desktop` | GPUI component library and the desktop app |
<!-- @endif -->
<!-- @if kotlin-compose -->
| `kotlin/ui`, `kotlin/shared` | Compose component library (including generated `acme.tokens`) and shared app screens |
<!-- @endif -->

## Rules

- Build app screens from the design system's components. Application code must import the project's component library, never the UI library underneath it.
- Design tokens are the source of truth. To change a color, size, or text style, edit the files in `design/tokens`, run `mise run tokens`, and commit both the token sources and the generated files. Never edit a generated file directly.
- Do not hardcode hex colors in screens or components. Use semantic color tokens (`text.secondary`, `border.default`, `status.danger`); colors needed by a single component belong in that component's group in both `color.light.json` and `color.dark.json`.
- Every foreground and background color pair rendered together must have an entry in `tools/design-build/src/contrast.ts`. `mise run tokens` fails and reports the offending pair if any combination falls below its required contrast ratio.
- Always use a typographic role (`body`, `label`, `heading`) for text rather than a raw font size.
<!-- @if ui-core -->
- On the web, use the generated `acme` Tailwind utility classes (`text-acme-text-secondary`, `bg-acme-background-surface`, `text-acme-body`) instead of Tailwind's default palette.
<!-- @endif -->
<!-- @if ui-core -->
- `packages/ui-core` holds one copy of what the web libraries share, so it never imports a framework. Change a component's classes or CSS there, not in a library. Its CSS selects on its own part classes, native pseudo-classes, `aria-*` attributes, and Zag's state attributes.
<!-- @endif -->
- When adding a variant, size, or tone to a component, implement it under the same name across every client in this project, add it to each client's design preview, and record it in `design/components.json`. A difference between clients that is not in the contract's names (an option only some clients have, a part the platform draws, a different presentation for touch) is listed in that component's `differences`.
<!-- @if ui-core -->
- The web design preview is written once, as typed data in `packages/ui-core/src/preview`, and each web library's renderer (its `src/preview` module) draws it at `/design`. Show a web component there, not in an app: its props go in `components.ts`, its examples in `sections.ts`, and the component into the `COMPONENTS` of each renderer, which fails to typecheck until it is there and takes every prop the data passes. The `README.md` there explains the data.
<!-- @endif -->
- Switch color themes with `mise run theme <name>`. Do not edit the accent or neutral color ramps in `design/tokens/palette.json` by hand.
<!-- @if js-workspace -->
- Fix what the linter reports. Where a rule is wrong for one deliberate line, disable it there with `// oxlint-disable-next-line <plugin>/<rule> -- <why>`; a directive that no longer suppresses anything fails `mise run check:js`.
- On the command line, type checking (each package's `typecheck` script, `tsrs --noEmit`) and oxlint's type-aware rules (`tsrs-lint`) run on tsrs, an experimental Rust port of TypeScript 7.1. Editors keep TypeScript's own language server; the root `typescript` package is the version to point them at, and the one tsrs is held to. tsrs is built from one TypeScript commit, so the pnpm catalog pins both exactly and they move together: to upgrade TypeScript, change both, taking the tsrs release that ports the new version (`pnpm view tsrs@<release> tsrs.typescriptVersion` shows the version a release ports). `mise run check:js` fails while they differ. Build scripts do not type-check; `mise run check:js` does.
<!-- @endif -->
<!-- @if web-vue -->
- The Vue packages are the exception: vue-tsc checks their `.vue` files (`vue-tsc --noEmit`), on the TypeScript 6 API that typescript-native-bridge keeps over the TypeScript 7 checker. They take that `typescript` from the `vue` catalog in `pnpm-workspace.yaml`, which Vite's compiler for `.vue` files needs too. oxlint lints only the script blocks of `.vue` files, and without its type-aware rules.
<!-- @endif -->
<!-- @if web-svelte -->
- The Svelte packages type-check with svelte-check instead (`--tsgo-experimental-api`), which reads the components with a TypeScript 6 of its own, set in `.pnpmfile.cjs`, and checks them with TypeScript 7, which it finds as `@typescript/native` at the catalog's `typescript` version. Upgrade svelte-check together with TypeScript. oxlint lints a component's script but not with its type-aware rules, and leaves unused names to svelte-check.
<!-- @endif -->
<!-- @if mobile-react-native -->
- Add a native package to the mobile app with `pnpm exec expo install <package>` in `apps/mobile`, not `pnpm add`, so that it gets the version the Expo SDK expects. See "Moving to the next Expo SDK" below.
<!-- @endif -->

## Commands

| Task | Command |
| --- | --- |
| Run all CI checks | `mise run check` |
| Regenerate token files | `mise run tokens` |
<!-- @if js-workspace rust-workspace -->
| Format code | `mise run fmt` |
<!-- @endif -->
<!-- @if web-react -->
| Start the web app | `mise run //web:dev` |
<!-- @endif -->
<!-- @if web-solid -->
| Start the Solid web app | `mise run //web-solid:dev` |
<!-- @endif -->
<!-- @if web-vue -->
| Start the Vue web app | `mise run //web-vue:dev` |
<!-- @endif -->
<!-- @if web-svelte -->
| Start the Svelte web app | `mise run //web-svelte:dev` |
<!-- @endif -->
<!-- @if desktop-gpui -->
| Start the desktop app | `mise run //desktop:dev` |
<!-- @endif -->
<!-- @if mobile-react-native -->
| Start the mobile app | `mise run //mobile:ios` or `mise run //mobile:android` |
| Check the mobile app's native packages against its Expo SDK, and bundle it for iOS and Android (`mise run check:js` runs both) | `mise run //mobile:check`, `mise run //mobile:bundle` |
<!-- @endif -->
<!-- @if kotlin-compose -->
| Start the Compose desktop app | `mise run //kotlin:desktop` |
<!-- @endif -->
<!-- @if web-react -->
| Test how the React web components behave, in headless Google Chrome | `pnpm --filter @acme/ui test` |
<!-- @endif -->
<!-- @if web-solid -->
| Test how the Solid web components behave, in headless Google Chrome | `pnpm --filter @acme/ui-solid test` |
<!-- @endif -->
<!-- @if web-vue -->
| Test how the Vue web components behave, in headless Google Chrome | `pnpm --filter @acme/ui-vue test` |
<!-- @endif -->
<!-- @if web-svelte -->
| Test how the Svelte web components behave, in headless Google Chrome | `pnpm --filter @acme/ui-svelte test` |
<!-- @endif -->
| List all available tasks | `mise tasks --all` |

If `xds` is installed, use `xds tokens`, `xds components`, `xds contrast <foreground> <background>`, and `xds doctor` to query the design system; pass `--json` for structured output. Run `xds add <target>` to add another client stack to this project.

## Checking a UI change

Inspect the design preview in both light and dark modes after making visual changes.

| Client | How to open the preview |
| --- | --- |
<!-- @if web-react -->
| Web | Open `http://localhost:5173/design#buttons` while the web dev server is running. Each section has an anchor, `?theme=light` or `?theme=dark` pins the color mode, and `?open=menu`, `select`, `datepicker`, `dialog`, `toast`, or `tooltip` opens that overlay |
<!-- @endif -->
<!-- @if web-solid -->
| Web (Solid) | Open `http://localhost:5174/design#buttons` while the Solid dev server is running. Each section has an anchor, `?theme=light` or `?theme=dark` pins the color mode, and `?open=menu`, `select`, `datepicker`, `dialog`, `toast`, or `tooltip` opens that overlay |
<!-- @endif -->
<!-- @if web-vue -->
| Web (Vue) | Open `http://localhost:5175/design#buttons` while the Vue dev server is running. Each section has an anchor, `?theme=light` or `?theme=dark` pins the color mode, and `?open=menu`, `select`, `datepicker`, `dialog`, `toast`, or `tooltip` opens that overlay |
<!-- @endif -->
<!-- @if web-svelte -->
| Web (Svelte) | Open `http://localhost:5176/design#buttons` while the Svelte dev server is running. Each section has an anchor, `?theme=light` or `?theme=dark` pins the color mode, and `?open=menu`, `select`, `datepicker`, `dialog`, `toast`, or `tooltip` opens that overlay |
<!-- @endif -->
<!-- @if desktop-gpui -->
| Desktop | Run `mise run //desktop:design`. Pass `--light` or `--dark` to pin the mode, `--scroll <pixels>` to open at a vertical offset, and `--open menu`, `select`, `datepicker`, `dialog`, `toast`, or `tooltip` to open with that overlay showing |
<!-- @endif -->
<!-- @if mobile-react-native -->
| Mobile | Tap the preview button on the home screen, or navigate to the design route with `?from=<section number>`, `?sheet=1`, `?menu=1`, `?select=1`, `?dialog=1`, or `?toast=1` |
<!-- @endif -->
<!-- @if kotlin-compose -->
| Compose | Run `mise run //kotlin:render` to render PNG screenshots into `kotlin/build/preview`, or `mise run //kotlin:design` to open the interactive preview window |
<!-- @endif -->
<!-- @if ui-core -->

`mise run check:js` also tests how the interactive web components behave (keyboard, focus, and ARIA state) in the Google Chrome installed on the machine. The checks are in `packages/ui-core/test/behavior.ts`, and the screens they run against are written as data in `scenarios.ts`, the way the design preview is. Every web library runs them: its `test/behavior.test` file draws each screen with the library's preview renderer. When you add or change an interactive web component, add its scenario and its checks to `packages/ui-core/test`.

`mise run compare:previews` starts every web app in the project and compares their design previews pixel by pixel: every section and every `?open=` overlay, at 1280 and 390 px, in both modes. They draw the same data, so a difference is one library drawing a component differently. With one web app there is nothing to compare.
<!-- @endif -->
<!-- @if mobile-react-native -->

## Moving to the next Expo SDK

The mobile app stays on the versions its Expo SDK expects: `mise run //mobile:check` fails when an installed native package differs from the list in the installed `expo` package. It reads only that list, offline, so it does not fail when Expo publishes a newer patch; moving to one is a change of its own.

1. Wait until the `expo` release is a day old (pnpm's minimum release age) and, for a new SDK, until `https://api.expo.dev/v2/versions/latest` lists Expo Go for it: `mise run //mobile:ios` runs the app in Expo Go.
2. In `apps/mobile`, run `pnpm add expo@~<sdk>.0.<patch>`, then `pnpm exec expo install --fix`, which moves every native package to the SDK's version. It leaves `typescript` alone: `expo.install.exclude` in `apps/mobile/package.json` keeps the catalog's version, which moves with tsrs.
3. Give `packages/ui-native` the app's new versions in its peer and dev dependencies.
4. Compare the versions of `react` and `react-dom` the SDK pins with the catalog's in `pnpm-workspace.yaml`. If another package of the workspace cannot take the SDK's React, give the two mobile packages a named catalog of their own (`catalogs.native`) rather than versions of their own.
5. Read the breaking changes of the SDK and of its React Native release, then run `mise run check:js` and open the design preview in Expo Go on iOS and Android, in both color modes.
<!-- @endif -->
