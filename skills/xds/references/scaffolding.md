# Scaffolding, clients, and themes

## Create a project

```sh
xds create my-app --name orbit --targets web-react,kotlin-compose --theme ocean --json
```

- `--name` must start with a lowercase ASCII letter followed by lowercase letters or digits. It replaces the `acme` placeholder throughout the project (`@orbit/ui`, `orbit-ui`, `--orbit-color-*`, `orbit.tokens`).
- `--targets` accepts a comma-separated list of target IDs from `xds list` (`web-react`, `desktop-gpui`, `mobile-react-native`, `kotlin-compose`), or `all`.
- Pass `--dry-run` first to preview the files that would be generated without writing to disk.
- In non-interactive environments, `--name` and `--targets` are required unless `--yes` is passed. `--yes` fills in what is missing with the defaults: the directory name, the default targets (only `web-react`; `xds list --json` marks them with `"default": true`), and the default theme. Pass `--targets` for any other client. Passing `--json` always disables interactive prompts.

After scaffolding, initialize the project directory:

```sh
mise trust
mise install
mise run fmt      # once, when the project has a fmt task: the new name changes line lengths and import order
mise run check
```

The `nextSteps` field in the JSON output lists the exact initialization commands for the selected targets.

## Add a client later

```sh
xds add desktop-gpui --json
```

Run this command from the project root, or pass `--project <dir>`. It writes all files belonging to the new client stack. Shared configuration files such as `mise.toml` are updated in place only if they have not been modified since the project was created; otherwise, the updated file is written alongside the existing one as `<file>.xds-new` and reported in the `conflicts` array. Merge any conflicts manually and delete the `.xds-new` files.

## Switch the theme

```sh
xds theme sunset --json        # or, without xds: mise run theme sunset
```

Each theme defines an accent color ramp and a neutral color ramp in `design/themes/<name>.json`. Applying a theme updates those two ramps in `design/tokens/palette.json` and regenerates the platform token files. In the JSON output, the `tokens` field is `regenerated` when the token files were rebuilt, or `stale` if Node was unavailable (in which case you should run `mise run tokens`).

## Make a theme

Do not choose theme hex colors by hand. Generate new themes from the reference theme so that all WCAG contrast ratios are preserved:

```sh
node tools/design-build/src/make-theme.ts coral --hue 25 --description "Warm coral."
mise run theme coral
```

`--chroma` and `--neutral-chroma` scale the saturation of the accent and neutral ramps (where 1 matches the reference theme's saturation and 0 produces pure grey). `--neutral-hue` sets a separate hue angle for the neutral ramp instead of using the accent hue.
