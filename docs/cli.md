# The xds CLI

`xds` scaffolds a new project from this template. You choose a project name, the client stacks to include, and a color theme, and `xds` generates a repository containing only those stacks with the `acme` placeholder replaced by your project name.

The template files are compiled directly into the binary. `xds` requires no network access, and a given version always scaffolds the exact template snapshot from when that binary was built.

## Install

### npm

```sh
npm install --global xds-cli
xds --version
```

Or run it directly without installing globally:

```sh
npx xds-cli create my-app
npm create xds@latest my-app
```

`xds-cli` is a small launcher script. The native binary comes from an optional platform-specific package that npm selects by `os` and `cpu`: `xds-cli-darwin-arm64`, `xds-cli-darwin-x64`, `xds-cli-linux-arm64`, `xds-cli-linux-x64`, or `xds-cli-win32-x64`. If you install with `--omit=optional`, npm skips the platform package and the launcher exits with an error message explaining why.

### Installer script (macOS and Linux)

```sh
curl -fsSL https://raw.githubusercontent.com/kjmin-dev/xds/main/install.sh | sh
```

The script downloads the prebuilt binary for your machine from the latest [GitHub release](https://github.com/kjmin-dev/xds/releases), verifies its SHA-256 checksum, and installs it to `~/.local/bin`. If that directory is not on your `PATH`, the script prints the line to add to your shell profile.

| Variable | Meaning | Default |
| --- | --- | --- |
| `XDS_VERSION` | Specific release version to install, such as `0.1.0` | Latest release |
| `XDS_INSTALL_DIR` | Directory where the binary is installed | `$HOME/.local/bin` |
| `XDS_DOWNLOAD_BASE` | Custom URL or local directory containing the release archives, overriding GitHub Releases | |

```sh
curl -fsSL https://raw.githubusercontent.com/kjmin-dev/xds/main/install.sh | XDS_VERSION=0.1.0 XDS_INSTALL_DIR=/usr/local/bin sh
```

Prebuilt binaries are available for macOS (arm64, x86_64) and Linux (arm64, x86_64; statically linked so they run on any distribution). On Windows, install via npm.

### From source

From a local checkout of this repository with the toolchain installed via `mise install`:

```sh
cargo install --path cli        # installs xds into ~/.cargo/bin
mise run xds -- list            # or run it without installing
mise run build:cli              # the release build, at target/dist/xds
```

## Commands

Every command accepts `--help`. Pass `--no-color` or set the `NO_COLOR` environment variable to disable color output. Colors are also disabled automatically when stdout is not a terminal, unless `FORCE_COLOR=1` is set.

### `xds list`

Lists the available client stacks and color themes, and marks the defaults.

```console
$ xds list
Targets
  web-react            Web                             React 19, Vite, Tailwind v4, Zag.js (default)
  web-solid            Web                             SolidJS 2 (release candidate), Vite, Tailwind v4, Zag.js
  web-vue              Web                             Vue 3, Vite, Tailwind v4, Zag.js
  web-svelte           Web                             Svelte 5, Vite, Tailwind v4, Zag.js
  desktop-electron     Desktop (macOS, Windows, Linux) Electron, Electron Forge (wraps a web app)
  desktop-tauri        Desktop (macOS, Windows, Linux) Tauri 2 (wraps a web app)
  desktop-gpui         Desktop (macOS)                 Rust, GPUI, GPUI Component
  mobile-react-native  Mobile (iOS, Android)           React Native, Expo
  dart-flutter         Flutter (iOS, Android)            Dart, Flutter widgets
  kotlin-compose       Kotlin (Android, iOS, Desktop)  Kotlin, Compose Multiplatform

Themes
  forest  A deep green accent on sage neutrals.
  indigo  The default. An indigo accent on cool grey neutrals. (default)
  ocean   A clear blue accent on slate neutrals.
  plum    A magenta accent on mauve neutrals.
  sunset  A burnt orange accent on warm stone neutrals.
```

### `xds create <directory>`

```text
xds create <directory> [--name <name>] [--title <title>] [--targets <a,b|all>]
                       [--theme <theme>] [--yes] [--dry-run] [--force]
```

When run interactively in a terminal, `xds create my-app` prompts for any options not supplied via flags:

1. The project name (text input, defaulting to the target directory name).
2. The client targets to include (multi-select list: Up and Down or `k` and `j` to move, Space to toggle, `a` to toggle all, Enter to confirm). The default targets start out selected.
3. The color theme (select list with a live preview rendered below it; see [Themes](#themes)).

Pressing Enter at every prompt creates the same project as `--yes`. Pressing Esc or Ctrl-C cancels the prompt at any point. No files are written until the final prompt is confirmed.

When all options are supplied via flags, `xds` runs without prompting:

```console
$ xds create orbit --name orbit --targets web-react,desktop-gpui --theme ocean
Created Orbit in orbit
  name     orbit
  targets  web-react, desktop-gpui
  theme    ocean
  files    85

Regenerated the token files for the ocean theme.

Next steps
  cd orbit
  mise trust
  mise install
  mise run fmt  once: the new name changes line lengths and import order
  mise run check

Run
  mise run //web:dev      Start the web app on http://localhost:5173
  mise run //desktop:dev  Start the desktop app
```

| Flag | Meaning |
| --- | --- |
| `--name` | Lowercase ASCII letters and digits, starting with a letter, up to 40 characters. Replaces `acme` across the project: crate names (`orbit-ui`), the npm scope (`@orbit/ui`), CSS custom properties (`--orbit-color-*`), and the Kotlin package (`orbit.tokens`). Kotlin and Java reserved keywords are rejected |
| `--title` | Display name used to replace `Acme`. Accepts letters, digits, spaces, and `-`, `_`, `.`. Defaults to the project name with an uppercase first letter |
| `--wrap` | Web target to include and run in the selected desktop shells |
| `--targets` | Comma-separated target IDs, or `all` for every target |
| `--theme` | Theme name. Defaults to `indigo` |
| `--yes`, `-y` | Skip interactive prompts and use defaults for any omitted flags: the project name comes from the directory name, the targets are the default targets (`web-react`, marked `(default)` in `xds list`), and the theme defaults to `indigo` |
| `--dry-run` | Print the file paths that would be written without writing anything to disk |
| `--force` | Allow scaffolding into a non-empty directory. Existing files at matching paths are overwritten, while unrelated files are left untouched |

When stdout is not a terminal (for example, in a script or CI job), there is no way to prompt interactively. In that case, `--name` and `--targets` are required unless `--yes` is passed, and the error message lists any missing flags.

What a scaffolded project contains:

- The files for the selected targets along with shared project files: `design/`, `tools/design-build/`, `mise.toml`, the CI workflow, and `docs/design-system.md`. Selecting any JavaScript target also includes the pnpm workspace configuration and `packages/tokens`. Selecting a web target also includes `packages/ui-core`. Selecting GPUI or Tauri includes the Cargo workspace configuration.
- Only the generated token files consumed by the selected targets. `design/build.json` is filtered to those outputs so `mise run tokens` does not generate files for unused stacks.
- Root configuration files trimmed to match the selection: `mise.toml` includes only the relevant tools and tasks, and the CI workflow includes only the relevant jobs.
- A project `README.md` with the run commands for the selected stacks.
- `.xds.json`, which records the creation version (`createdWith`), last writer (`xds`), project name, title, targets, theme and each selected shell’s web app for use by `xds add` and `xds theme`.

Files specific to maintaining this template repository are excluded: this repository's own README, license, contributing guide, the CLI itself, and lockfiles. Because a scaffolded project contains a custom subset of workspace packages, it needs its own lockfiles; running `mise run check` for the first time resolves dependencies and generates them.

Run `mise run fmt` once before running `mise run check` for the first time. The template source is formatted for the placeholder name `acme`; substituting a different project name can push lines past the formatter's line-length limit or change alphabetical import ordering (such as `orbit_tokens`), causing the formatting check in `mise run check` to fail until the formatter has been run. Projects that only include the Kotlin stack do not have a `fmt` task and can skip this step.

When `--title` contains spaces, `Acme` inside code identifiers is replaced with the space-stripped title: `--title "Orbit Notes"` turns `AcmeTheme` into `OrbitNotesTheme` while turning `<title>Acme</title>` into `<title>Orbit Notes</title>`.

### Desktop shells

`desktop-electron` and `desktop-tauri` open a selected web app on macOS, Windows or Linux. The same web routes, components and design preview run inside the shell. Electron ships Chromium. Tauri uses the system WebView and requires its platform development tools. [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) The macOS bundle requires 14.4 or later because the shared design preview uses `Object.groupBy`, added in Safari 17.4. [WebKit release notes](https://webkit.org/blog/15063/webkit-features-in-safari-17-4/)

```sh
xds create orbit --name orbit --targets desktop-electron --wrap web-solid --yes
cd orbit
xds add desktop-tauri --wrap web-svelte
mise run //desktop-electron:dev
mise run //desktop-tauri:build
```

Each shell needs a web target. `--wrap` includes it automatically. If multiple web targets are selected, interactive creation asks which to wrap. Noninteractive creation uses the first selected web target in manifest order. Both shells may wrap the same app. The shell's `package.json` names the web workspace package in its `web` script, and `.xds.json` records that choice under `wraps`. Adding another web target preserves existing shells. To switch an existing shell, change its script and the corresponding record entry together.

The builds use Vite's production output. `mise run //desktop-electron:build` produces a Forge ZIP in the shell's `out/make`, and `mise run //desktop-tauri:build` produces the OS bundle in Cargo's release directory.

### `xds add <target>...`

Adds one or more client stacks to an existing project created with `xds create`. Run it from the project root, or pass `--project <dir>`.

```console
$ xds add kotlin-compose
Added kotlin-compose to Orbit
  59 new files
  updated: .gitattributes, .github/workflows/ci.yml, README.md, design/build.json, mise.toml

Regenerated the token files from the project's tokens.

Next steps
  mise trust
  mise install
  mise run check

Run
  mise run //kotlin:desktop  Start the Compose desktop app
  mise run //kotlin:android  Run the Compose app on Android
```

`add` compares the initial project state recorded in `.xds.json` against the template output with the new targets included, and applies the difference:

- Files belonging exclusively to the new targets are written to disk.
- Shared files affected by the new targets (such as `mise.toml` or the CI workflow) are updated in place if the project's copy still matches what `xds` originally wrote byte for byte.
- If a shared file has been modified locally, `xds` leaves it untouched, writes the updated version alongside it as `<file>.xds-new`, and lists the path under "Needs a manual merge". Reconcile the changes manually and delete the `.xds-new` file.
- `design/build.json` is merged at the JSON level rather than overwritten: any existing output paths you customized are preserved, and the new target's outputs are appended.
- Files unaffected by the new targets are never modified.
- `.xds.json` is updated with the new target list.

Because the template embeds generated token files for the default theme, `add` runs the token generator after writing the new files so that the newly added stack matches the project's current tokens and theme. If Node is not available, it notes this, and `mise run tokens` can be used to regenerate them later.

`--dry-run` reports the same comparison and writes nothing.

If a project was created with an older version of `xds`, shared files may differ from what the current version writes even without local edits. In that case, `add` flags those files for manual merge and notes which version originally created the project.

### `xds themes [name]`

Renders a terminal preview of all available themes, or of a single named theme. See [Themes](#themes).

### `xds theme [name]`

Applies a color theme to an existing project. Run it from the project root, or pass `--project <dir>`.

```console
$ xds theme sunset
Applied the sunset theme and regenerated the token files.
```

When run in a terminal without a theme name, it opens the same interactive selector and live preview used by `create`, preselecting the project's active theme.

`--dry-run` says whether the theme would change anything and writes nothing.

`theme` loads theme definitions and token files from the project directory rather than the embedded binary assets. Any custom themes added to `design/themes` appear in the selector, and the preview reflects any local edits to the project's semantic color tokens. The command works in any directory containing `design/tokens/palette.json` and `design/themes`, including a checkout of this template repository.

### `xds tokens [query]`

Lists the design tokens and their resolved values: per color mode for colors, and per input device for sizes.

```sh
xds tokens                      # every token
xds tokens button.primary       # tokens whose path contains this
xds tokens --tier semantic      # palette, semantic, component, or base
```

```text
color.button.primary.background  light #4f46e5 (color.accent.default)   dark #5b5ef0 (color.accent.default)
```

Aliases are resolved to their final values, with the referenced token shown in parentheses. With `--json`, each token entry includes `path`, `type`, `tier`, `description`, `values`, and `aliases`.

When run inside a project or a checkout of this repository, `tokens` reads the local files in `design/tokens`. Elsewhere, it reads the template embedded in the binary, or you can pass `--project <dir>` to point to a project directory explicitly. `components` and `contrast` work the same way; in JSON output, the `source` field indicates `project` or `template`.

### `xds components [name]`

Lists all components and the clients that implement them, or shows the details of a single component. The list marks a component that only touch or only pointer clients have (`touch only`, `pointer only`), and the details include each way the clients differ.

```sh
xds components                              # all of them
xds components Button                       # options, states, tokens, and the source file per client
xds components Button --client web-react    # one client only
xds components Button --code                # with the source code
```

This information comes from `design/components.json`, the component contract, which records each component's purpose, options, states, accessibility notes, and the source file and symbol that implement it on each client. In a project created with `xds create`, the contract is filtered down to that project's clients.

Where clients differ in a way the contract's names do not show, the component has a `differences` list. Each entry names the `clients` it concerns, or an `input` (`pointer` or `touch`, from the targets in `template.json`) for every client designed for it, and a `kind`: `only` (an option, or one `value` of it, that only those clients have), `system` (the platform draws part of it, out of the tokens' reach), or `adapts` (it looks or opens differently for that input). `option` and `value` narrow it to one option, `status: "planned"` marks one not built yet, and `note` says what changes. `--json` and the MCP server return the entries as they are written.

### `xds contrast <foreground> <background>`

Computes the WCAG 2 contrast ratio between two colors. Each argument can be a hex color or a color token path (the leading `color.` prefix is optional).

```sh
xds contrast text.secondary background.surface
xds contrast '#84848f' '#ffffff' --min 4.5
```

```text
color.text.secondary on color.background.surface
  light #5c5c66  #ffffff  6.60:1   text 4.5 pass   large text and UI 3 pass   AAA text 7 fail
```

Color tokens are evaluated in both light and dark modes. With `--min <ratio>`, the command exits with code 1 if either mode falls below the threshold. Translucent tokens are rejected; composite the color over its background first and pass the resulting hex value.

### `xds check-theme <file>`

Checks a custom theme before applying it. It uses the same DTCG value parser, alias resolution, contrast thresholds and layered backgrounds as the token build. The checker in the binary reads local design data in an xds project or checkout, and uses the embedded release elsewhere. A versioned project requires a CLI of the same version. Use `--project <dir>` to select a project explicitly. The check runs offline with Node 22.18 or later and leaves the project and input file untouched.

For example, save this as `brand.json`. It inherits the ocean preset, uses the primary text color for light-mode field text and changes the touch control height.

```json
{
  "version": "0.1.0",
  "preset": "ocean",
  "light": { "color.field.text": "{color.text.primary}" },
  "touch": { "size.control.md": { "value": 48, "unit": "px" } }
}
```

```sh
xds check-theme brand.json
xds check-theme brand.json --json
xds check-theme design/themes/forest.json
```

Use the version and dotted token names from `design/theme-contract.json`, generated by `mise run tokens`. Each section maps a path to its DTCG `$value` (including aliases). Set colors under `light` and `dark`, dimensions that depend on input under `pointer` and `touch`, and shared foundation tokens under `values`. With a named `preset`, any section or token can be omitted. A full theme omits `preset` and supplies every token in all five sections. Existing generated accent-and-neutral ramp files can be checked directly.

Exit code 0 means every pair passed in both modes. To see a failure, set the light field text to `"{color.field.background}"`. The command exits with 1 and reports the foreground, layered background, mode, ratio and required minimum. With `--json`, contrast failures produce `ok: false` and a `failures` list on stdout. Malformed JSON, unknown tokens or presets, invalid values and version mismatches produce an error on stderr. For older scaffolds without a versioned contract, xds derives the paths and types from their tokens and uses the running CLI version.

### `xds export-theme <file>`

Checks a theme file as `check-theme` does and, if every contrast pair passes, writes it for a client. By default it writes a stylesheet, which sets every token as a custom property on the elements that name the theme: the root element for the whole page, or any element for its contents. With `--format compose`, it writes a Kotlin file that holds the theme as a value for the Compose theme composable, with `--format react-native` a TypeScript module that holds it as a value for the React Native theme provider, and with `--format gpui` a Rust file that holds it as a constant for the GPUI components.

```sh
xds export-theme brand.json -o brand.css
xds export-theme brand.json --name checkout
xds export-theme brand.json --format compose --package com.example.app.theme -o BrandTheme.kt
xds export-theme brand.json --format react-native -o brand.ts
xds export-theme brand.json --format gpui -o src/brand.rs
```

The theme is named after the file (`Brand Theme.json` becomes `brand-theme`) unless `--name` is given. Without `--out`, the file is written to stdout, or to the `css`, `kotlin`, `typescript` or `rust` field with `--json`. Outside a project, the stylesheet is for [the web library](web-library.md): its custom properties are `--xds-*`, it applies to `data-xds-theme="<name>"`, and it sits in the library's `xds.theme` cascade layer. In a project, the names use the project's name (`--orbit-*`, `data-orbit-theme`) and no layer, beside the project's own token file.

The Kotlin file declares `val <Name>Theme: Theme` (`brand` becomes `BrandTheme`), with every token's value, in the package `--package` names. Without `--package`, the package is `xds.themes`, or `<name>.themes` in a project. Outside a project, it refers to the types of [the Compose library](compose-library.md) (`xds.tokens`), and an app passes it as `XdsTheme(theme = BrandTheme)`. In a project, it refers to the project's own tokens (`orbit.tokens`), and the project's theme composable takes it the same way.

The TypeScript module exports `const <name>Theme: Theme` (`brand` becomes `brandTheme`). Outside a project, `Theme` comes from [the React Native library](react-native-library.md), and an app passes the value as `<XdsTheme theme={brandTheme}>`. In a project, it comes from the project's tokens (`@orbit/tokens`), and the project's theme provider takes it the same way.

The Rust file declares `pub const <NAME>_THEME: Theme` (`brand` becomes `BRAND_THEME`), with every token's value. Outside a project, `Theme` and the types it holds come from [the GPUI library](gpui-library.md) (`xds_ui::tokens`), and an app registers the constant as `xds_ui::set_theme(&brand::BRAND_THEME, cx)`. In a project, they come from the project's UI crate (`orbit_ui::tokens`), whose `set_theme` takes it the same way.

A theme that fails a contrast check is not written. The command then exits with 1 and reports the failures as `check-theme` does.

### `xds doctor`

Runs a set of health checks on a project and reports each one as `ok`, `warning`, `failed`, or `skipped`:

| Check | What it verifies |
| --- | --- |
| `record` | `.xds.json` is valid and references known targets |
| `tokens` | All token files parse cleanly and every alias resolves |
| `theme` | The palette matches one of the themes in `design/themes`, and it matches the theme named in the project record |
| `components` | Every component source file listed in `design/components.json` exists on disk, and every `differences` entry names known clients, a known kind, and clients or an input |
| `node` | A Node version capable of running the token generator is available on `PATH` |
| `generated` | The generated platform token files are up to date with the token sources |

The command exits with code 1 if any check fails. Warnings do not affect the exit code.

### `xds mcp`

Starts a [Model Context Protocol](https://modelcontextprotocol.io) server communicating over stdin and stdout. See [For scripts and agents](#for-scripts-and-agents).

## For scripts and agents

### JSON output

Every command accepts `--json`. When passed, the command writes a single JSON document to stdout with no other output and never prompts interactively (`create` behaves the same as when stdout is not a terminal).

```sh
xds list --json
xds create my-app --name orbit --targets web-react --dry-run --json
xds tokens color.text --json
```

Errors are written to stderr as a single JSON document:

```json
{ "error": { "kind": "error", "message": "There is no theme \"nope\". Themes: forest, indigo, ocean, plum, sunset" } }
```

`kind` is `error`, `usage` (for invalid arguments), or `cancelled`. A failing check (`doctor`, `check-theme`, `export-theme` or `contrast --min`) is treated as a normal result rather than an error: it is written to stdout with `"ok": false`.

### Exit codes

| Code | Meaning |
| --- | --- |
| 0 | The command succeeded |
| 1 | The command failed, or a check did not pass |
| 2 | Invalid command-line arguments |
| 130 | An interactive prompt was cancelled with Esc or Ctrl-C |

### AGENTS.md

This repository includes an `AGENTS.md` file that documents the design system rules for coding agents, along with a `CLAUDE.md` file that imports it. `xds create` writes both files into each generated project, tailoring `AGENTS.md` to list only the clients included in that project.

### Agent skill

`skills/xds` provides a skill in the [Agent Skills](https://agentskills.io) format. It shows coding agents how to use the CLI commands above and includes task-specific guides for scaffolding and themes, tokens, components, and verifying UI changes.

```sh
npx skills add kjmin-dev/xds
```

In Claude Code, this repository can also be added directly as a plugin marketplace:

```text
/plugin install xds --marketplace kjmin-dev/xds
```

### MCP server

`xds mcp` exposes the CLI commands as MCP tools for agents that cannot run shell commands directly. It communicates over stdio and is built on `rmcp`, the official Rust SDK.

```sh
claude mcp add xds -- xds mcp
```

```json
{ "mcpServers": { "xds": { "command": "xds", "args": ["mcp"] } } }
```

| Tool | Description |
| --- | --- |
| `list` | Lists the available targets and themes |
| `tokens` | Lists design tokens, optionally filtered by `query` and `tier` |
| `components` | Lists all components |
| `component` | Returns the details for a single component, including source code when `code` is true |
| `contrast` | Computes the contrast ratio between two colors or color tokens |
| `doctor` | Runs project health checks |
| `create`, `add`, `theme` | Scaffolds a project, adds targets, or applies a theme |

Each tool returns the same JSON payload as the corresponding CLI command with `--json`. `create`, `add`, and `theme` run in dry-run mode unless `"write": true` is passed. The read-only tools accept an optional `project` directory; when omitted, they inspect the server's working directory, or fall back to the embedded template if the working directory is not a project.

Agents with shell access do not need the MCP server; running the CLI commands with `--json` produces identical output.

## Targets

| Id | Runs on | Stack | Paths |
| --- | --- | --- | --- |
| `web-react` | Web | React 19, Vite, Tailwind v4, Zag.js | `apps/web`, `packages/ui`, and the shared `packages/ui-core` |
| `web-solid` | Web | SolidJS 2 (release candidate), Vite, Tailwind v4, Zag.js | `apps/web-solid`, `packages/ui-solid`, and the shared `packages/ui-core` |
| `web-vue` | Web | Vue 3, Vite, Tailwind v4, Zag.js | `apps/web-vue`, `packages/ui-vue`, and the shared `packages/ui-core` |
| `web-svelte` | Web | Svelte 5, Vite, Tailwind v4, Zag.js | `apps/web-svelte`, `packages/ui-svelte`, `.pnpmfile.cjs`, and the shared `packages/ui-core` |
| `desktop-electron` | macOS, Windows, Linux | Electron and the selected web app | `apps/desktop-electron` |
| `desktop-tauri` | macOS, Windows, Linux | Tauri 2 and the selected web app | `apps/desktop-tauri` |
| `desktop-gpui` | macOS | Rust, GPUI, GPUI Component | `apps/desktop`, `crates/acme-ui`, `crates/acme-tokens` |
| `mobile-react-native` | iOS, Android | React Native, Expo | `apps/mobile`, `packages/ui-native` |
| `kotlin-compose` | Android, iOS, desktop | Kotlin, Compose Multiplatform | `kotlin` |
| `dart-flutter` | Android, iOS | Dart, Flutter widgets | `flutter` |

The JavaScript targets share `packages/tokens` and the root pnpm workspace configuration. Their packages type-check with tsrs, an experimental Rust port of TypeScript 7.1 that also runs oxlint's type-aware rules, while editors keep TypeScript's own language server, pointed at the root `typescript` package. The two are exact pins that move together: `tools/check-tsrs.ts`, which comes with the workspace configuration, fails `mise run check:js` while they differ. The Vue packages check their `.vue` files with vue-tsc instead, on typescript-native-bridge from the `vue` catalog, which keeps the TypeScript 6 API that vue-tsc and Vite's compiler for `.vue` files need. The Svelte packages type-check with svelte-check instead, on the same TypeScript 7 under the catalog's `@typescript/native` alias; `web-svelte` brings `.pnpmfile.cjs`, which gives svelte-check the TypeScript 6 it still reads `.svelte` files with. The web targets also require the shared group `ui-core`, which is `packages/ui-core`: the prop types, class recipes, and stylesheet that the web libraries share, and the behavior tests that every web library runs. The web libraries take their behavior from Zag.js 2, a prerelease, so every `@zag-js` package is pinned to the same exact version. Every project must include at least one target. A desktop shell requires one of the four web targets.

The web targets can be combined in one project. Each has its own app directory, dev server port (5173 for `web-react`, 5174 for `web-solid`, 5175 for `web-vue`, 5176 for `web-svelte`), and `mise` alias (`//web`, `//web-solid`, `//web-vue`, `//web-svelte`), so `--targets all` creates the web apps side by side. `mise run compare:previews` compares the design previews of every web app in a project with each other, and has nothing to compare with one.

`web-react` is the default target: `xds create --yes` without `--targets` creates a project with it alone, and the interactive list starts with it selected. `xds list` marks it `(default)`, and `xds list --json` gives each target a `default` field.

## Themes

A theme is a JSON file in `design/themes` defining an accent color ramp and a neutral color ramp. Applying a theme replaces those two ramps in `design/tokens/palette.json`. Because semantic and component color tokens reference palette steps via aliases (`{palette.accent.600}`), they pick up the new colors automatically without being edited.

`xds themes` renders a side-by-side light and dark UI preview in the terminal for each theme, showing a sample page with a card, primary and secondary text, primary and secondary buttons, a link, an accent badge, the four status colors, and color swatches for the accent and neutral ramps. `xds` resolves the token alias chain itself (from component tokens to semantic tokens to palette steps), so rendering the preview does not require running the Node token generator.

In the interactive theme selector used by `xds create` and `xds theme`, the preview updates immediately as you move through the list.

- The preview uses 24-bit truecolor ANSI escapes by default. In macOS Terminal.app, it falls back to the 256-color palette unless `COLORTERM=truecolor` is set.
- In terminals narrower than 80 columns, the light and dark previews stack vertically. In short terminal windows, the preview compacts to a single line per mode plus the two color ramps.
- When color output is disabled (`--no-color`, `NO_COLOR`, or non-TTY stdout), the command prints a plain-text table of hex color values.
- To capture the colored ANSI preview to a file, run `FORCE_COLOR=1 xds themes > themes.ansi`.

When applying a theme that differs from the one currently in the palette, `xds`:

1. Updates `design/tokens/palette.json` using the same layout produced by `tools/design-build`. `xds theme ocean` and `mise run theme ocean` produce identical files.
2. Regenerates the platform token files by running `node tools/design-build/src/build.ts`, if `node` 22.18 or newer is on `PATH`.

If a compatible Node version is not available, step 2 is skipped and `xds` notes that the generated files are out of date. Running `mise run tokens` in the project regenerates them. This also happens when `node` points to a mise shim and the project's `mise.toml` has not been trusted yet; run `mise trust` first.

If the token generator rejects a theme (for example, because a color pairing falls below its contrast threshold), `xds theme` restores the previous palette and leaves the project unchanged.

## How the template is filtered

`template.json` at the repository root defines which paths belong to which client stack:

| Key | Meaning |
| --- | --- |
| `placeholder` | Placeholder project name used in the template (`acme`, `Acme`). Its uppercase form (`ACME`) is also replaced |
| `defaultTheme` | Theme whose color ramps are stored in `design/tokens/palette.json` in the template repository |
| `exclude` | Repository paths that stay in this template repository and are never embedded in the binary |
| `common` | Paths included in every generated project |
| `shared` | Named groups of paths shared by multiple targets, such as `js-workspace` |
| `targets` | Per-stack definitions: `id`, `default` (`true` for a target that `create --yes` includes and the interactive list starts with selected; at least one target is a default), `title`, `stack`, `platforms`, `input` (`pointer` or `touch`: the input its components are designed for, which `differences` in the component contract can name), `paths`, `requires` (names of `shared` groups), `outputs` (kinds of generated token files the stack reads, matching the keys of `design/build.json`), `format` (the command that formats its code, if any), and `run` (commands shown after `create`) |

Shared configuration files use conditional comment blocks to include lines only when specific targets are selected. A comment line `@if <names>` opens a block and `@endif` closes it. Each name is a target ID or the name of a `shared` group:

```toml
[tools]
node = "26.13.1"
# @if js-workspace
pnpm = "12.19.0"
# @endif
# @if desktop-gpui
rust = { version = "1.100.0", components = "rustfmt,clippy" }
# @endif
```

- A conditional block is kept when any of its listed targets is selected, or when any selected target lists one of its `shared` groups in `requires`. The marker lines themselves are stripped from the generated project.
- Name the `shared` group when a block serves everything that uses the group, such as the pnpm version for `js-workspace`, so that a new target requiring the group gets the block without the marker being changed. Name targets when a block is about those targets themselves. No name may be both a target ID and a `shared` group.
- Blocks can be nested and can wrap individual elements inside multi-line arrays.
- Each marker must occupy its own full comment line. `#`, `//`, `<!-- -->`, and `/* */` comment styles are supported; `cli/src/markers.rs` lists them.
- `@if template` marks lines needed only in this repository, such as the `cli` workspace member and the CLI's CI job. `template` is never selected in generated projects.
- A marker that references an unknown target ID or `shared` group is an error, and the test suite renders every combination of targets so a typo cannot silently drop a block.

Within this repository, marker lines act as ordinary comments so every block remains active.

Files under `cli/overlay` are written over the generated project root with the same conditional block filtering and placeholder renaming. That is where the generated project's `README.md`, `AGENTS.md`, and `CLAUDE.md` come from.

`design/components.json` is cut down like `design/build.json`: a project gets the components its clients have, each with the source files of those clients only, and only the `differences` that concern one of them.

Binary files (detected by a NUL byte within the first 8 KB) are copied verbatim.

## Adding a client stack

1. Add the client code, using the `acme` placeholder for names in both file contents and file paths.
2. If the stack consumes a new format of generated token file, add an emitter to `tools/design-build` and an entry to `design/build.json`.
3. Add a target entry to `template.json`: its `input`, its `paths`, the `shared` groups it `requires`, the `outputs` it reads, and its `run` commands. Include a `format` command if the stack has a formatter enforced by `mise run check`.
4. Wrap any stack-specific additions to the shared root files (`mise.toml`, `.github/workflows/ci.yml`, `.gitignore`, `.gitattributes`, `Cargo.toml`, `pnpm-workspace.yaml`, `cli/overlay/README.md`) in `@if <id>` blocks. Blocks marked with a `shared` group the stack requires, such as `@if js-workspace`, already include it.
5. List the stack's components in `design/components.json`, with the source file and the symbol of each.
6. Run `cargo test -p xds`. The tests fail if any repository file belongs to no target, shared group, `common`, or `exclude`; if any conditional marker is unbalanced or references an unknown target or shared group; or if `mise.toml` or `Cargo.toml` is not valid TOML for any combination of targets. Add the new target's expectations to `shared_files_are_valid_for_every_combination_of_targets` in `cli/src/tests.rs`.

No Rust code changes are needed when adding a stack that follows this structure.

## Releasing

The release train uses the version in `cli/Cargo.toml` for the CLI, the generated theme contract and the npm packages. Run `mise run tokens` after changing that version. Add channel-labelled entries under `## Unreleased` in the root `CHANGELOG.md` as changes land. Before tagging, move those entries under a heading such as `## 0.1.0` and commit the changelog and generated contract. The tag workflow requires one nonempty section with the exact version and publishes that section as its release notes. A prerelease tag produces a GitHub prerelease and uses npm’s `next` tag.

Push the matching tag when the release is ready.

```sh
git tag v0.1.0
git push origin v0.1.0
```

`.github/workflows/release.yml` builds the release binary for five targets (`aarch64-apple-darwin`, `x86_64-apple-darwin`, `x86_64-unknown-linux-musl`, `aarch64-unknown-linux-musl`, `x86_64-pc-windows-msvc`), attaches `xds-<target>.tar.gz` and its `.sha256` checksum to a GitHub release, and publishes the npm packages. Publishing requires an `NPM_TOKEN` repository secret, a token that may publish new packages without a one-time password.

The same workflow publishes the libraries once their consumer checks pass: the web packages and the React Native package to npm, the Compose library to Maven Central, and the GPUI crates to crates.io. crates.io requires `CARGO_REGISTRY_TOKEN`, an API token of the account that owns the crates, scoped to `publish-new` and `publish-update`. Maven Central requires four more secrets: `MAVEN_CENTRAL_USERNAME` and `MAVEN_CENTRAL_PASSWORD`, a user token from the Central Portal account that owns the `io.github.kjmin-dev` namespace, and `SIGNING_KEY` and `SIGNING_PASSWORD`, an ASCII-armored PGP secret key and its passphrase. The key's public half must be on a public key server, where Central looks for it.

`npm/publish.ts` publishes each channel's npm packages in dependency order, `maven/upload.ts` sends the Compose library to Central, and `crates-io/publish.ts` publishes the GPUI crates. Each skips a version the registry already has, so a release that failed partway can be run again.

To build the npm packages locally without publishing:

```sh
mise run build:cli
mkdir -p /tmp/xds-binaries/aarch64-apple-darwin
cp target/dist/xds /tmp/xds-binaries/aarch64-apple-darwin/
node npm/build-packages.mjs --binaries /tmp/xds-binaries      # writes npm/dist
node npm/publish.ts cli --dry-run                             # packs them as npm would publish them, and checks NPM_TOKEN
```

The script builds a platform package for each Rust target binary it finds and stamps the version from `cli/Cargo.toml` onto every package. It replaces `npm/dist`, where the libraries' builds also write.

### Rehearsing a release

Run the release workflow by hand on the commit you mean to tag, before tagging it and after changing a secret:

```sh
gh workflow run release.yml --ref main
```

A run started by hand (also Actions > Release > Run workflow) is a rehearsal of a release at the version in `cli/Cargo.toml`. Every job runs as it would for the tag: the five binaries are built, and each library is built and goes through its whole consumer check, on the Android emulator and for iOS too. Nothing is created or published. Each publishing step is rehearsed instead:

- npm packs every package as it would publish it, and must accept `NPM_TOKEN`;
- the Compose library is signed with `SIGNING_KEY`, and Maven Central validates the bundle as it would before publishing it, including the namespace and the signatures against the key servers; the rehearsal then drops the deployment;
- cargo packages the GPUI crates as it would publish them, and crates.io must let `CARGO_REGISTRY_TOKEN` publish each of them;
- the summary of the GitHub release job shows the release the tag would create, with its files and notes.

The rehearsal fails when a secret is missing or refused, and names every one. It warns, without failing, when `CHANGELOG.md` has no section for the version yet or the version is already released.
