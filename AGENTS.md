# Working in this repository

This is the xds template: one set of design tokens, a component library for each of four clients, a small app per client, and the `xds` CLI that copies a chosen subset into a new project. `acme` is a placeholder that `xds create` replaces, so keep it in names and paths.

## Where things are

| Path | What it holds |
| --- | --- |
| `design/tokens` | The design tokens, in DTCG format. The source of truth |
| `design/themes` | Color themes: an accent ramp and a neutral ramp each |
| `design/components.json` | The component contract: variants, sizes, tones, and the source file on each client |
| `tools/design-build` | Compiles tokens into platform files and checks contrast |
| `packages/ui`, `packages/ui-native`, `crates/acme-ui`, `kotlin/ui` | The components for web, React Native, GPUI, and Compose |
| `apps/*`, `kotlin/*App` | One app per client, each with a design preview |
| `cli`, `template.json` | The `xds` CLI and the manifest that says which paths belong to which client |

## Rules

- Tokens are the source. Never edit a generated file (`packages/tokens/src/generated`, `crates/acme-tokens/src/generated.rs`, `kotlin/ui/src/commonMain/kotlin/acme/tokens/Tokens.kt`). Edit `design/tokens`, run `mise run tokens`, and commit both.
- Components take colors, sizes, and spacing from tokens. Do not write a hex color in a component, and prefer a token over a raw pixel value. A color a component needs goes in that component's group in both `color.light.json` and `color.dark.json`.
- Every foreground and background a component draws together needs an entry in `tools/design-build/src/contrast.ts`. The build fails when a pairing falls below its ratio.
- A component, variant, size, or tone exists on all four clients under the same name, and in each client's design preview. TopBar, TabBar, and BottomSheet exist only on React Native and Compose. Update `design/components.json` in the same change.
- Do not edit theme colors by hand. `design/themes/indigo.json` is the reference; make a theme with `node tools/design-build/src/make-theme.ts <name> --hue <0-360>`.
- A new top-level path must be claimed in `template.json` (a target, a shared group, `common`, or `exclude`). Lines in shared files that belong to some clients sit between `@if <targets>` and `@endif` comment lines; `@if template` marks what only this repository needs.
- Machine-written JSON under `design/` keeps the layout of `JSON.stringify(value, null, 2)` plus a final newline.
- Comments say why, not what.

## Commands

| Task | Command |
| --- | --- |
| Everything CI runs | `mise run check` |
| Regenerate token files | `mise run tokens` |
| Check that generated files are current | `mise run check:generated` |
| Format | `mise run fmt` |
| TypeScript lint, types, tests, web build | `mise run check:js` |
| Rust lint and tests | `mise run check:rust`, `mise run check:desktop` (macOS), `mise run check:cli` |
| Kotlin tests and builds | `mise run //kotlin:check` |
| Run the CLI from source | `mise run xds -- list` |
| List or apply a theme | `mise run theme`, `mise run theme ocean` |

`xds tokens`, `xds components`, `xds contrast`, and `xds doctor` answer questions about the design system without reading files by hand; add `--json` for structured output. See `docs/cli.md`.

## Checking a UI change

There is no automated screenshot comparison, so look at the design preview in light and dark on every client you touched.

| Client | How to open a section without interacting |
| --- | --- |
| Web | `mise run //web:dev`, then `http://localhost:5173/design#buttons` (each section has an anchor; `?theme=light` or `?theme=dark` pins the mode) |
| GPUI desktop | `cargo run --package acme-desktop -- --design --dark --scroll 800` |
| React Native | The design screen takes `?from=<section number>` and `?sheet=1` |
| Compose | `mise run //kotlin:render` writes PNG files to `kotlin/build/preview` |

## Changing the CLI

`cargo test --package xds` creates a project for every client and for every combination of clients. It fails when a file belongs to nothing in `template.json`, when a marker is unbalanced, or when a placeholder is left in a project. Files under `cli/overlay` are written over the root of a new project, with the same markers and renaming.
