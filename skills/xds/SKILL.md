---
name: xds
description: Work with a design system made from the xds template (one set of design tokens, with matching component libraries for React web, GPUI desktop, React Native, and Compose Multiplatform). Use when scaffolding a project with the xds CLI, adding a client, switching the color theme, adding or changing a design token, adding a component or a variant across clients, or checking a UI change in the design preview. Applies to any repository that has design/tokens and an .xds.json or template.json file.
license: MIT
---

# xds

An xds project keeps its design decisions in `design/tokens` and generates a token file for each client from them. Every client has a component library that draws only from those tokens, and the libraries share one contract: the same components, variants, sizes, and tones under the same names.

## Start here

1. Read `AGENTS.md` at the root of the project. It lists the clients this project has and its commands.
2. Ask the CLI rather than reading files by hand. Every command takes `--json`.

| Question | Command |
| --- | --- |
| Which clients and themes exist? | `xds list --json` |
| What is the value of a token, in light and dark? | `xds tokens <query> --json` |
| Which components exist, and where is one implemented? | `xds components --json`, `xds components Button --code --json` |
| Does this pairing have enough contrast? | `xds contrast text.secondary background.surface --min 4.5 --json` |
| Is the project in a consistent state? | `xds doctor --json` |

Run inside a project, these read the project's own files. Anywhere else they describe the template built into `xds`. If `xds` is not installed, the same facts are in `design/tokens/*.json` and `design/components.json`.

Exit codes: 0 success, 1 a failure or a check that did not pass, 2 wrong arguments, 130 a cancelled prompt. With `--json`, errors are JSON on stderr: `{"error": {"kind": "...", "message": "..."}}`.

## Rules that always hold

- Tokens are the source. Never edit a generated token file. Edit `design/tokens`, run `mise run tokens`, and commit both.
- No hex colors in screens or components. Use a semantic color token; a color only one component needs goes in that component's group in both `color.light.json` and `color.dark.json`.
- Every foreground and background drawn together has an entry in `tools/design-build/src/contrast.ts`.
- A component, variant, size, or tone has the same name on every client the project has, appears in each design preview, and is listed in `design/components.json`.
- Finish with `mise run check`. It runs what CI runs.

## Tasks

Read the reference for the task at hand:

| Task | Reference |
| --- | --- |
| Create a project, add a client, switch or make a theme | [references/scaffolding.md](references/scaffolding.md) |
| Add or change a token, with its contrast pairing | [references/tokens.md](references/tokens.md) |
| Add a component, a variant, or a tone on every client | [references/components.md](references/components.md) |
| Look at a UI change without a person at the screen | [references/verifying.md](references/verifying.md) |
