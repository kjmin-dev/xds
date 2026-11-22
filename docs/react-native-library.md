# The React Native library

The xds components for React Native and Expo apps are published on npm as `@xds/react-native`. They are the same components and tokens that `xds create` copies into a project, built and renamed for apps that do not use the scaffold. The design behind them is in [xds as a library](library.md).

| Package | Contents |
| --- | --- |
| `@xds/react-native` | The components, the theme provider and `Defaults`, the tokens (`@xds/react-native/tokens`), the preset themes (`@xds/react-native/themes`), and the native module the glass surfaces read the system's settings with |

The React Native channel has `preview` stability while React Native is 0.x, whose minor releases change its APIs. Its packages are published under the `preview` dist-tag:

```sh
npm install @xds/react-native@preview react-native-safe-area-context react-native-svg
```

## What the app needs

| Peer | Range | |
| --- | --- | --- |
| React Native | 0.86 to 0.88 | The oldest minor release the React Native team supports, to the one the template's Expo SDK runs. The release is checked at both ends |
| React | 19.2.3 or later 19 | What React Native 0.86 asks for |
| `react-native-safe-area-context` | 5.11.1 or later 5 | |
| `react-native-svg` | 15.16.0 or later 15 | Icons are SVG paths |
| `expo`, `expo-blur`, `expo-glass-effect`, `expo-linear-gradient` | Expo SDK 58 | Optional. The glass surfaces draw with them. Without them, `surface="glass"` takes the opaque material, and every other component is the same |

Nothing else from xds is required: no token build and no CLI. The package's native module is an Expo module, which Expo's autolinking links. An app without Expo leaves it out and does not build it.

## Use the components

```tsx
import { Button, XdsTheme } from "@xds/react-native";

export default function App() {
  return (
    <XdsTheme>
      <Button variant="primary" label="Save" onPress={save} />
    </XdsTheme>
  );
}
```

Without an `XdsTheme`, the components take the default theme and the system's color scheme. Wrap the app in a `SafeAreaProvider`, as Expo Router does, for the components that keep clear of the screen's edges.

## Customization

The layers below follow [Customization](library.md#customization). Each one applies to the whole app or to any part of a screen, and can change while the app is running. An `XdsTheme` inside another applies to its own content only, and takes what it is not given from the one around it.

| Layer | In React Native |
| --- | --- |
| 0. Mode | `<XdsTheme scheme="dark">`. Without `scheme`, the components follow the system, or the `XdsTheme` around them |
| 1. Preset | `<XdsTheme theme={oceanTheme}>`, from `@xds/react-native/themes`. Presets: `forestTheme`, `indigoTheme` (the default), `oceanTheme`, `plumTheme`, `sunsetTheme` |
| 2 to 5. Theme file | Write a [theme file](cli.md#xds-check-theme-file), then run `xds export-theme brand.json --format react-native -o brand.ts`. It checks the file like `xds check-theme` and writes `export const brandTheme: Theme`. Pass it as `<XdsTheme theme={brandTheme}>` |
| 6. Component defaults | `<Defaults value={{ Button: { variant: "primary" } }}>` gives the components inside it a variant, size, tone, shape, ratio or layout when the app passes none |
| 7. Instance | Every component puts the app's `style` on its root view, after its own style. For an overlay it is its surface: the sheet, the dialog's panel. Where an overlay is and how it moves stay its own |

```tsx
<XdsTheme theme={oceanTheme}>
  <Toolbar />
  <XdsTheme scheme="dark" theme={brandTheme}>
    <Panel />
  </XdsTheme>
</XdsTheme>
```

A theme is a value of the `Theme` type: the colors of both modes, the sizes of both input devices and the shared values, in the shape of `defaultTheme` from `@xds/react-native/tokens`. A theme written by `xds export-theme` sets every token, so a theme inside another inherits nothing from it. An app's own views read the theme in effect with `useTheme()` and `useColors()`, and `themed()` builds a style sheet once per theme:

```tsx
const useStyles = themed(({ space, radius }) =>
  StyleSheet.create({ card: { padding: space[4], borderRadius: radius.lg } }),
);

function Panel() {
  const styles = useStyles();
  const colors = useColors();
  return <View style={[styles.card, { backgroundColor: colors.backgroundSurface }]} />;
}
```

The font families of a theme file do not apply: the components draw with the platform's font.

### Defaults

```tsx
<Defaults value={{ Button: { size: "lg" }, Badge: { tone: "accent" } }}>
  <Toolbar />
</Defaults>
```

An option passed to the component wins over the closest `Defaults`. A `Defaults` inside another replaces only the options it names. The defaults apply to the app's own components. The parts a component draws itself, such as a card's title or a banner's action button, keep their look. The components and options are those of the web libraries: Button and IconButton (`variant`, `size`), Text (`variant`, `tone`), Badge and Banner (`tone`), Avatar, AvatarStack, Icon and Spinner (`size`), Skeleton (`shape`), Thumbnail (`ratio`) and MediaCard (`layout`).

## How the package is built and checked

`node npm/react-native/build.ts` builds the package into `npm/dist/react-native/package`. It:

- compiles the components of `packages/ui-native` and the tokens of `packages/tokens` with tsrs, into JavaScript and declarations, with the tokens inside the package;
- adds the preset themes, written as `xds export-theme --format react-native` writes a theme file, and the native module with its Expo module configuration;
- renames `acme` to `xds` the way `xds create` renames a project, and fails if `acme` is left anywhere.

`node npm/react-native/consumer.ts` (`mise run check:library-react-native`) is the external consumer check for this channel. It packs the package and installs it with npm into three new apps outside the repository:

- an Expo app on the template's Expo SDK and React Native 0.88: the scaffolded project's app, with its imports of the project's packages turned into imports of the library;
- a React Native 0.88 app and a React Native 0.86 app without Expo, made from the React Native template, with only the required peers. They show the same design screen, without the glass section's benchmark, which needs Reanimated.

Each app is type-checked with its own TypeScript and bundled by Metro for iOS and Android. Then each is built for Android and run on an emulator that the check makes from an installed system image and deletes afterwards. Every section of the design preview and every overlay is compared, pixel by pixel, in both modes:

- the Expo app's screens with those of a project that `xds create` makes from this repository under the name `xds`;
- the React Native 0.86 app's screens with the React Native 0.88 app's;
- both with the default theme and with a custom theme ([`npm/web/consumer/brand.json`](../npm/web/consumer/brand.json)). The library's apps apply it with the value `xds export-theme --format react-native` writes. The scaffolded app applies it with its token build. The check fails if the custom theme changes none of the library's screens.

A screen is taken once the app has drawn its first frame, the system's splash window is gone and two pictures in a row are the same. A pair that differs is taken again, twice at most, before it counts. Nothing is built or drawn for iOS: Metro bundles every app for iOS, and the native module's iOS half is the one the scaffolded app builds.

The release workflow publishes the package only after this check passes.
