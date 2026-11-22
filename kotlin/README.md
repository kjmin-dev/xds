# Kotlin Multiplatform client

Compose Multiplatform implementation of the design system, paired with an app that runs on Android, iOS, and desktop (JVM).

| Module | Description |
| --- | --- |
| `ui` | Design system library. `acme.tokens` is generated from `design/tokens` (`Tokens.kt`; do not edit by hand), and `acme.ui` provides the theme, components, and design preview |
| `shared` | Application screens. `App()` is the root composable shared across platforms; start in `shared/src/commonMain/kotlin/acme/app/Home.kt` |
| `androidApp`, `desktopApp`, `iosApp` | Thin platform entry points |

Components are built directly on `compose.foundation` without any Material library dependency, so all visual styling comes from the tokens. Two libraries come beyond Compose: Coil 3, which loads the pictures of `Avatar`, with a Ktor engine per platform, and kotlinx-datetime, whose `LocalDate` is the value of `DatePicker`. kotlinx-datetime is `java.time` on Android, which phones have from API 26, so the Android app turns on core library desugaring for the older ones it supports. The names of months and days, and the day a week starts on, come from each platform's locale data: ICU on Android, `java.time` on the desktop, and `NSDateFormatter` and `NSCalendar` on iOS. Wrap screens in `AcmeTheme { }`: the color mode follows the OS setting, and control sizes adapt to the input device (pointer on desktop, touch on Android and iOS).

## Themes and defaults

The generated `Tokens.kt` describes the tokens as a value: `Theme` holds the colors of both modes, the sizes of both input devices and one class per group of shared values (`SpaceTokens`, `RadiusTokens`, `TypographyTokens`, …), and `DefaultTheme` is the one `design/tokens` describes. `AcmeTheme(mode, input, theme)` provides it. Each argument it is not given comes from the `AcmeTheme` around it, so one inside another can pin a mode or swap the theme for part of a screen. Components read the theme in effect: `LocalColors.current`, `LocalSizes.current`, and the group properties `Space`, `Radius`, `Typography` and the others, which are composable. Read them in a composable function and hand the values to `drawBehind`, `layout` and effect lambdas, which run outside composition.

`xds export-theme brand.json --format compose` turns a theme file into such a value (`val BrandTheme: Theme`), checked for contrast like `xds check-theme`. `Defaults(ComponentDefaults(button = ButtonDefaults(size = ControlSize.Lg))) { … }` sets the variant, size, tone, shape, ratio or layout that the components inside it take when they are given none.

## Running the apps

Gradle requires JDK 17 or later. Building for Android also requires the Android SDK at `$ANDROID_HOME`, and building for iOS requires Xcode.

| | Command |
| --- | --- |
| Desktop | `./gradlew :desktopApp:run` |
| Design preview | `./gradlew :desktopApp:run --args="--design"`. Add `--light` or `--dark` inside the quotes to pin the color mode |
| Android | `./gradlew :androidApp:installDebug` with a device connected or an emulator running, or open this directory in Android Studio |
| iOS | Open `iosApp/iosApp.xcodeproj` in Xcode and run. Xcode builds the `Shared` framework by invoking `./gradlew` from a build phase, so Xcode must be able to find a JDK |

On Android and iOS, tap the button on the home screen to open the design preview. On the iOS simulator, passing `--design` at launch opens the preview directly: `xcrun simctl launch booted com.example.acme --design`.

## Glass navigation

`TopBar`, `TabBar` and `BottomSheet` default to `Surface.Solid`. Place scrolling content and navigation inside the same `GlassScene`, mark the content with `Modifier.glassBackdrop()`, and pass `surface = Surface.Glass` to the bars or sheet. The marked source and the surfaces should be siblings. This lets Haze sample the page once and keeps the sheet from blurring a bar's material a second time.

On iOS the surface becomes opaque with Reduce Transparency, Increase Contrast or Low Power Mode. Android uses the opaque material below API 33, on low-RAM devices, in power-saving mode and with high-contrast text on API 36 or later. A missing backdrop also selects the opaque material.

