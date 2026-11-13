<!-- @if template -->
<!-- The AGENTS.md of a project made by `xds create`: what a coding agent needs to know to work -->
<!-- in it. The repository's own AGENTS.md is at the root. -->
<!-- @endif -->
# Working in Acme

Acme is built on a design system: one set of design tokens, and a component library for each client that draws from them.

## Where things are

| Path | What it holds |
| --- | --- |
| `design/tokens` | The design tokens, in DTCG format. The source of truth |
| `design/themes` | Color themes: an accent ramp and a neutral ramp each |
| `design/components.json` | The component contract: variants, sizes, tones, and the source file on each client |
| `tools/design-build` | Compiles tokens into platform files and checks contrast |
<!-- @if web-react mobile-react-native -->
| `packages/tokens` | Generated CSS and TypeScript. Do not edit |
<!-- @endif -->
<!-- @if web-react -->
| `packages/ui`, `apps/web` | Web components (React, Tailwind, HeroUI) and the web app |
<!-- @endif -->
<!-- @if mobile-react-native -->
| `packages/ui-native`, `apps/mobile` | React Native components and the Expo app |
<!-- @endif -->
<!-- @if desktop-gpui -->
| `crates/acme-tokens` | Generated Rust. Do not edit |
| `crates/acme-ui`, `apps/desktop` | GPUI components and the desktop app |
<!-- @endif -->
<!-- @if kotlin-compose -->
| `kotlin/ui`, `kotlin/shared` | Compose components (with the generated `acme.tokens`) and the app's screens |
<!-- @endif -->

## Rules

- Build screens from the design system's components. Apps import the component library, never the UI library underneath it.
- Tokens are the source. To change a color, a size, or a text style, edit `design/tokens`, run `mise run tokens`, and commit the token files together with the generated files. Never edit a generated file.
- Do not write a hex color in a screen or a component. Use a semantic color (`text.secondary`, `border.default`, `status.danger`); a color that only one component needs goes in that component's group in both `color.light.json` and `color.dark.json`.
- Every foreground and background drawn together needs an entry in `tools/design-build/src/contrast.ts`. `mise run tokens` fails when a pairing falls below its ratio, and says which one.
- Text takes a type role (`body`, `label`, `heading`), not a raw font size.
<!-- @if web-react -->
- On the web, use the `acme` Tailwind utilities (`text-acme-text-secondary`, `bg-acme-background-surface`, `text-acme-body`), not Tailwind's default palette.
<!-- @endif -->
- When a component gains a variant, a size, or a tone, add it under the same name on every client this project has, in each design preview, and in `design/components.json`.
- Switch the color theme with `mise run theme <name>`. Do not edit the accent and neutral ramps in `design/tokens/palette.json` by hand.

## Commands

| Task | Command |
| --- | --- |
| Everything CI runs | `mise run check` |
| Regenerate token files | `mise run tokens` |
<!-- @if web-react desktop-gpui mobile-react-native -->
| Format | `mise run fmt` |
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
| List every task | `mise tasks --all` |

If `xds` is installed, `xds tokens`, `xds components`, `xds contrast <foreground> <background>`, and `xds doctor` answer questions about this project's design system; add `--json` for structured output. `xds add <target>` adds another client.

## Checking a UI change

Look at the design preview in light and dark.

| Client | How to open it |
| --- | --- |
<!-- @if web-react -->
| Web | `http://localhost:5173/design#buttons` while the web app runs. Each section has an anchor; `?theme=light` or `?theme=dark` pins the mode |
<!-- @endif -->
<!-- @if desktop-gpui -->
| Desktop | `mise run //desktop:design`. Add `--light` or `--dark`, and `--scroll <pixels>` to start further down |
<!-- @endif -->
<!-- @if mobile-react-native -->
| Mobile | The button on the home screen. The design screen takes `?from=<section number>` and `?sheet=1` |
<!-- @endif -->
<!-- @if kotlin-compose -->
| Compose | `mise run //kotlin:render` writes PNG files to `kotlin/build/preview`; `mise run //kotlin:design` opens it in a window |
<!-- @endif -->
