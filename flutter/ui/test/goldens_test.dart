@Tags(['golden'])
library;

import 'dart:io';

import 'package:acme_ui/acme_ui.dart';
import 'package:acme_ui/preview.dart';
import 'package:acme_ui/src/preview/glass_preview.dart';
import 'package:acme_ui/src/preview/specimen.dart';
import 'package:flutter_test/flutter_test.dart';

import 'preview_harness.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUpAll(loadPreviewFonts);
  final template = File('../../template.json').existsSync();
  final directory = Directory('test/goldens');
  final empty =
      !directory.existsSync() ||
      !directory.listSync().any((f) => f.path.endsWith('.png'));
  // A new scaffold has the test suite and can record its own colors when ready.
  if (!template && empty && !autoUpdateGoldenFiles) {
    test(
      'record the project baselines with mise run //flutter:goldens',
      () {},
      skip: true,
    );
    return;
  }
  final compare = Platform.isLinux && Platform.version.contains('linux_x64');
  final components = previewSections.expand((s) => s.$3);
  for (final mode in Brightness.values) {
    final name = mode.name;
    final scenes = <String, ({Widget child, bool screen})>{
      for (final component in components)
        '$component-$name': (
          child: ComponentSpecimen(component),
          screen: false,
        ),
      for (final overlay in previewOverlays.keys)
        'open-$overlay-$name': (
          child: DesignPreview(
            location: Uri(path: '/design', queryParameters: {overlay: '1'}),
            onBack: () {},
            onToggleTheme: () {},
          ),
          screen: true,
        ),
      'navigation-$name': (
        child: DesignPreview(
          location: Uri.parse('/design?section=navigation'),
          onBack: () {},
          onToggleTheme: () {},
        ),
        screen: true,
      ),
      for (final tier in ['blur', 'solid']) ...{
        'glass-$tier-$name': (child: GlassPreview(tier: tier), screen: true),
        'glass-sheet-$tier-$name': (
          child: GlassPreview(tier: tier, sheet: true),
          screen: true,
        ),
      },
    };
    for (final scene in scenes.entries) {
      testWidgets(scene.key, (tester) async {
        await drawPreview(
          tester,
          scene.value.child,
          mode,
          fullScreen: scene.value.screen,
        );
        final path = 'goldens/${scene.key}.png';
        if (compare) {
          await expectLater(
            find.byKey(previewBoundary),
            matchesGoldenFile(path),
          );
        } else {
          expect(
            autoUpdateGoldenFiles,
            isFalse,
            reason: 'Record baselines with mise run //flutter:goldens on Linux x64.',
          );
          expect(
            File('test/$path').existsSync(),
            isTrue,
            reason: 'Missing Linux golden for ${scene.key}',
          );
        }
        // Closing the host lets modal routes, timers and animation controllers dispose.
        await tester.pumpWidget(const SizedBox.shrink());
        await tester.pump();
      });
    }
  }
}
