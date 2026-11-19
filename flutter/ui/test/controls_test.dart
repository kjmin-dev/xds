import 'package:acme_ui/src/components.dart' as ui;
import 'package:acme_ui/src/icon.dart' show parseSvgPath;
import 'package:acme_ui/src/slider.dart' show snapSlider;
import 'package:acme_ui/src/tokens/tokens.g.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';

Widget screen(Widget child) => WidgetsApp(
  color: ColorTokens.light.backgroundBase,
  pageRouteBuilder: <T>(settings, builder) => PageRouteBuilder<T>(
    settings: settings,
    pageBuilder: (context, first, second) => builder(context),
  ),
  home: ui.AcmeTheme(
    sizes: SizeTokens.touch,
    child: Align(
      alignment: Alignment.topLeft,
      child: SizedBox(width: 340, child: child),
    ),
  ),
);

void main() {
  test('every icon in the contract has drawable paths', () {
    for (final icon in IconName.values) {
      for (final data in icon.paths) {
        expect(
          parseSvgPath(data).computeMetrics().isNotEmpty,
          isTrue,
          reason: icon.name,
        );
      }
    }
    expect(() => parseSvgPath('M0 0z 1'), throwsFormatException);
  });
  test('avatar initials use code points from the first two words', () {
    expect(ui.initials(' Ada  de la Mar '), 'AD');
    expect(ui.initials('Ada'), 'A');
    expect(ui.initials(''), '');
    expect(ui.initials('𐐨da Test', 1), '𐐀');
  });
  test('slider snaps to decimal steps within an uneven range', () {
    expect(snapSlider(0.30000000000000004, 0, 0.98, 0.1), .3);
    expect(snapSlider(0.98, 0, 0.98, 0.1), .9);
    expect(snapSlider(-4.2, -.25, .8, .2), -.25);
  });
  testWidgets(
    'tapping and keyboard activation respect loading and disabled states',
    (tester) async {
      var presses = 0;
      await tester.pumpWidget(
        screen(
          Column(
            children: [
              ui.Button(label: 'Save', onPressed: () => presses++),
              ui.IconButton(
                icon: IconName.x,
                label: 'Close',
                loading: true,
                onPressed: () => presses++,
              ),
              ui.Button(
                label: 'Disabled',
                disabled: true,
                onPressed: () => presses++,
              ),
            ],
          ),
        ),
      );
      await tester.tap(find.text('Save'));
      await tester.tap(find.byType(ui.IconButton));
      await tester.tap(find.text('Disabled'));
      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await tester.pump();
      await tester.sendKeyEvent(LogicalKeyboardKey.enter);
      expect(presses, 2);
    },
  );
  testWidgets('a field preserves the owner value and enforces its length', (
    tester,
  ) async {
    final edits = <String>[];
    await tester.pumpWidget(
      screen(
        ui.TextField(
          label: 'Account',
          value: 'old',
          maxLength: 4,
          onChanged: edits.add,
        ),
      ),
    );
    await tester.enterText(find.byType(EditableText), 'abcdef');
    await tester.pump();
    expect(edits.last, 'abcd');
    expect(
      tester.widget<EditableText>(find.byType(EditableText)).controller.text,
      'old',
    );
    String value = 'a';
    await tester.pumpWidget(
      screen(
        StatefulBuilder(
          builder: (context, setState) => ui.TextField(
            label: 'Account',
            value: value,
            maxLength: 4,
            onChanged: (newValue) => setState(() => value = newValue),
          ),
        ),
      ),
    );
    await tester.enterText(find.byType(EditableText), 'abcd');
    await tester.pump();
    expect(value, 'abcd');
    expect(find.text('4/4'), findsOneWidget);
  });
  testWidgets('touch editing selects a word and opens the clipboard menu', (
    tester,
  ) async {
    await tester.pumpWidget(
      screen(
        ui.TextField(label: 'Notes', value: 'Alpha Beta', onChanged: (_) {}),
      ),
    );
    final field = find.byType(EditableText);
    final point = tester.getTopLeft(field) + const Offset(10, 12);
    await tester.tapAt(point);
    await tester.pump();
    expect(tester.widget<EditableText>(field).focusNode.hasFocus, isTrue);
    await tester.startGesture(point).then((gesture) async {
      await tester.pump(const Duration(seconds: 1));
      await gesture.up();
    });
    await tester.pump();
    final value = tester.widget<EditableText>(field).controller.value;
    expect(value.selection.textInside(value.text), 'Alpha');
    expect(find.text('Copy'), findsOneWidget);
  });
  testWidgets('progress and scrolling tabs expose valid roles', (tester) async {
    for (final fullWidth in [false, true]) {
      await tester.pumpWidget(
        screen(
          Column(
            children: [
              const ui.ProgressBar(label: 'Upload', value: .25),
              ui.Tabs(
                label: 'Folders',
                items: const [
                  ui.ChoiceOption('one', 'One'),
                  ui.ChoiceOption('two', 'Two'),
                ],
                value: 'one',
                onChanged: (_) {},
                fullWidth: fullWidth,
              ),
            ],
          ),
        ),
      );
      expect(tester.takeException(), isNull);
      expect(tester.getSemantics(find.bySemanticsLabel('Upload')).value, '25%');
      expect(tester.getSemantics(find.bySemanticsLabel('Two')).label, 'Two');
    }
  });
  testWidgets('radio, checkbox and switch report the requested selection', (
    tester,
  ) async {
    final seen = <Object>[];
    await tester.pumpWidget(
      screen(
        Column(
          children: [
            ui.RadioGroup(
              label: 'Choice',
              options: const [
                ui.ChoiceOption(1, 'One'),
                ui.ChoiceOption(2, 'Two'),
              ],
              value: 1,
              onChanged: seen.add,
            ),
            ui.Checkbox(label: 'Agree', checked: false, onChanged: seen.add),
            ui.Switch(label: 'Muted', checked: true, onChanged: seen.add),
          ],
        ),
      ),
    );
    for (final label in ['Two', 'Agree', 'Muted']) {
      await tester.tap(find.text(label));
      await tester.pump();
    }
    expect(seen, [2, true, false]);
  });
  testWidgets(
    'radio arrows skip disabled options and select the next enabled one',
    (tester) async {
      int selected = 1;
      await tester.pumpWidget(
        screen(
          StatefulBuilder(
            builder: (context, setState) => ui.RadioGroup(
              label: 'Projects',
              options: const [
                ui.ChoiceOption(1, 'One'),
                ui.ChoiceOption(2, 'Two', disabled: true),
                ui.ChoiceOption(3, 'Three'),
              ],
              value: selected,
              onChanged: (v) => setState(() => selected = v),
            ),
          ),
        ),
      );
      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await tester.pump();
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
      await tester.pump();
      expect(selected, 3);
    },
  );
  testWidgets('slider follows RTL tap direction and its nearest step', (
    tester,
  ) async {
    double? received;
    await tester.pumpWidget(
      screen(
        Directionality(
          textDirection: TextDirection.rtl,
          child: ui.Slider(
            label: 'Speed',
            value: 0,
            min: 0,
            max: 1,
            step: .2,
            onChanged: (x) => received = x,
          ),
        ),
      ),
    );
    final slider = find.byType(ui.Slider);
    final origin = tester.getTopLeft(slider);
    await tester.tapAt(origin + Offset(1, tester.getSize(slider).height - 12));
    expect(received, 1);
  });
  testWidgets('an accordion replaces or extends the controlled open items', (
    tester,
  ) async {
    Set<String> opened = {'a'};
    Future<void> show(bool multiple) async {
      await tester.pumpWidget(
        screen(
          StatefulBuilder(
            builder: (context, setState) => ui.Accordion(
              items: const [
                ui.AccordionItem('a', 'First', content: Text('A body')),
                ui.AccordionItem('b', 'Second', content: Text('B body')),
              ],
              expanded: opened,
              onChanged: (next) => setState(() => opened = next),
              multiple: multiple,
            ),
          ),
        ),
      );
    }

    await show(false);
    await tester.tap(find.text('Second'));
    await tester.pumpAndSettle();
    expect(opened, {'b'});
    expect(find.text('A body'), findsNothing);
    await show(true);
    await tester.tap(find.text('First'));
    await tester.pumpAndSettle();
    expect(opened, {'a', 'b'});
  });
}
