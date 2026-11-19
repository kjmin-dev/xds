// Run with flutter test test_render/render_preview.dart from flutter/ui.
import 'dart:io';
import 'dart:ui' as ui;

import 'package:acme_ui/acme_ui.dart';
import 'package:acme_ui/preview.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_test/flutter_test.dart';

import '../test/preview_harness.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUpAll(loadPreviewFonts);
  final out = Directory('../build/preview');
  for (final mode in Brightness.values) {
    final pages = <String, String>{
      'preview': '',
      for (final section in previewSections)
        section.$1: 'section=${section.$1}',
      for (final overlay in previewOverlays.keys) 'open-$overlay': '$overlay=1',
      for (final tier in ['blur', 'solid']) ...{
        'glass-$tier': 'section=glass&glass=$tier',
        'glass-sheet-$tier': 'section=glass&glass=$tier&sheet=1',
      },
    };
    for (final page in pages.entries) {
      testWidgets('${page.key}-${mode.name}', (tester) async {
        await drawPreview(
          tester,
          DesignPreview(
            location: Uri.parse('/design?${page.value}'),
            scrolls: page.key != 'preview',
            onBack: () {},
            onToggleTheme: () {},
          ),
          mode,
          fullScreen: page.key != 'preview',
          viewportHeight: page.key == 'preview' ? 24000 : 844,
        );
        final boundary = tester.renderObject<RenderRepaintBoundary>(
          find.byKey(previewBoundary),
        );
        await tester.runAsync(() async {
          final image = await boundary.toImage(pixelRatio: 2);
          final data = await image.toByteData(format: ui.ImageByteFormat.png);
          await out.create(recursive: true);
          await File('${out.path}/${page.key}-touch-${mode.name}.png')
              .writeAsBytes(data!.buffer.asUint8List());
          image.dispose();
        });
        await tester.pumpWidget(const SizedBox.shrink());
      });
    }
  }
}
