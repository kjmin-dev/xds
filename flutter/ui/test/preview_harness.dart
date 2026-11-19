import 'dart:io';

import 'package:acme_ui/acme_ui.dart';
import 'package:acme_ui/src/glass.dart' show GlassTestSettings;
import 'package:acme_ui/src/preview/specimen.dart' show specimenPicture;
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';

const previewBoundary = ValueKey('preview-capture');

Future<void> loadPreviewFonts() async {
  // Flutter's test font draws every character as a rectangle. The SDK pins these font bytes.
  final root = Platform.environment['FLUTTER_ROOT'];
  if (root == null) {
    throw StateError('Run the preview tests with flutter test.');
  }
  final loader = FontLoader('PreviewRoboto');
  for (final weight in ['Regular', 'Medium', 'Bold']) {
    final file = File(
      '$root/bin/cache/artifacts/material_fonts/Roboto-$weight.ttf',
    );
    loader.addFont(file.readAsBytes().then(ByteData.sublistView));
  }
  await loader.load();
}

Future<void> drawPreview(
  WidgetTester tester,
  Widget child,
  Brightness mode, {
  bool fullScreen = false,
  double ratio = 1,
}) async {
  tester.view.devicePixelRatio = ratio;
  tester.view.physicalSize = Size(390 * ratio, 844 * ratio);
  addTearDown(() {
    tester.view.resetPhysicalSize();
    tester.view.resetDevicePixelRatio();
  });
  // Decode before the specimen can start an image request on the widget-test clock.
  await tester.pumpWidget(
    const Directionality(textDirection: TextDirection.ltr, child: SizedBox()),
  );
  final imageContext = tester.element(find.byType(SizedBox).last);
  await tester.runAsync(() => precacheImage(specimenPicture, imageContext));
  await tester.pumpWidget(
    WidgetsApp(
      color: ColorTokens.light.backgroundBase,
      localizationsDelegates: const [GlobalWidgetsLocalizations.delegate],
      debugShowCheckedModeBanner: false,
      pageRouteBuilder: <T>(RouteSettings settings, WidgetBuilder builder) =>
          PageRouteBuilder<T>(
            settings: settings,
            pageBuilder: (context, a, b) => builder(context),
          ),
      builder: (context, navigator) {
        final themed = AcmeTheme(
          brightness: mode,
          fontFamily: 'PreviewRoboto',
          sizes: SizeTokens.touch,
          child: GlassTestSettings(allowed: true, child: navigator!),
        );
        return fullScreen
            ? RepaintBoundary(key: previewBoundary, child: themed)
            : themed;
      },
      home: Builder(
        builder: (context) {
          final colors = AcmeTheme.of(context).colors;
          final specimen = fullScreen
              ? child
              : Align(
                  alignment: Alignment.topCenter,
                  child: RepaintBoundary(
                    key: previewBoundary,
                    child: ColoredBox(
                      color: colors.backgroundBase,
                      child: Padding(
                        padding: const EdgeInsets.all(SpaceTokens.s4),
                        child: SizedBox(width: double.infinity, child: child),
                      ),
                    ),
                  ),
                );
          return ColoredBox(color: colors.backgroundBase, child: specimen);
        },
      ),
    ),
  );
  // Fixed steps finish route transitions and freeze spinners at the same angle on every run.
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 400));
  await tester.pump(const Duration(milliseconds: 100));
  await tester.pump();
}
