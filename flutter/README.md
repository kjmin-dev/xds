# Flutter

`ui` is the `acme_ui` component library. `app` is the Android and iOS sample. Both resolve their dependencies through the pub workspace in this directory. The repository's mise configuration pins Flutter and its bundled Dart SDK.

| Task | Command from the project root |
| --- | --- |
| Run the sample | `mise run //flutter:ios` or `mise run //flutter:android` |
| Choose a specific connected device | `mise run //flutter:ios -- --device-id <id>` |
| Analyze, run the widget and app tests, and build an Android debug APK | `mise run //flutter:check` |
| Build for the iOS simulator on macOS with Xcode | `mise run //flutter:check:ios` |
| Render the design preview in both modes | `mise run //flutter:render` |
| Record the reference images on Linux x64 through Docker | `mise run //flutter:goldens` |

Android builds need the Android SDK. The home screen opens the design preview. From the app directory, `flutter run --route '/design?section=glass&theme=dark'` opens the dark glass scene directly. Add `&sheet=1` to open the sheet or `&autoscroll=1` to start the 10-second comparison scroll.

Import `package:acme_ui/acme_ui.dart` and put `AcmeTheme` above the screen. Generated colors, sizes, type styles and icon paths are in `ui/lib/src/tokens/tokens.g.dart`. Change their sources under `design/tokens` and `design/icons` and run `mise run tokens`.

`TopBar`, `TabBar` and `BottomSheet` take `surface: Surface.glass`. A `GlassScene` shares the backdrop for its bars. A modal glass sheet reads the dimmed scene separately, and the covered bars become opaque until the sheet's exit completes. The native plugin listens for power and accessibility changes. The preview can select an available tier with `glass=blur` or `glass=solid`.

The reference PNGs cover every touch component and the open overlays in light and dark. CI compares pixels on Linux x64 with fonts from the pinned SDK. The render task produces inspectable images in `flutter/build/preview`. A newly scaffolded project can record its own baselines after choosing its theme.
