import 'dart:io' show Platform;
import 'dart:ui' show PlatformDispatcher;

import 'package:acme_ui/acme_ui.dart';
import 'package:acme_ui/preview.dart';
import 'package:flutter/services.dart' show SystemUiOverlayStyle;
import 'package:flutter_localizations/flutter_localizations.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final route =
      Platform.environment['XDS_PREVIEW_ROUTE'] ??
      PlatformDispatcher.instance.defaultRouteName;
  runApp(AcmeApp(initialRoute: route));
}

class AcmeApp extends StatefulWidget {
  const AcmeApp({super.key, this.initialRoute = '/'});
  final String initialRoute;

  @override
  State<AcmeApp> createState() => _AcmeAppState();
}

class _AcmeAppState extends State<AcmeApp> {
  late Brightness? mode = requestedMode(Uri.tryParse(widget.initialRoute));

  Brightness? requestedMode(Uri? location) =>
      switch (location?.queryParameters['theme']) {
        'light' => Brightness.light,
        'dark' => Brightness.dark,
        _ => null,
      };

  Route<void> route(RouteSettings settings) {
    final location = Uri.tryParse(settings.name ?? '/') ?? Uri(path: '/');
    final pinned = requestedMode(location);
    if (pinned != null && pinned != mode) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) setState(() => mode = pinned);
      });
    }
    return PageRouteBuilder<void>(
      settings: settings,
      pageBuilder: (context, animation, secondary) {
        if (location.path != '/design') return const _Home();
        return DesignPreview(
          location: location,
          onBack: () => Navigator.of(context).maybePop(),
          onToggleTheme: () {
            final current = AcmeTheme.of(context).brightness;
            setState(
              () => mode = current == Brightness.dark
                  ? Brightness.light
                  : Brightness.dark,
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) => WidgetsApp(
    color: ColorTokens.light.backgroundBase,
    debugShowCheckedModeBanner: false,
    title: 'Acme',
    initialRoute: widget.initialRoute,
    localizationsDelegates: const [GlobalWidgetsLocalizations.delegate],
    supportedLocales: kWidgetsSupportedLanguages.map(Locale.new),
    onGenerateRoute: route,
    onGenerateInitialRoutes: (name) => [
      route(const RouteSettings(name: '/')),
      if ((Uri.tryParse(name)?.path ?? '/') == '/design')
        route(RouteSettings(name: name)),
    ],
    builder: (context, child) {
      final brightness = mode ?? MediaQuery.platformBrightnessOf(context);
      // Android draws system icons above our edge-to-edge background, even when the
      // preview pins a mode different from the phone's system appearance.
      final bars = brightness == Brightness.dark
          ? SystemUiOverlayStyle.light
          : SystemUiOverlayStyle.dark;
      return AnnotatedRegion<SystemUiOverlayStyle>(
        value: bars,
        child: AcmeTheme(
          brightness: brightness,
          child: child ?? const SizedBox.shrink(),
        ),
      );
    },
  );
}

class _Home extends StatelessWidget {
  const _Home();
  @override
  Widget build(BuildContext context) {
    final colors = AcmeTheme.of(context).colors;
    return ColoredBox(
      color: colors.backgroundBase,
      child: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(SpaceTokens.s6),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              spacing: SpaceTokens.s4,
              children: [
                const Text('Acme', variant: TextVariant.display, heading: true),
                const Text(
                  'Explore the design tokens and components.',
                  tone: TextTone.secondary,
                ),
                Button(
                  label: 'Open the design preview',
                  variant: ButtonVariant.primary,
                  onPressed: () => Navigator.of(context).pushNamed('/design'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
