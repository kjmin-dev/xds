# The Compose library

The xds components for Compose Multiplatform are published on Maven Central. They are the same components and tokens that `xds create` copies into a Kotlin project, built and renamed for apps that do not use the scaffold. The design behind them is in [xds as a library](library.md).

| Artifact | Contents |
| --- | --- |
| `io.github.kjmin-dev:xds-ui` | The components (`xds.ui`), the tokens and the theme types (`xds.tokens`), the preset themes (`xds.themes`) and the design preview. Gradle picks the platform's artifact from it: `xds-ui-android`, `xds-ui-jvm`, `xds-ui-iosarm64` or `xds-ui-iossimulatorarm64` |

The Compose channel has `preview` stability while kotlinx-datetime is 0.x: a `DatePicker`'s value is its `LocalDate`, so a breaking change there reaches the app. Maven Central has nothing like npm's dist-tags, so the artifacts carry the release's version as it is. This release is built with Kotlin 2.4.21 and Compose Multiplatform 1.12.2, for Android API 24 and later, iOS (arm64 devices and the arm64 simulator) and the desktop JVM 17 or later, and checked on the desktop and on Android with those versions.

```kotlin
// build.gradle.kts of a Compose Multiplatform module
kotlin {
    sourceSets {
        commonMain.dependencies {
            implementation("io.github.kjmin-dev:xds-ui:0.1.0")
        }
    }
}
```

An Android app turns on core library desugaring if its `minSdk` is below 26. The `DatePicker` value is a kotlinx-datetime `LocalDate`, which is `java.time` underneath. On the desktop, the app adds Compose's `compose.desktop.currentOs`, as any Compose desktop app does. Nothing else from xds is required: no token build, no CLI and no Material library. The components draw on `compose.foundation`. Avatars load their pictures with Coil 3, which the library brings.

## Use the components

Wrap the screens in `XdsTheme`, then use the components:

```kotlin
import xds.ui.Button
import xds.ui.ButtonVariant
import xds.ui.XdsTheme

@Composable
fun App() {
    XdsTheme {
        Button("Save", onClick = {}, variant = ButtonVariant.Primary)
    }
}
```

`XdsTheme` gives the components under it their tokens. The color mode follows the system, and the control sizes follow the input device: pointer on the desktop and touch on Android and iOS. The design preview is `DesignPreview(onBack = {})`. It shows every token and component as a scaffolded app's design screen does.

## Customization

