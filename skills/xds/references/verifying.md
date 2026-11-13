# Looking at a UI change

There is no automated screenshot comparison. After a change to tokens or components, look at the design preview of every client you touched, in light and in dark. Each preview can be opened at a given place without scrolling or tapping, so a script can take the screenshot.

## Web

```sh
mise run //web:dev        # serves http://localhost:5173
```

- The preview is at `/design`. Each section has an anchor: `#colors`, `#typography`, `#space-radius-size`, `#buttons`, `#text-fields`, `#selection`, `#badges`, `#banners`, `#card`, `#list`.
- `?theme=light` and `?theme=dark` pin the mode: `http://localhost:5173/design?theme=dark#buttons`.
- With headless Chrome: `chrome --headless --screenshot=buttons.png --window-size=1200,900 "http://localhost:5173/design?theme=dark#buttons"`.

## GPUI desktop (macOS)

```sh
cargo run --package acme-desktop -- --design --dark --scroll 800 --exit-after 5
```

`--scroll <pixels>` opens the preview scrolled down, `--light` and `--dark` pin the mode, and `--exit-after <seconds>` closes the window by itself. Capture the window while it is open, for example with `screencapture`.

## React Native

Start the app with `mise run //mobile:ios`. The design screen is the route `/design`:

- `?from=<n>` starts at the n-th section.
- `?sheet=1` opens the bottom sheet.

On the iOS simulator, open a route with `xcrun simctl openurl booted "<scheme>://design?from=3"` and capture with `xcrun simctl io booted screenshot out.png`. Set the mode with `xcrun simctl ui booted appearance dark`.

## Compose

```sh
mise run //kotlin:render
```

This draws the preview without starting an app and writes PNG files to `kotlin/build/preview`: `preview-touch-light.png`, `preview-touch-dark.png`, `preview-pointer-light.png`, and the bottom sheet as `sheet-touch-light.png` and `sheet-touch-dark.png`. It runs on any OS, so it is the cheapest check when the change is in tokens.

## What to look for

- The change shows on every client, with the same proportions.
- Dark mode: surfaces are told apart by their fill, and text on the accent color is readable.
- Disabled and loading states still look like themselves.
- Nothing moved when a state changed: a border that appears on selection or focus must not shift the text.
