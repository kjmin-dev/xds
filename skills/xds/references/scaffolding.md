# Scaffolding, clients, and themes

## Create a project

```sh
xds create my-app --name orbit --targets web-react,kotlin-compose --theme ocean --json
```

- `--name` is lowercase letters and digits, starting with a letter. It replaces the `acme` placeholder everywhere: `@orbit/ui`, `orbit-ui`, `--orbit-color-*`, `orbit.tokens`.
- `--targets` takes ids from `xds list`, or `all`: `web-react`, `desktop-gpui`, `mobile-react-native`, `kotlin-compose`.
- Add `--dry-run` first to see the files without writing them.
- Without a terminal, `--name` and `--targets` are required unless `--yes` is passed. With `--json` nothing is ever asked.

Then, in the project:

```sh
mise trust
mise install
mise run fmt      # once, when the project has a fmt task: the new name changes line lengths and import order
mise run check
```

The `nextSteps` field of the JSON result lists these commands for the chosen clients.

## Add a client later

```sh
xds add desktop-gpui --json
```

Run it in the project, or pass `--project <dir>`. Files of the new client are written. A shared file such as `mise.toml` is replaced only if the project has not changed it; otherwise the new version is written next to it as `<file>.xds-new` and listed under `conflicts`. Merge those by hand and delete the `.xds-new` files.

## Switch the theme

```sh
xds theme sunset --json        # or, without xds: mise run theme sunset
```

A theme is an accent ramp and a neutral ramp in `design/themes/<name>.json`. Applying one rewrites those two ramps in `design/tokens/palette.json` and regenerates the token files. The `tokens` field says `regenerated`, or `stale` when Node was not available; in that case run `mise run tokens`.

## Make a theme

Do not pick the colors by hand. Derive the theme from the reference, which keeps every contrast ratio:

```sh
node tools/design-build/src/make-theme.ts coral --hue 25 --description "Warm coral."
mise run theme coral
```

`--chroma` and `--neutral-chroma` scale how vivid the accent and the neutrals are (1 is as vivid as the reference, 0 is grey). `--neutral-hue` gives the neutrals a different tint from the accent.
