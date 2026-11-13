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

Lists the available client stacks and color themes.

```console
$ xds list
Targets
  web-react            Web                             React 19, Vite, Tailwind v4, HeroUI v3
  desktop-gpui         Desktop (macOS)                 Rust, GPUI, GPUI Component
  mobile-react-native  Mobile (iOS, Android)           React Native, Expo
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
2. The client targets to include (multi-select list: Up and Down or `k` and `j` to move, Space to toggle, `a` to toggle all, Enter to confirm).
3. The color theme (select list with a live preview rendered below it; see [Themes](#themes)).

Pressing Esc or Ctrl-C cancels the prompt at any point. No files are written until the final prompt is confirmed.

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
| `--targets` | Comma-separated target IDs, or `all` |
| `--theme` | Theme name. Defaults to `indigo` |
| `--yes`, `-y` | Skip interactive prompts and use defaults for any omitted flags: the project name comes from the directory name, all targets are included, and the theme defaults to `indigo` |
| `--dry-run` | Print the file paths that would be written without writing anything to disk |
| `--force` | Allow scaffolding into a non-empty directory. Existing files at matching paths are overwritten, while unrelated files are left untouched |

When stdout is not a terminal (for example, in a script or CI job), there is no way to prompt interactively. In that case, `--name` and `--targets` are required unless `--yes` is passed, and the error message lists any missing flags.

What a scaffolded project contains:

- The files for the selected targets along with shared project files: `design/`, `tools/design-build/`, `mise.toml`, the CI workflow, and `docs/design-system.md`. Selecting any JavaScript target also includes the pnpm workspace configuration and `packages/tokens`. Selecting the desktop target includes the Cargo workspace configuration.
- Only the generated token files consumed by the selected targets. `design/build.json` is filtered to those outputs so `mise run tokens` does not generate files for unused stacks.
- Root configuration files trimmed to match the selection: `mise.toml` includes only the relevant tools and tasks, and the CI workflow includes only the relevant jobs.
- A project `README.md` with the run commands for the selected stacks.
- `.xds.json`, which records the `xds` version, project name, title, targets, and theme for use by `xds add` and `xds theme`.

Files specific to maintaining this template repository are excluded: this repository's own README, license, contributing guide, the CLI itself, and lockfiles. Because a scaffolded project contains a custom subset of workspace packages, it needs its own lockfiles; running `mise run check` for the first time resolves dependencies and generates them.

Run `mise run fmt` once before running `mise run check` for the first time. The template source is formatted for the placeholder name `acme`; substituting a different project name can push lines past the formatter's line-length limit or change alphabetical import ordering (such as `orbit_tokens`), causing the formatting check in `mise run check` to fail until the formatter has been run. Projects that only include the Kotlin stack do not have a `fmt` task and can skip this step.

When `--title` contains spaces, `Acme` inside code identifiers is replaced with the space-stripped title: `--title "Orbit Notes"` turns `AcmeTheme` into `OrbitNotesTheme` while turning `<title>Acme</title>` into `<title>Orbit Notes</title>`.

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

Lists all components and the clients that implement them, or shows the details of a single component.

```sh
xds components                              # all of them
xds components Button                       # options, states, tokens, and the source file per client
xds components Button --client web-react    # one client only
xds components Button --code                # with the source code
```

This information comes from `design/components.json`, the component contract, which records each component's purpose, options, states, accessibility notes, and the source file and symbol that implement it on each client. In a project created with `xds create`, the contract is filtered down to that project's clients.

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

### `xds doctor`

Runs a set of health checks on a project and reports each one as `ok`, `warning`, `failed`, or `skipped`:

| Check | What it verifies |
| --- | --- |
| `record` | `.xds.json` is valid and references known targets |
| `tokens` | All token files parse cleanly and every alias resolves |
| `theme` | The palette matches one of the themes in `design/themes`, and it matches the theme named in the project record |
| `components` | Every component source file listed in `design/components.json` exists on disk |
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

`kind` is `error`, `usage` (for invalid arguments), or `cancelled`. A failing check (`doctor` or `contrast --min`) is treated as a normal result rather than an error: it is written to stdout with `"ok": false`.

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
| `web-react` | Web | React 19, Vite, Tailwind v4, HeroUI v3 | `apps/web`, `packages/ui` |
| `desktop-gpui` | macOS | Rust, GPUI, GPUI Component | `apps/desktop`, `crates/acme-ui`, `crates/acme-tokens` |
| `mobile-react-native` | iOS, Android | React Native, Expo | `apps/mobile`, `packages/ui-native` |
| `kotlin-compose` | Android, iOS, desktop | Kotlin, Compose Multiplatform | `kotlin` |

The two JavaScript targets share `packages/tokens` and the root pnpm workspace configuration. Every project must include at least one target.

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
| `targets` | Per-stack definitions: `id`, `title`, `stack`, `platforms`, `paths`, `requires` (names of `shared` groups), `outputs` (kinds of generated token files the stack reads, matching the keys of `design/build.json`), `format` (the command that formats its code, if any), and `run` (commands shown after `create`) |

Shared configuration files use conditional comment blocks to include lines only when specific targets are selected. A comment line `@if <target ids>` opens a block and `@endif` closes it:

```toml
[tools]
node = "26.13.1"
# @if web-react mobile-react-native
pnpm = "12.19.0"
# @endif
# @if desktop-gpui
rust = { version = "1.99.1", components = "rustfmt,clippy" }
# @endif
```

- A conditional block is kept when any of its listed targets is selected. The marker lines themselves are stripped from the generated project.
- Blocks can be nested and can wrap individual elements inside multi-line arrays.
- Each marker must occupy its own full comment line. `#`, `//`, `<!-- -->`, and `/* */` comment styles are supported; `cli/src/markers.rs` lists them.
- `@if template` marks lines needed only in this repository, such as the `cli` workspace member and the CLI's CI job. `template` is never selected in generated projects.
- A marker that references an unknown target ID is an error, and the test suite renders every combination of targets so a typo cannot silently drop a block.

