---
title: Getting started
description: Create a new xds project, run it locally, and customize the design.
---

xds is a template rather than a package dependency. Running `xds create` copies the design tokens, component libraries, and a small app for each selected client into a repository you can edit directly.

## Create a project

No release of `xds` has been published yet. Until the first release, build it from a local checkout:

```sh
git clone https://github.com/kjmin-dev/xds && cd xds
mise install
cargo install --path cli
```

Then create a new project:

```sh
xds create my-app
```

By default, `xds` prompts for a project name, the clients to include, and a color theme. Each prompt starts at its default: the directory name, the `web-react` client, and the `indigo` theme. To skip the prompts, pass those options as flags, or pass `--yes` to take the defaults:

```sh
xds create my-app --name orbit --targets web-react,kotlin-compose --theme ocean
xds create my-app --yes
```

The available clients are:

| Target | Runs on | Stack |
| --- | --- | --- |
| `web-react` | Browsers | React 19, Vite, Tailwind v4, HeroUI v3 |
| `web-solid` | Browsers | SolidJS 2 (release candidate), Vite, Tailwind v4, Zag.js |
| `desktop-gpui` | macOS | Rust, GPUI, GPUI Component |
| `mobile-react-native` | iOS, Android | React Native, Expo |
| `kotlin-compose` | Android, iOS, desktop | Kotlin Multiplatform, Compose Multiplatform |

The two web clients can be combined in one project; each has its own app, port, and `mise` alias.

## Run it

The project uses [mise](https://mise.jdx.dev) to pin tool versions and run tasks:

```sh
cd my-app
mise trust
mise install
mise run fmt
mise run check
```

Run `mise run fmt` once before the first `mise run check`, because substituting the project name can change line lengths and import order. With a web client, `mise run check` also tests the web components in Google Chrome, which has to be installed. `xds` also prints the command to start each selected client, such as `mise run //web:dev`.

Each app includes a design preview that displays all tokens and components on a single screen.

## Change the design

1. Edit the token files under `design/tokens`, or switch the color theme with `xds theme <name>`.
2. Run `mise run tokens` to regenerate the platform files. The build fails if a token is malformed or if a color pairing falls below its contrast threshold.
3. Commit both the updated token files and the generated files.

## Where to go next

- [Commands](/cli/commands/) documents every `xds` command and flag.
- [How it fits together](/design-system/overview/) explains the token tiers and component contract.
- [Colors](/tokens/colors/) lists all color tokens and their light and dark values.
