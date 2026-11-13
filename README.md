# Cross-platform design system template

[한국어](README.ko.md)

This template is a starting point for products that ship on more than one client. A single set of design tokens feeds a component library on each platform, paired with a small app wired up to use it.

| Client | Stack | Components | App |
| --- | --- | --- | --- |
| Web | React 19, Vite, Tailwind v4, HeroUI v3 | `packages/ui` | `apps/web` |
| Desktop | Rust, GPUI, GPUI Component | `crates/acme-ui` | `apps/desktop` |
| Mobile | React Native, Expo | `packages/ui-native` | `apps/mobile` |

`acme` is a placeholder name—replace it with your own project's name.

## What is in it

- `design/tokens` holds the design tokens in DTCG format: a color palette, light and dark semantic colors, component-specific colors, type roles, spacing, border radius, motion, and control sizes for pointer and touch input.
- `tools/design-build` compiles those tokens into CSS custom properties, a Tailwind theme, TypeScript constants, and Rust constants. If any color pairing falls below its required WCAG contrast ratio, the build fails.
- Every platform implements the same components with matching names and options: Button, TextField, Text, Badge, Banner, Card, Divider, and Spinner.
- Each app includes a design preview screen that renders all tokens and components in one place.

See [the design system doc](docs/design-system.md) for the reasoning behind how the system is structured.

## Getting started

Install [mise](https://mise.jdx.dev) to pull in the pinned versions of Node, pnpm, and Rust:

```sh
mise install
mise run check          # everything CI runs
```

| Task | Command |
| --- | --- |
| Start the web app | `mise run //web:dev`, then open `http://localhost:5173` |
| Open the web design preview | Visit `http://localhost:5173/design` |
| Start the desktop app | `mise run //desktop:dev` |
| Open the desktop design preview | `mise run //desktop:design` |
| Start the mobile app | `mise run //mobile:ios` or `mise run //mobile:android` |
| Regenerate token files | `mise run tokens` |
| Format the codebase | `mise run fmt` |

The desktop app builds on macOS. On mobile, you can open the design preview from the button on the home screen.

## Changing the design

1. Edit the token JSON files in `design/tokens`.
2. Run `mise run tokens` to regenerate the platform files. The build will fail if a token is malformed or if a color pairing drops below its contrast threshold.
3. Commit both the token JSON files and the generated output.

## Layout

```text
design/tokens/          the source of truth
tools/design-build/     tokens to platform files, plus the contrast check
packages/tokens/        generated CSS and TypeScript
packages/ui/            web components
packages/ui-native/     React Native components
crates/acme-tokens/     generated Rust
crates/acme-ui/         GPUI components
apps/web/               React app
apps/desktop/           GPUI app
apps/mobile/            Expo app
```

## License

[MIT](LICENSE)
