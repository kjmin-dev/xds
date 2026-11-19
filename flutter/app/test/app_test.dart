import 'package:acme_app/main.dart';
import 'package:acme_ui/acme_ui.dart';
import 'package:flutter/services.dart' show SystemUiOverlayStyle;
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('home opens the design preview and Back returns to home', (
    tester,
  ) async {
    await tester.pumpWidget(const AcmeApp());
    await tester.pumpAndSettle();
    await tester.tap(find.text('Open the design preview'));
    await tester.pumpAndSettle();
    expect(find.text('Colors'), findsOneWidget);
    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();
    expect(find.text('Open the design preview'), findsOneWidget);
  });
  testWidgets('a direct preview route chooses the section and color mode', (
    tester,
  ) async {
    await tester.pumpWidget(
      const AcmeApp(
        initialRoute: '/design?section=glass&glass=solid&theme=dark',
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Collections'), findsOneWidget);
    final context = tester.element(find.text('Collections'));
    expect(AcmeTheme.of(context).brightness, Brightness.dark);
    SystemUiOverlayStyle bars() => tester
        .widget<AnnotatedRegion<SystemUiOverlayStyle>>(
          find.byType(AnnotatedRegion<SystemUiOverlayStyle>).first,
        )
        .value;
    expect(bars().statusBarIconBrightness, Brightness.light);
    await tester.tap(find.bySemanticsLabel('Switch to light'));
    await tester.pumpAndSettle();
    expect(AcmeTheme.of(context).brightness, Brightness.light);
    expect(bars().statusBarIconBrightness, Brightness.dark);
    Navigator.of(context)
        .pushNamed('/design?section=glass&glass=solid&theme=dark');
    await tester.pumpAndSettle();
    final latest = tester.element(find.text('Collections'));
    expect(AcmeTheme.of(latest).brightness, Brightness.dark);
  });
}