Within this repository, marker lines act as ordinary comments so every block remains active.

Files under `cli/overlay` are written over the generated project root with the same conditional block filtering and placeholder renaming. That is where the generated project's `README.md`, `AGENTS.md`, and `CLAUDE.md` come from.

`design/components.json` is cut down like `design/build.json`: a project gets the components its clients have, each with the source files of those clients only.

Binary files (detected by a NUL byte within the first 8 KB) are copied verbatim.

## Adding a client stack

1. Add the client code, using the `acme` placeholder for names in both file contents and file paths.
2. If the stack consumes a new format of generated token file, add an emitter to `tools/design-build` and an entry to `design/build.json`.
3. Add a target entry to `template.json`: its `paths`, the `shared` groups it `requires`, the `outputs` it reads, and its `run` commands. Include a `format` command if the stack has a formatter enforced by `mise run check`.
4. Wrap any stack-specific additions to the shared root files (`mise.toml`, `.github/workflows/ci.yml`, `.gitignore`, `.gitattributes`, `Cargo.toml`, `pnpm-workspace.yaml`, `cli/overlay/README.md`) in `@if <id>` blocks.
5. List the stack's components in `design/components.json`, with the source file and the symbol of each.
6. Run `cargo test -p xds`. The tests fail if any repository file belongs to no target, shared group, `common`, or `exclude`; if any conditional marker is unbalanced or references an unknown target; or if `mise.toml` or `Cargo.toml` is not valid TOML for any combination of targets. Add the new target's expectations to `shared_files_are_valid_for_every_combination_of_targets` in `cli/src/tests.rs`.

No Rust code changes are needed when adding a stack that follows this structure.

## Releasing

Update the version in `cli/Cargo.toml`, then push a git tag with the matching version:

```sh
git tag v0.1.0
git push origin v0.1.0
```

`.github/workflows/release.yml` builds the release binary for five targets (`aarch64-apple-darwin`, `x86_64-apple-darwin`, `x86_64-unknown-linux-musl`, `aarch64-unknown-linux-musl`, `x86_64-pc-windows-msvc`), attaches `xds-<target>.tar.gz` and its `.sha256` checksum to a GitHub release, and publishes the npm packages. Publishing requires an `NPM_TOKEN` repository secret.

To build the npm packages locally without publishing:

```sh
mise run build:cli
mkdir -p /tmp/xds-binaries/aarch64-apple-darwin
cp target/dist/xds /tmp/xds-binaries/aarch64-apple-darwin/
node npm/build-packages.mjs --binaries /tmp/xds-binaries      # writes npm/dist
```

The script builds a platform package for each Rust target binary it finds and stamps the version from `cli/Cargo.toml` onto every package.