The desktop preview accepts `--section glass --glass blur` or `--section glass --glass solid`. Add `--sheet` to show the sheet and `--autoscroll` for a 10-second scroll. The iOS app accepts the same launch arguments. On Android, use intent string extras `section` and `glass` and boolean extras `sheet` and `autoscroll`. The `XDS_GLASS_FRAMES` line records callback intervals for the active tier. Use a compositor trace for presentation hitches.

## Checks and tests

| | Command |
| --- | --- |
| Unit tests | `./gradlew :ui:jvmTest` |
| Render preview images | `./gradlew :ui:renderPreview` writes PNG snapshots to `build/preview`, each in light and dark modes: the full preview at phone width and at desktop width with pointer sizes; a phone screen with the bottom sheet, the menu's sheet, the select's sheet, the date picker's sheet, the dialog, or the toast open; a desktop window with the dialog or the toast open; and the full desktop-width preview with the menu's popup, the select's popup, or the date picker's popup open. Dates are drawn in the `en-US` locale on every machine |
| Linux CI suite | `mise run check`: runs the unit tests, desktop compilation, and Android debug build |
| macOS iOS build | `mise run check:ios` |

## What has been checked

Verified on macOS with Kotlin 2.4.21, Compose Multiplatform 1.12.2, Android Gradle Plugin 9.5.1, and Gradle 9.9.1:

| | Status |
| --- | --- |
| Tests | Pass on the JVM and against the Android library build |
| Rendered images | Inspected at phone width and at desktop width in light and dark modes, and with the bottom sheet, the menu (sheet and popup), the select's list (sheet and popup), the date picker's calendar (sheet and popup), the dialog, and the toast open |
| Desktop | Runs on macOS; design preview checked in a window in both light and dark modes |
| Android | `assembleDebug` builds. Run on an API 36 emulator: checked the home screen, the design preview in both modes, a switch, and the bottom sheet with its scrim, drag, and Back |
| iOS | Builds for the simulator in Xcode. Run on an iPhone 17 simulator: checked the home screen and the design preview in both modes. Interactive controls were not tapped, so the bottom sheet has not been checked on iOS |
| Focus rings | Checked in an off-screen render driven by simulated Tab key events rather than in a running app |
| Not checked | Screen readers on any platform, physical devices, Windows and Linux, text fields with a real keyboard, and larger system text sizes |

The interactive desktop, emulator, and simulator runs were performed before capsule buttons, the floating tab bar, and the inset bottom sheet were added, and before IconButton, Chip, ChipBar, Tabs, Menu, Dialog, Toast, Skeleton, SearchField, RadioGroup, Select, Slider, Thumbnail, MediaCard, SectionHeader, EmptyState, Accordion, and DatePicker. Since those changes landed, the unit tests, rendered preview images, Android and desktop builds, and iOS framework linking have been re-run, but the apps have not been launched interactively again.

## Known limitations

- Korean text wraps between syllables rather than at word boundaries. Compose does not support word-based line breaking outside Android 13 and later.
- On desktop, the spinner always spins, skeletons always pulse, and presses, dialogs, and toasts always animate because the JVM cannot read the OS reduced-motion setting. The Android ("Remove animations") and iOS ("Reduce Motion") settings are read when the theme is first composed.
- The desktop has no word for "today" in the system's language, so a screen reader there does not say which day is today; the calendar marks it with a ring and bolder figures. Android and iOS say it.
- As on the other platforms, font files are not bundled in the repository, so text renders using the system default font.
- The sample apps do not include app icons.
- When the mode switch inside the design preview overrides the OS color scheme, the Android status bar icons remain in the OS mode's color.

## Credits

`iosApp/iosApp.xcodeproj/project.pbxproj` and the initial Gradle configuration are adapted from JetBrains' [KMP-App-Template](https://github.com/Kotlin/KMP-App-Template), licensed under Apache-2.0.
