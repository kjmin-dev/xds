# Looking at a UI change

There is no automated screenshot diffing in CI. After modifying design tokens or components, inspect the design preview in both light and dark modes on every affected client. Each client's preview supports URL parameters or CLI flags to jump directly to a section without manual scrolling or clicking, making it straightforward to capture screenshots from a script.

## Web

```sh
mise run //web:dev        # serves http://localhost:5173
```

- The design preview is served at `/design`. Every section has an anchor ID: `#colors`, `#typography`, `#space-radius-size`, `#icons`, `#buttons`, `#text-fields`, `#selection`, `#controls`, `#chips`, `#tabs`, `#badges`, `#banners`, `#card`, `#media`, `#list`, `#sidebar`, `#accordion`, `#menu`, `#dialog`, `#toast`, `#skeleton`, `#empty-state`.
- Use `?theme=light` or `?theme=dark` to pin the color mode, for example `http://localhost:5173/design?theme=dark#buttons`.
- Use `?open=menu`, `?open=select`, `?open=datepicker`, `?open=daterange`, `?open=dialog`, `?open=toast`, or `?open=tooltip` to load the preview with that overlay showing.
- To capture a screenshot with headless Chrome: `chrome --headless --screenshot=buttons.png --window-size=1200,900 "http://localhost:5173/design?theme=dark#buttons"`.

## Web (Solid)

```sh
mise run //web-solid:dev  # serves http://localhost:5174
```

The Solid preview at `/design` is the same preview as the React one, drawn from the same data in `packages/ui-core/src/preview` by the Solid library, with the same sections, anchors, `?theme=` and `?open=` parameters.

## Web (Vue)

```sh
mise run //web-vue:dev    # serves http://localhost:5175
```

The Vue preview at `/design` is the same preview again, drawn by the Vue library, with the same sections, anchors, `?theme=` and `?open=` parameters.

## Web (Svelte)

```sh
mise run //web-svelte:dev  # serves http://localhost:5176
```

The Svelte preview at `/design` is the same preview again, drawn by the Svelte library, with the same sections, anchors, `?theme=` and `?open=` parameters.

## Comparing the web previews

The web libraries share `packages/ui-core` and must look and behave the same. `mise run compare:previews` starts every web app in the project and compares their previews pixel by pixel (every section and every `?open=` overlay, at 1280 and 390 px, in both modes), and writes both sides of any capture that differs to a temporary directory it names. With one web app it says that there is nothing to compare.

## Web behavior tests

`mise run check:js` tests how the interactive web components behave, in the Google Chrome installed on the machine. To run them for one library:

```sh
pnpm --filter @acme/ui test        # React
pnpm --filter @acme/ui-solid test  # Solid
pnpm --filter @acme/ui-vue test    # Vue
pnpm --filter @acme/ui-svelte test # Svelte
```

The checks in `packages/ui-core/test/behavior.ts` drive each component with the keyboard and the pointer and check focus, roles, names, and ARIA state. Every web library runs the same checks against its own components, so a failure in one library and not another is a difference between them. They check behavior, not appearance: look at the preview as well.

## GPUI desktop (macOS)

```sh
cargo run --package acme-desktop -- --design --dark --scroll 800 --exit-after 5
```

`--scroll <pixels>` opens the preview at a vertical scroll offset, `--light` and `--dark` pin the color mode, `--open menu|select|datepicker|daterange|dialog|toast|tooltip` opens the preview with that overlay showing, and `--exit-after <seconds>` closes the window automatically after the given delay. Capture the window while it is open using a tool such as `screencapture`.

`mise run //desktop:render` draws every page of the preview and each overlay off screen, in both modes, into PNG files in `target/preview`, with no window on the screen. Two runs of the same components give the same files, so it also shows whether a change moved any pixel: render before and after, and compare.

## React Native

Start the app with `mise run //mobile:ios`. The design preview lives at the `/design` route and accepts query parameters:

- `?section=<key>` jumps directly to the section with that key, such as `navigation`, and `?from=<n>` to the n-th section.
- `?sheet=1` opens the bottom sheet on launch, and `?menu=1`, `?select=1`, `?datepicker=1`, `?daterange=1`, `?dialog=1`, and `?toast=1` open the menu, the select list, the calendar of the first date picker, the calendar of the first date range picker, the dialog, and the toast.

`mise run check:js` bundles the app for iOS and Android (`mise run //mobile:bundle`), which shows an import Metro cannot resolve without a device, and checks its native packages against the Expo SDK (`mise run //mobile:check`).

On the iOS simulator, navigate to a specific section with `xcrun simctl openurl booted "<scheme>://design?section=navigation"` and capture a screenshot with `xcrun simctl io booted screenshot out.png`. Toggle light and dark appearance with `xcrun simctl ui booted appearance dark`.

## Compose

```sh
mise run //kotlin:render
```

This task renders the Compose preview headlessly without launching a window and writes PNG screenshots to `kotlin/build/preview`, each in a `-light` and a `-dark` version: the whole preview (`preview-touch`, `preview-pointer`), the open bottom sheet (`sheet-touch`), the open menu (`menu-touch` as a sheet, `menu-pointer` as a popup), the open select list (`select-touch`, `select-pointer`), the open calendar (`datepicker-touch` as a sheet, `datepicker-pointer` as a popup), the open range calendar (`daterange-touch` as a tall sheet of months, `daterange-pointer` as a popup of two months), the open dialog (`dialog-touch`, `dialog-pointer`), and the toast (`toast-touch`, `toast-pointer`). Because it runs on any OS without an emulator, it is the fastest way to visually check token changes.

## What to look for

- The change renders consistently across all modified clients with matching proportions.
- In dark mode, adjacent surfaces remain visually distinct by their fill colors, and text over accent fills stays legible.
- Disabled and loading states remain clearly distinguishable from active states.
- Interactive state transitions do not cause layout shifts—for example, a border added on focus or selection must not push surrounding text.
