# The web library

The xds components for React, Solid, Vue and Svelte are published on npm. These are the same components, stylesheet and tokens that `xds create` copies into a project, built and renamed for apps that do not use the scaffold. The design behind them is in [xds as a library](library.md).

| Package | Contents |
| --- | --- |
| `@xds/react`, `@xds/solid`, `@xds/vue`, `@xds/svelte` | The components, their design preview at `./preview`, and the stylesheets |
| `@xds/core` | Code shared by the four frameworks. Each framework package depends on it |
| `@xds/tokens` | The tokens as CSS custom properties and TypeScript constants, and the preset themes |

The web channel has `preview` stability while its behavior library, Zag.js 2, is in prerelease. Until then, its packages are published under the `preview` dist-tag:

```sh
npm install @xds/react@preview
```

The framework is a peer dependency, at the version the release was tested with or a later one of the same major: React 19.3.0, Vue 3.5.45, Svelte 5.57.3, or Solid 2.0.0-rc.21. Nothing else from xds is required: no token build, no CLI and no Tailwind CSS.

## Use the components

Import the stylesheet once, then the components:

```tsx
import "@xds/react/styles.css";
import { Button, Dialog } from "@xds/react";
```

The Solid package's `solid` export condition provides components with uncompiled JSX, which Solid's Vite plugin compiles for the DOM or the server. Other tools use the DOM build. The Svelte package contains Svelte components that the app's own compiler compiles.

`@xds/<framework>/page.css` gives the page the background, text color, font and type size of a scaffolded app. Without it, the page keeps its own styles, and each component uses the library font and colors.

## Styles stay out of the app's way

- Every rule in `styles.css` is in the `xds` cascade layer or a layer inside it. Styles outside a layer always win over it. Layers declared after `xds` also win. To keep the `xds` layer first, import `styles.css` before the app's own CSS or declare `@layer xds;` first.
- The stylesheet styles only the library's own elements: those with a class starting with `xds-` and their contents. Tailwind's reset (preflight) and the library font apply only there. Content passed to a component is reset like the component's own elements.
- Utilities use fixed values and the library tokens (`--xds-*`). They use no global Tailwind variables such as `--spacing` that the app could redefine. Animation keyframes use the `xds-` prefix.
- Part classes use the `xds-` prefix (`xds-button`, `xds-dialog__title`), so a generic class such as `.button` or `.card` in the app is never styled by the library.

### With Tailwind CSS in the app

An app with Tailwind CSS 4.1 or later can share Tailwind utilities with the library instead of loading them twice. To do this, import `tailwind.css` before Tailwind:

```css
@import "@xds/react/tailwind.css";
@import "tailwindcss";
```

This file orders the layers as `theme, base, xds, components, utilities`. It provides the tokens as Tailwind theme values (`bg-xds-accent-default`, `rounded-xds-lg`) and names every utility the library uses, so the app's Tailwind generates them. The app's own Tailwind theme then applies to those utilities.

## Customization

The layers below follow [Customization](library.md#customization). Each one applies to the whole page or to a single element and its contents, and can change while the app is running.

| Layer | On the web |
| --- | --- |
| 0. Mode | Light and dark follow the system setting. Set `data-theme="light"` or `data-theme="dark"` on `<html>` to fix the mode for the page, or on any element to fix it inside that element |
| 1. Preset | Install `@xds/tokens`, import `@xds/tokens/themes/<name>.css` and set `data-xds-theme="<name>"`. Presets: forest, indigo (the default), ocean, plum, sunset |
| 2 to 5. Theme file | Write a [theme file](cli.md#xds-check-theme-file), then run `xds export-theme brand.json -o brand.css`. It checks the file like `xds check-theme` and writes a stylesheet for `data-xds-theme="brand"` |
| 6. Component defaults | `<Defaults value={{ Button: { variant: "primary" } }}>` gives the components inside it a variant, size, tone, shape, ratio or layout when the app passes none |
| 7. Instance | Every component puts the app's `className` (`class` outside React) and `style` on its root element, beside its root part class |

```html
<html data-theme="dark" data-xds-theme="ocean">
  <!-- … -->
  <aside data-theme="light" data-xds-theme="brand">…</aside>
</html>
```

A theme stylesheet sets every token, not just the ones that differ, so a theme inside another theme inherits nothing from it. A token set by hand, such as `:root { --xds-radius-md: 4px }`, changes only that custom property. Component tokens that refer to it keep their resolved values, and the contrast checks no longer cover the result. To change a role everywhere it is used, use a theme file.

### Defaults

```tsx
<Defaults value={{ Button: { size: "lg" }, Badge: { tone: "accent" } }}>
  <Toolbar />
</Defaults>
```

An option passed to the component wins over the closest `Defaults`. A `Defaults` inside another replaces only the options it names. The defaults apply to the app's own components. The parts a component draws itself, such as a Banner's action button, keep their look.

| Component | Options |
| --- | --- |
| Button, IconButton | `variant`, `size` |
| Text | `variant`, `tone` |
| Badge, Banner | `tone` |
| Avatar, AvatarStack, Icon, Spinner | `size` |
| Skeleton | `shape` |
| Thumbnail | `ratio` |
| MediaCard | `layout` |

### Parts

Each component's root element has the class `xds-` followed by the component name in kebab case: `xds-button`, `xds-icon-button`, `xds-date-range-picker`. For an overlay, the root element is its surface: the dialog panel, the menu, the tooltip, or the toast. Components with their own stylesheet also have documented inner parts, which follow the BEM naming pattern (`xds-dialog__title`, `xds-select__trigger`). States are visible through the native pseudo-classes, the `aria-*` attributes and Zag.js's `data-state`. Anything else, including the Tailwind utilities on an element, is internal and can change in any release.

```css
.checkout .xds-button--primary {
  border-radius: 0;
}
```

## How the packages are built and checked

`node npm/web/build.ts` builds the six packages into `npm/dist/web`. It:

- compiles the TypeScript with tsrs, Vue with Vite and vue-tsc, and Svelte with svelte-package;
- builds the Solid package twice: once as JSX source and once compiled for the DOM;
- compiles `styles.css` with Tailwind into the `xds` layer, and writes `tailwind.css` for Tailwind apps;
- renames `acme` to `xds` the way `xds create` renames a project, and fails if `acme` is left anywhere.

`node npm/web/consumer.ts` is the external consumer check for this channel. For each framework, it:

- packs the packages and installs them with npm in a new app outside the repository, which has only Vite and the framework's Vite plugin;
- draws the design preview from `./preview` in that app, once with `styles.css` and once in an app with its own Tailwind CSS that imports `tailwind.css`;
- compares every section and every open overlay, pixel by pixel, with the same app in a project that `xds create` makes from this repository under the name `xds`, at 1280 and 390 pixels wide, in both modes. A capture that differs is taken again before it counts. Up to 16 pixels may differ by at most 8 levels in a channel: Chrome sometimes draws the anti-aliased corner of a native button differently while the computed styles match;
- repeats the comparison with a custom theme ([`npm/web/consumer/brand.json`](../npm/web/consumer/brand.json)). The app built from the packages applies it with the stylesheet `xds export-theme` writes. The scaffolded app applies it with its token build.

CI runs this check on every change. The release workflow runs it again and publishes the web packages only after it passes.
