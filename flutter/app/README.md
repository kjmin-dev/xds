# Acme Flutter app

Open **Design system** from the home screen to try the components on a phone. The preview follows the system color mode and has a switch for comparing both modes.

Run the app at a particular section with `flutter run --route '/design?section=controls'`, or open `acme-flutter://preview/design?section=navigation` on a device with the app installed. The `theme` query parameter accepts `light` and `dark`. To inspect an open overlay, use `datepicker=1`, `daterange=1`, `sheet=1`, `menu=1`, `select=1`, `dialog=1` or `toast=1`.

For a ten-second performance sample, open `/design?section=glass&autoscroll=1` in a profile build. Use `glass=solid` for the opaque comparison and `sheet=1` to keep the sheet open. The app logs `XDS_GLASS_FRAMES` followed by a JSON object with renderer timings and display-interval statistics.
