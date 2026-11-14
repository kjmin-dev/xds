---
name: xds
description: Work with a design system made from the xds template (one set of design tokens, with matching component libraries for React and Solid on the web, GPUI desktop, React Native, and Compose Multiplatform). Use when scaffolding a project with the xds CLI, adding a client, switching the color theme, adding or changing a design token, adding a component or a variant across clients, or checking a UI change in the design preview. Applies to any repository that has design/tokens and an .xds.json or template.json file.
license: MIT
---

# xds

An xds project stores all design decisions in `design/tokens` and compiles them into platform-specific token files for each client. Every client has a component library built exclusively on those tokens, and all client libraries implement a shared contract: the same components, variants, sizes, and tones under identical names.

## Start here

1. Read `AGENTS.md` at the repository root to see which client stacks and commands the project includes.
2. Query the CLI instead of reading design files by hand. Every command supports `--json`.

| Question | Command |
| --- | --- |
| Which clients and themes are available? | `xds list --json` |
| What are a token's resolved values in light and dark modes? | `xds tokens <query> --json` |
| Which components exist, and where is each implemented? | `xds components --json`, `xds components Button --code --json` |
| Does a foreground/background color pair meet WCAG contrast requirements? | `xds contrast text.secondary background.surface --min 4.5 --json` |
| Is the project in a valid, consistent state? | `xds doctor --json` |

When run inside a project directory, these commands inspect the project's own files. Outside a project, they inspect the template embedded in `xds`. If `xds` is not installed, you can read the underlying data in `design/tokens/*.json` and `design/components.json`.

Exit codes: 0 for success, 1 for an execution error or failed check, 2 for invalid arguments, and 130 when an interactive prompt is cancelled. With `--json`, errors are written to stderr as `{"error": {"kind": "...", "message": "..."}}`.

## Rules that always hold

- Design tokens are the source of truth. Never edit generated token files directly. Edit `design/tokens`, run `mise run tokens`, and commit both the source and generated files.
- Never hardcode hex colors in screens or components. Use a semantic color token; colors needed by only one component belong in that component's group in both `color.light.json` and `color.dark.json`.
- Every foreground and background color pair rendered together must be registered in `tools/design-build/src/contrast.ts`.
- Every component, variant, size, and tone must use the same name across all clients in the project, appear in each client's design preview, and be recorded in `design/components.json`.
- Always finish by running `mise run check`, which executes the full CI suite.

## Tasks

Consult the guide for your specific task:

| Task | Reference |
| --- | --- |
| Scaffold a project, add a client, or switch or create a theme | [references/scaffolding.md](references/scaffolding.md) |
| Add or modify a token and register its contrast pairings | [references/tokens.md](references/tokens.md) |
| Add a component, variant, or tone across all clients | [references/components.md](references/components.md) |
| Verify a UI change in the design previews without manual interaction | [references/verifying.md](references/verifying.md) |
