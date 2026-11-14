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
| `packages/ui`, `apps/web` | Web component library (React, Tailwind, HeroUI) and the web app |
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
<!-- @if web-react -->
- On the web, use the generated `acme` Tailwind utility classes (`text-acme-text-secondary`, `bg-acme-background-surface`, `text-acme-body`) instead of Tailwind's default palette.
<!-- @endif -->
- When adding a variant, size, or tone to a component, implement it under the same name across every client in this project, add it to each client's design preview, and record it in `design/components.json`.
- Switch color themes with `mise run theme <name>`. Do not edit the accent or neutral color ramps in `design/tokens/palette.json` by hand.
<!-- @if js-workspace -->
- Fix what the linter reports. Where a rule is wrong for one deliberate line, disable it there with `// oxlint-disable-next-line <plugin>/<rule> -- <why>`; a directive that no longer suppresses anything fails `mise run check:js`.
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
<!-- @if desktop-gpui -->
| Start the desktop app | `mise run //desktop:dev` |
<!-- @endif -->
<!-- @if mobile-react-native -->
| Start the mobile app | `mise run //mobile:ios` or `mise run //mobile:android` |
<!-- @endif -->
<!-- @if kotlin-compose -->
| Start the Compose desktop app | `mise run //kotlin:desktop` |
<!-- @endif -->
| List all available tasks | `mise tasks --all` |

If `xds` is installed, use `xds tokens`, `xds components`, `xds contrast <foreground> <background>`, and `xds doctor` to query the design system; pass `--json` for structured output. Run `xds add <target>` to add another client stack to this project.

## Checking a UI change

Inspect the design preview in both light and dark modes after making visual changes.

| Client | How to open the preview |
| --- | --- |
<!-- @if web-react -->
| Web | Open `http://localhost:5173/design#buttons` while the web dev server is running. Each section has an anchor, `?theme=light` or `?theme=dark` pins the color mode, and `?open=menu`, `select`, `dialog`, `toast`, or `tooltip` opens that overlay |
<!-- @endif -->
<!-- @if desktop-gpui -->
| Desktop | Run `mise run //desktop:design`. Pass `--light` or `--dark` to pin the mode, `--scroll <pixels>` to open at a vertical offset, and `--open menu`, `select`, `dialog`, `toast`, or `tooltip` to open with that overlay showing |
<!-- @endif -->
<!-- @if mobile-react-native -->
| Mobile | Tap the preview button on the home screen, or navigate to the design route with `?from=<section number>`, `?sheet=1`, `?menu=1`, `?select=1`, `?dialog=1`, or `?toast=1` |
<!-- @endif -->
<!-- @if kotlin-compose -->
| Compose | Run `mise run //kotlin:render` to render PNG screenshots into `kotlin/build/preview`, or `mise run //kotlin:design` to open the interactive preview window |
<!-- @endif -->
