# Kotlin Multiplatform client

Compose Multiplatform implementation of the design system, paired with an app that runs on Android, iOS, and desktop (JVM).

| Module | Description |
| --- | --- |
| `ui` | Design system library. `acme.tokens` is generated from `design/tokens` (`Tokens.kt`; do not edit by hand), and `acme.ui` provides the theme, components, and design preview |
| `shared` | Application screens. `App()` is the root composable shared across platforms; start in `shared/src/commonMain/kotlin/acme/app/Home.kt` |
| `androidApp`, `desktopApp`, `iosApp` | Thin platform entry points |

Components are built directly on `compose.foundation` without any Material library dependency, so all visual styling comes from the tokens. The one library beyond Compose is Coil 3, which loads the pictures of `Avatar`, with a Ktor engine per platform. Wrap screens in `AcmeTheme { }`: the color mode follows the OS setting, and control sizes adapt to the input device (pointer on desktop, touch on Android and iOS).

## Running the apps

Gradle requires JDK 17 or later. Building for Android also requires the Android SDK at `$ANDROID_HOME`, and building for iOS requires Xcode.

| | Command |
| --- | --- |
| Desktop | `./gradlew :desktopApp:run` |
| Design preview | `./gradlew :desktopApp:run --args="--design"`. Add `--light` or `--dark` inside the quotes to pin the color mode |
| Android | `./gradlew :androidApp:installDebug` with a device connected or an emulator running, or open this directory in Android Studio |
| iOS | Open `iosApp/iosApp.xcodeproj` in Xcode and run. Xcode builds the `Shared` framework by invoking `./gradlew` from a build phase, so Xcode must be able to find a JDK |

On Android and iOS, tap the button on the home screen to open the design preview. On the iOS simulator, passing `--design` at launch opens the preview directly: `xcrun simctl launch booted com.example.acme --design`.

## Checks and tests

| | Command |
| --- | --- |
| Unit tests | `./gradlew :ui:jvmTest` |
| Render preview images | `./gradlew :ui:renderPreview` writes PNG snapshots to `build/preview`, each in light and dark modes: the full preview at phone width and at desktop width with pointer sizes; a phone screen with the bottom sheet, the menu's sheet, the select's sheet, the dialog, or the toast open; a desktop window with the dialog or the toast open; and the full desktop-width preview with the menu's popup or the select's popup open |
| Linux CI suite | `mise run check`: runs the unit tests, desktop compilation, and Android debug build |
| macOS iOS build | `mise run check:ios` |

## What has been checked

Verified on macOS with Kotlin 2.4.21, Compose Multiplatform 1.12.2, Android Gradle Plugin 9.5.1, and Gradle 9.9.1:

| | Status |
| --- | --- |
| Tests | Pass on the JVM and against the Android library build |
| Rendered images | Inspected at phone width and at desktop width in light and dark modes, and with the bottom sheet, the menu (sheet and popup), the select's list (sheet and popup), the dialog, and the toast open |
| Desktop | Runs on macOS; design preview checked in a window in both light and dark modes |
| Android | `assembleDebug` builds. Run on an API 36 emulator: checked the home screen, the design preview in both modes, a switch, and the bottom sheet with its scrim, drag, and Back |
| iOS | Builds for the simulator in Xcode. Run on an iPhone 17 simulator: checked the home screen and the design preview in both modes. Interactive controls were not tapped, so the bottom sheet has not been checked on iOS |
| Focus rings | Checked in an off-screen render driven by simulated Tab key events rather than in a running app |
| Not checked | Screen readers on any platform, physical devices, Windows and Linux, text fields with a real keyboard, and larger system text sizes |

The interactive desktop, emulator, and simulator runs were performed before capsule buttons, the floating tab bar, and the inset bottom sheet were added, and before IconButton, Chip, ChipBar, Tabs, Menu, Dialog, Toast, Skeleton, SearchField, RadioGroup, Select, Slider, Thumbnail, MediaCard, SectionHeader, EmptyState, and Accordion. Since those changes landed, the unit tests, rendered preview images, Android and desktop builds, and iOS framework linking have been re-run, but the apps have not been launched interactively again.

## Known limitations

- Korean text wraps between syllables rather than at word boundaries. Compose does not support word-based line breaking outside Android 13 and later.
- On desktop, the spinner always spins, skeletons always pulse, and presses, dialogs, and toasts always animate because the JVM cannot read the OS reduced-motion setting. The Android ("Remove animations") and iOS ("Reduce Motion") settings are read when the theme is first composed.
- As on the other platforms, font files are not bundled in the repository, so text renders using the system default font.
- The sample apps do not include app icons.
- When the mode switch inside the design preview overrides the OS color scheme, the Android status bar icons remain in the OS mode's color.

## Credits

`iosApp/iosApp.xcodeproj/project.pbxproj` and the initial Gradle configuration are adapted from JetBrains' [KMP-App-Template](https://github.com/Kotlin/KMP-App-Template), licensed under Apache-2.0.
