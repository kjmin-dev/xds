# Changelog

## Unreleased

- **Web library** — The first web channel: `@xds/react`, `@xds/solid`, `@xds/vue` and `@xds/svelte`, with `@xds/core` and `@xds/tokens`, published under the `preview` dist-tag while Zag.js 2 is a prerelease. Each framework package has a finished stylesheet in the `xds` cascade layer that styles only the library's own elements, a stylesheet for apps with Tailwind CSS 4.1 or later, and an optional page stylesheet. `@xds/tokens/themes/<name>.css` applies a preset with `data-xds-theme`. See [the web library](docs/web-library.md).
- **CLI** — `xds export-theme <file>` checks a theme file and writes it as a stylesheet: for the web library outside a project, or with the project's names inside one.
- **Web scaffold** — Every component takes a class (`className` in React) and a style on its root element, which carries a stable root part class such as `acme-button`. A `Defaults` component sets the variant, size, tone, shape, ratio or layout that the components inside it take by default. The part classes of the components drawn with a stylesheet now start with the project's name (`.button` is `.acme-button`, `.dialog__title` is `.acme-dialog__title`), and so does `--acme-layer-overlay`. `data-theme` sets the color mode on any element, not only on the root element.

- **CLI and all library channels** — The theme contract lists the public color, size and foundation tokens and their types. `xds check-theme` validates custom themes and reports failing contrast pairs in light and dark mode, including glass surfaces.
- **CLI** — New projects retain the version of xds that created them when adding targets with a later CLI.
