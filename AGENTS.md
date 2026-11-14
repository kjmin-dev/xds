# Working in this repository

This repository is the xds template: a single set of design tokens, component libraries for four clients, a sample app for each client, and the `xds` CLI that scaffolds a new project with a chosen subset of clients. `acme` is the placeholder name replaced by `xds create`, so keep it in all package names, identifiers, and file paths.

## Where things are

| Path | Contents |
| --- | --- |
| `design/tokens` | Design tokens in DTCG format (the single source of truth) |
| `design/themes` | Color themes, each defining an accent ramp and a neutral ramp |
| `design/components.json` | Component contract: variants, sizes, tones, and the source file for each client |
| `tools/design-build` | Token compiler and WCAG contrast checker |
| `packages/ui`, `packages/ui-native`, `crates/acme-ui`, `kotlin/ui` | Component libraries for web, React Native, GPUI, and Compose |
| `apps/*`, `kotlin/*App` | Client apps, each with a design preview screen |
| `cli`, `template.json` | The `xds` CLI and the manifest mapping repository paths to client targets |

## Rules

- Design tokens are the source of truth. Never edit generated files (`packages/tokens/src/generated`, `crates/acme-tokens/src/generated.rs`, `kotlin/ui/src/commonMain/kotlin/acme/tokens/Tokens.kt`). Edit the JSON files in `design/tokens`, run `mise run tokens`, and commit both the token sources and the generated files.
- Components must take all colors, sizes, and spacing from tokens. Do not hardcode hex colors in components, and prefer tokens over raw pixel values. Component-specific colors belong in that component's group in both `color.light.json` and `color.dark.json`.
- Every foreground and background color pair rendered together by a component must have an entry in `tools/design-build/src/contrast.ts`. The token build fails if any pairing falls below its required contrast ratio.
- Every component, variant, size, and tone must exist across all four clients under the same name and appear in each client's design preview. TopBar, TabBar, and BottomSheet are touch-only exceptions and exist only on React Native and Compose. Tooltip is a pointer-only exception and exists only on web and GPUI. Update `design/components.json` in the same change.
- Do not edit theme color ramps by hand. `design/themes/indigo.json` is the reference theme; generate new themes with `node tools/design-build/src/make-theme.ts <name> --hue <0-360>`.
- Every top-level path in the repository must be accounted for in `template.json` (under a target, a shared group, `common`, or `exclude`). Target-specific lines in shared files must be wrapped in `@if <targets>` and `@endif` comments; use `@if template` for lines needed only in this template repository.
- Machine-written JSON files under `design/` must be formatted with `JSON.stringify(value, null, 2)` followed by a trailing newline.
- Write comments that explain why, not what.

## Commands

| Task | Command |
| --- | --- |
| Run all CI checks | `mise run check` |
| Regenerate token files | `mise run tokens` |
| Verify generated files are up to date | `mise run check:generated` |
| Format code | `mise run fmt` |
| TypeScript lint, typecheck, tests, and web build | `mise run check:js` |
| Rust lint and tests | `mise run check:rust`, `mise run check:desktop` (macOS), `mise run check:cli` |
| Kotlin tests and builds | `mise run //kotlin:check` |
| Run the CLI from source | `mise run xds -- list` |
| List or apply a theme | `mise run theme`, `mise run theme ocean` |

Use `xds tokens`, `xds components`, `xds contrast`, and `xds doctor` to inspect the design system instead of reading JSON files by hand; pass `--json` for structured output. See `docs/cli.md` for details.

## Checking a UI change

There is no automated visual regression test, so inspect the design preview in both light and dark modes on every client you modify.

| Client | How to open a specific section directly |
| --- | --- |
| Web | Run `mise run //web:dev`, then open `http://localhost:5173/design#buttons` (each section has an anchor; `?theme=light` or `?theme=dark` pins the color mode; `?open=menu`, `dialog`, `toast`, or `tooltip` opens that overlay) |
| GPUI desktop | `cargo run --package acme-desktop -- --design --dark --scroll 800` (`--open menu`, `dialog`, `toast`, or `tooltip` opens that overlay) |
| React Native | Pass `?from=<section number>`, `?sheet=1`, `?menu=1`, `?dialog=1`, or `?toast=1` to the design screen route |
| Compose | `mise run //kotlin:render` renders PNG screenshots to `kotlin/build/preview` |

## Changing the CLI

`cargo test --package xds` scaffolds a test project for every individual client and every combination of clients. The test suite fails if any repository file is not mapped in `template.json`, if any conditional comment marker is unbalanced, or if an unreplaced placeholder remains in a generated project. Files under `cli/overlay` are copied over the root of generated projects using the same conditional markers and placeholder renaming.
