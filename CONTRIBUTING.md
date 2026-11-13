# Contributing

## Setup

Install [mise](https://mise.jdx.dev), then pull the toolchain and run the checks:

```sh
mise install
mise run check
```

`mise run check` runs the same suite as CI, so make sure it passes locally before opening a pull request.

## Rules for a change

- When you edit tokens, run `mise run tokens` and commit the generated files alongside your changes. CI will fail if the generated output is out of date.
- Keep the component set in sync across platforms. If you add a component, variant, or tone, add it under the same name to every platform's library and to each design preview.
- Put component colors in tokens rather than hardcoding them. Each component reads its colors from its own group in `color.light.json` and `color.dark.json`, and every foreground/background pairing it renders needs an entry in `tools/design-build/src/contrast.ts`.
- Check the design preview by hand. Because there is no automated screenshot comparison, open the preview in both light and dark mode on every platform you touched.

## Style

Run `mise run fmt` to format the codebase. Keep code comments focused on why something is done a certain way, not what the code is doing.