The layers below follow [Customization](library.md#customization). Each one applies to the whole app or to any part of it, and can change while the app is running. An `XdsTheme` inside another applies to its own content only. It keeps the outer one's mode, input device and theme unless it is given its own.

| Layer | In Compose |
| --- | --- |
| 0. Mode | `XdsTheme(mode = Mode.Dark)`. Without `mode`, it follows the system, or the `XdsTheme` around it. `input = Input.Touch` picks the touch sizes instead of the platform's |
| 1. Preset | `XdsTheme(theme = OceanTheme)`, from `xds.themes`. Presets: `ForestTheme`, `IndigoTheme` (the default), `OceanTheme`, `PlumTheme`, `SunsetTheme` |
| 2 to 5. Theme file | Write a [theme file](cli.md#xds-check-theme-file), then run `xds export-theme brand.json --format compose --package com.example.app.theme -o BrandTheme.kt`. It checks the file like `xds check-theme` and writes `val BrandTheme: Theme`. Pass it as `XdsTheme(theme = BrandTheme)` |
| 6. Component defaults | `Defaults(ComponentDefaults(button = ButtonDefaults(variant = ButtonVariant.Primary))) { … }` gives the components inside it a variant, size, tone, shape, ratio or layout when the app passes none |
| 7. Instance | Every component takes a `Modifier`, which it puts on its root, and slots where the contract has them (`leading`, `trailing`, `action`) |

```kotlin
XdsTheme(theme = OceanTheme) {
    Column {
        Toolbar()
        XdsTheme(mode = Mode.Dark, theme = BrandTheme) {
            Panel()
        }
    }
}
```

A theme is a value of `xds.tokens.Theme`: the colors of both modes (`Colors`), the sizes of both input devices (`Sizes`) and one class per group of shared values (`SpaceTokens`, `RadiusTokens`, `TypographyTokens`, …). `DefaultTheme` is the library's own. A theme written by `xds export-theme` sets every token, so a theme inside another inherits nothing from it. The components read the theme in effect through `LocalColors`, `LocalSizes` and one property per group, such as `Space.s4` or `Typography.body`, which an app's own composables can read too. The font families of a theme file do not apply: Compose draws with the platform's font.

### Defaults

```kotlin
Defaults(
    ComponentDefaults(
        button = ButtonDefaults(size = ControlSize.Lg),
        badge = BadgeDefaults(tone = BadgeTone.Accent),
    ),
) {
    Toolbar()
}
```

An option passed to the component wins over the closest `Defaults`. A `Defaults` inside another replaces only the options it names. The defaults apply to the app's own components. The parts a component draws itself, such as a Banner's action button, keep their look.

| Component | Options |
| --- | --- |
| Button, IconButton | `variant`, `size` |
| Text | `style` (its variant, as a type role such as `Typography.title`), `tone` |
| Badge, Banner | `tone` |
| Avatar, AvatarStack, Icon, Spinner | `size` |
| Skeleton | `shape` |
| Thumbnail | `ratio` |
| MediaCard | `layout` |

## How the library is built and checked

`node maven/build.ts` builds the library into a Maven repository directory, `maven/dist/repository`. It:

- creates a project with `xds create --name xds --targets kotlin-compose` and builds its `ui` module, so the library is renamed from `acme` to `xds` the way `xds create` renames a project, and fails if `acme` is left in any published file or in what one holds;
- adds the preset themes, written as `xds export-theme --format compose` writes a theme file;
- publishes every Kotlin target with its sources jar, an empty documentation jar and a POM, as Maven Central asks, and signs each file when a signing key is given. The iOS artifacts are built on macOS only.

`node maven/consumer.ts` (`mise run check:library-compose`) is the external consumer check for this channel. It consumes the built artifacts from new Gradle projects outside the repository, which have only the scaffold's Gradle wrapper and version catalog, and compares each picture, pixel by pixel, with a project that `xds create` makes from this repository under the name `xds`:

- a desktop app draws every page and overlay of the design preview off screen, with the same program a scaffolded project runs as `./gradlew :ui:renderPreview`, at a phone's and a desktop window's width, in both modes;
- an Android app shows the design preview as the scaffolded project's Android app does, opened at each section, with the sheet open and with the opaque glass tier, in both modes. Both apps are installed side by side on an emulator that the check makes from an installed system image and deletes afterwards, and each screen is taken from one and then the other. A picture counts once the activity has drawn its first frame and the system's splash window is gone. A pair that differs is taken again, twice at most, before it counts: a picture the app decodes while the screen is drawn can land a frame apart from one launch to the next;
- on macOS, a Kotlin Multiplatform module that puts the design preview in a `UIViewController`, as a scaffolded project's `shared` module does for its Xcode app, links into frameworks for the iOS simulator and for devices. It shows that the iOS artifacts resolve and link. Nothing draws them on iOS;
- the desktop and Android checks repeat the comparison with a custom theme ([`npm/web/consumer/brand.json`](../npm/web/consumer/brand.json), which the web library's check uses too). The library's apps apply it with the value `xds export-theme --format compose` writes. The scaffolded project applies it with its token build. The check fails if the custom theme changes none of the library's pictures, which would show only that both sides ignore it.

CI runs the desktop check on every change, on Linux. The release workflow builds and signs the library on macOS, runs the desktop and iOS checks there and the Android check on Linux, and uploads the same files to Maven Central only after both pass (`maven/upload.ts`). A [rehearsal of the release](cli.md#rehearsing-a-release) runs the same jobs, and Central validates the signed files without publishing them.
