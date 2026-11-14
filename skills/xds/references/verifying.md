# Looking at a UI change

There is no automated screenshot diffing in CI. After modifying design tokens or components, inspect the design preview in both light and dark modes on every affected client. Each client's preview supports URL parameters or CLI flags to jump directly to a section without manual scrolling or clicking, making it straightforward to capture screenshots from a script.

## Web

```sh
mise run //web:dev        # serves http://localhost:5173
```

- The design preview is served at `/design`. Every section has an anchor ID: `#colors`, `#typography`, `#space-radius-size`, `#buttons`, `#text-fields`, `#selection`, `#controls`, `#chips`, `#tabs`, `#badges`, `#banners`, `#card`, `#media`, `#list`, `#sidebar`, `#accordion`, `#menu`, `#dialog`, `#toast`, `#skeleton`, `#empty-state`.
- Use `?theme=light` or `?theme=dark` to pin the color mode, for example `http://localhost:5173/design?theme=dark#buttons`.
- Use `?open=menu`, `?open=select`, `?open=dialog`, `?open=toast`, or `?open=tooltip` to load the preview with that overlay showing.
- To capture a screenshot with headless Chrome: `chrome --headless --screenshot=buttons.png --window-size=1200,900 "http://localhost:5173/design?theme=dark#buttons"`.

## Web (Solid)

```sh
mise run //web-solid:dev  # serves http://localhost:5174
```

The Solid preview at `/design` has the same sections, anchors, `?theme=` and `?open=` parameters as the React one. The React preview is the reference: when both clients are in the project, capture the same section from both and compare them.

## Web behavior tests

`mise run check:js` tests how the interactive web components behave, in the Google Chrome installed on the machine. To run them for one library:

```sh
pnpm --filter @acme/ui test        # React
pnpm --filter @acme/ui-solid test  # Solid
```

The checks in `packages/ui-core/test/behavior.ts` drive each component with the keyboard and the pointer and check focus, roles, names, and ARIA state. Every web library runs the same checks against its own components, so a failure in one library and not the other is a difference between the two. They check behavior, not appearance: look at the preview as well.

## GPUI desktop (macOS)

```sh
cargo run --package acme-desktop -- --design --dark --scroll 800 --exit-after 5
```

`--scroll <pixels>` opens the preview at a vertical scroll offset, `--light` and `--dark` pin the color mode, `--open menu|select|dialog|toast|tooltip` opens the preview with that overlay showing, and `--exit-after <seconds>` closes the window automatically after the given delay. Capture the window while it is open using a tool such as `screencapture`.

## React Native

Start the app with `mise run //mobile:ios`. The design preview lives at the `/design` route and accepts query parameters:

- `?from=<n>` jumps directly to the n-th section.
- `?sheet=1` opens the bottom sheet on launch, and `?menu=1`, `?select=1`, `?dialog=1`, and `?toast=1` open the menu, the select list, the dialog, and the toast.

On the iOS simulator, navigate to a specific section with `xcrun simctl openurl booted "<scheme>://design?from=3"` and capture a screenshot with `xcrun simctl io booted screenshot out.png`. Toggle light and dark appearance with `xcrun simctl ui booted appearance dark`.

## Compose

```sh
mise run //kotlin:render
```

This task renders the Compose preview headlessly without launching a window and writes PNG screenshots to `kotlin/build/preview`, each in a `-light` and a `-dark` version: the whole preview (`preview-touch`, `preview-pointer`), the open bottom sheet (`sheet-touch`), the open menu (`menu-touch` as a sheet, `menu-pointer` as a popup), the open select list (`select-touch`, `select-pointer`), the open dialog (`dialog-touch`, `dialog-pointer`), and the toast (`toast-touch`, `toast-pointer`). Because it runs on any OS without an emulator, it is the fastest way to visually check token changes.

## What to look for

- The change renders consistently across all modified clients with matching proportions.
- In dark mode, adjacent surfaces remain visually distinct by their fill colors, and text over accent fills stays legible.
- Disabled and loading states remain clearly distinguishable from active states.
- Interactive state transitions do not cause layout shifts—for example, a border added on focus or selection must not push surrounding text.
