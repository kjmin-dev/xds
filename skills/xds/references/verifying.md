# Looking at a UI change

There is no automated screenshot diffing in CI. After modifying design tokens or components, inspect the design preview in both light and dark modes on every affected client. Each client's preview supports URL parameters or CLI flags to jump directly to a section without manual scrolling or clicking, making it straightforward to capture screenshots from a script.

## Web

```sh
mise run //web:dev        # serves http://localhost:5173
```

- The design preview is served at `/design`. Every section has an anchor ID: `#colors`, `#typography`, `#space-radius-size`, `#buttons`, `#text-fields`, `#selection`, `#badges`, `#banners`, `#card`, `#list`.
- Use `?theme=light` or `?theme=dark` to pin the color mode, for example `http://localhost:5173/design?theme=dark#buttons`.
- To capture a screenshot with headless Chrome: `chrome --headless --screenshot=buttons.png --window-size=1200,900 "http://localhost:5173/design?theme=dark#buttons"`.

## GPUI desktop (macOS)

```sh
cargo run --package acme-desktop -- --design --dark --scroll 800 --exit-after 5
```

`--scroll <pixels>` opens the preview at a vertical scroll offset, `--light` and `--dark` pin the color mode, and `--exit-after <seconds>` closes the window automatically after the given delay. Capture the window while it is open using a tool such as `screencapture`.

## React Native

Start the app with `mise run //mobile:ios`. The design preview lives at the `/design` route and accepts query parameters:

- `?from=<n>` jumps directly to the n-th section.
- `?sheet=1` opens the bottom sheet on launch.

On the iOS simulator, navigate to a specific section with `xcrun simctl openurl booted "<scheme>://design?from=3"` and capture a screenshot with `xcrun simctl io booted screenshot out.png`. Toggle light and dark appearance with `xcrun simctl ui booted appearance dark`.

## Compose

```sh
mise run //kotlin:render
```

This task renders the Compose preview headlessly without launching a window and writes PNG screenshots to `kotlin/build/preview`: `preview-touch-light.png`, `preview-touch-dark.png`, `preview-pointer-light.png`, and the bottom sheet views `sheet-touch-light.png` and `sheet-touch-dark.png`. Because it runs on any OS without an emulator, it is the fastest way to visually check token changes.

## What to look for

- The change renders consistently across all modified clients with matching proportions.
- In dark mode, adjacent surfaces remain visually distinct by their fill colors, and text over accent fills stays legible.
- Disabled and loading states remain clearly distinguishable from active states.
- Interactive state transitions do not cause layout shifts—for example, a border added on focus or selection must not push surrounding text.
