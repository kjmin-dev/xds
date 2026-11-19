import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart' as w;
import 'package:flutter_test/flutter_test.dart';
import 'package:acme_ui/src/calendars.dart';
import 'package:acme_ui/src/button.dart';
import 'package:acme_ui/src/glass.dart';
import 'package:acme_ui/src/menus.dart';
import 'package:acme_ui/src/modals.dart';
import 'package:acme_ui/src/navigation.dart';
import 'package:acme_ui/src/theme.dart';
import 'package:acme_ui/src/tokens/tokens.g.dart';

w.Widget _host(w.Widget child, {SizeTokens sizes = SizeTokens.touch}) =>
    w.WidgetsApp(
      color: ColorTokens.light.backgroundBase,
      pageRouteBuilder: <T>(settings, builder) => w.PageRouteBuilder<T>(
        settings: settings,
        pageBuilder: (context, _, _) => builder(context),
      ),
      home: AcmeTheme(
        sizes: sizes,
        brightness: w.Brightness.light,
        child: w.Center(child: child),
      ),
    );

Finder _day(String iso) => find.byKey(w.ValueKey(iso));

void main() {
  testWidgets(
    'TalkBack can focus and activate the range sheet Done control by itself',
    (tester) async {
      var value = DateRange(
        start: DateTime(2026, 3, 17),
        end: DateTime(2026, 3, 20),
      );
      await tester.pumpWidget(
        _host(
          w.StatefulBuilder(
            builder: (context, update) => DateRangePicker(
              label: 'Stay',
              value: value,
              onChanged: (next) => update(() => value = next),
              min: DateTime(2026, 3, 1),
              max: DateTime(2026, 4, 20),
              defaultOpen: true,
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      final done = find.semantics.byLabel(RegExp(r'^Done$'));
      expect(done, findsOne);
      expect(
        done.evaluate().single.rect.height,
        lessThanOrEqualTo(SizeTokens.touch.controlMd),
      );
      tester.semantics.tap(done);
      await tester.pumpAndSettle();
      expect(done, findsNothing);
    },
  );
  testWidgets('dialog actions retain individual semantic names and bounds', (
    tester,
  ) async {
    var open = true, deleted = false;
    await tester.pumpWidget(
      _host(
        w.StatefulBuilder(
          builder: (context, update) => Dialog(
            open: open,
            title: 'Delete report',
            description: 'This removes the report.',
            onClose: () => update(() => open = false),
            actions: [
              Button(
                label: 'Cancel',
                onPressed: () => update(() => open = false),
              ),
              Button(
                label: 'Delete',
                onPressed: () => update(() {
                  deleted = true;
                  open = false;
                }),
              ),
            ],
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    final cancel = find.semantics.byLabel(RegExp(r'^Cancel$')),
        action = find.semantics.byLabel(RegExp(r'^Delete$'));
    expect(cancel, findsOne);
    expect(action, findsOne);
    expect(
      action.evaluate().single.rect.height,
      lessThanOrEqualTo(SizeTokens.touch.controlMd),
    );
    tester.semantics.tap(action);
    await tester.pumpAndSettle();
    expect(deleted, isTrue);
  });
  testWidgets(
    'only the glass sheet reads the backdrop above covered navigation',
    (tester) async {
      var open = false, surface = Surface.glass;
      await tester.pumpWidget(
        _host(
          GlassTestSettings(
            allowed: true,
            child: GlassScene(
              child: w.StatefulBuilder(
                builder: (context, update) => w.Stack(
                  children: [
                    const w.Align(
                      alignment: w.Alignment.topCenter,
                      child: TopBar(
                        title: 'Collections',
                        surface: Surface.glass,
                      ),
                    ),
                    const w.Align(
                      alignment: w.Alignment.bottomCenter,
                      child: _PreviewTab(),
                    ),
                    w.Center(
                      child: w.Column(
                        mainAxisSize: w.MainAxisSize.min,
                        children: [
                          for (final material in Surface.values)
                            w.GestureDetector(
                              onTap: () => update(() {
                                open = true;
                                surface = material;
                              }),
                              child: w.Text('Open ${material.name}'),
                            ),
                        ],
                      ),
                    ),
                    BottomSheet(
                      open: open,
                      surface: surface,
                      title: 'Details',
                      child: const w.Text('Items'),
                      onClose: () => update(() => open = false),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      );
      Finder filters(bool sheet) => find.descendant(
        of: find.byWidgetPredicate((w) => w is GlassPanel && w.sheet == sheet),
        matching: find.byType(w.BackdropFilter),
      );
      await tester.pumpAndSettle();
      expect(filters(false), findsNWidgets(2));
      await tester.tap(find.text('Open glass'));
      await tester.pumpAndSettle();
      expect(filters(false), findsNothing);
      expect(filters(true), findsOneWidget);
      expect(find.text('Collections'), findsOneWidget);
      await tester.binding.handlePopRoute();
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 60));
      expect(filters(true), findsOneWidget);
      expect(filters(false), findsNothing);
      await tester.pumpAndSettle();
      expect(filters(false), findsNWidgets(2));
      expect(filters(true), findsNothing);
      await tester.tap(find.text('Open solid'));
      await tester.pumpAndSettle();
      expect(filters(false), findsNWidgets(2));
      expect(filters(true), findsNothing);
    },
  );
  testWidgets('tab bar exposes only named tabs beside other controls', (
    tester,
  ) async {
    String current = 'home';
    await tester.pumpWidget(
      _host(
        w.StatefulBuilder(
          builder: (context, refresh) => w.Column(
            children: [
              const w.Text('Other content'),
              TabBar(
                items: const [
                  TabBarItem(
                    value: 'home',
                    label: 'Home',
                    icon: IconName.house,
                  ),
                  TabBarItem(
                    value: 'search',
                    label: 'Search',
                    icon: IconName.search,
                  ),
                ],
                value: current,
                onChanged: (next) => refresh(() => current = next),
              ),
            ],
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.bySemanticsLabel('Search'));
    await tester.pumpAndSettle();
    expect(current, 'search');
    expect(tester.takeException(), isNull);
  });
  testWidgets(
    'a bounded date field opens on its value and closes after choosing',
    (tester) async {
      DateTime? chosen;
      await tester.pumpWidget(
        _host(
          DatePicker(
            label: 'Due',
            value: DateTime(2028, 2, 15),
            min: DateTime(2028, 2, 1),
            max: DateTime(2028, 3, 2),
            onChanged: (day) => chosen = day,
          ),
        ),
      );
      await tester.tap(find.text('Feb 15, 2028'));
      await tester.pumpAndSettle();
      expect(find.text('February 2028'), findsOneWidget);
      final next = find.semantics.byLabel(RegExp(r'^Next month$'));
      expect(next, findsOne);
      expect(
        next.evaluate().single.rect.height,
        lessThanOrEqualTo(SizeTokens.touch.targetMin),
      );
      tester.semantics.tap(next);
      await tester.pumpAndSettle();
      await tester.tap(_day('2028-03-03'));
      await tester.pumpAndSettle();
      expect(chosen, isNull);
      await tester.tap(_day('2028-03-02'));
      await tester.pumpAndSettle();
      expect(chosen, DateTime.utc(2028, 3, 2));
      expect(find.text('March 2028'), findsNothing);
    },
  );

  testWidgets(
    'range restarts, length bounds, commit, discard draft and re-open',
    (tester) async {
      DateRange? chosen;
      var commits = 0;
      await tester.pumpWidget(
        _host(
          w.StatefulBuilder(
            builder: (context, setState) => DateRangePicker(
              label: 'Stay',
              placeholder: 'Choose dates',
              startLabel: 'Check-in',
              endLabel: 'Check-out',
              defaultOpen: true,
              value: chosen,
              min: DateTime(2026, 3, 1),
              max: DateTime(2026, 3, 31),
              minLength: 2,
              maxLength: 4,
              onChanged: (range) => setState(() {
                chosen = range;
                commits++;
              }),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      await tester.tap(_day('2026-03-10'));
      await tester.pumpAndSettle();
      await tester.tap(_day('2026-03-09'));
      await tester.pumpAndSettle();
      await tester.tap(_day('2026-03-10'));
      await tester.pumpAndSettle();
      await tester.tap(_day('2026-03-14'));
      await tester.pumpAndSettle();
      expect(commits, 0);
      await tester.tap(_day('2026-03-12'));
      await tester.pumpAndSettle();
      expect(
        chosen,
        DateRange(
          start: DateTime.utc(2026, 3, 9),
          end: DateTime.utc(2026, 3, 12),
        ),
      );
      expect(commits, 1);
      await tester.tap(_day('2026-03-17'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Done'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Mar 9, 2026 – Mar 12, 2026'));
      await tester.pumpAndSettle();
      await tester.tap(_day('2026-03-19'));
      await tester.pumpAndSettle();
      expect(commits, 1);
      await tester.tap(_day('2026-03-21'));
      await tester.pumpAndSettle();
      expect(commits, 2);
    },
  );

  testWidgets('a far date opens without laying out a century of months', (
    tester,
  ) async {
    await tester.pumpWidget(
      _host(
        DateRangePicker(
          label: 'Trip',
          defaultOpen: true,
          value: DateRange(
            start: DateTime.utc(9999, 12, 1),
            end: DateTime.utc(9999, 12, 1),
          ),
          min: DateTime.utc(1),
          max: DateTime.utc(9999, 12, 31),
          onChanged: (_) {},
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(_day('9999-12-01'), findsOneWidget);
    expect(_day('0001-01-01'), findsNothing);
  });

  testWidgets('select changes immediately and ignores disabled options', (
    tester,
  ) async {
    String? chosen;
    await tester.pumpWidget(
      _host(
        Select(
          label: 'Team',
          defaultOpen: true,
          options: const [
            SelectOption(value: 'red', label: 'Red', disabled: true),
            SelectOption(value: 'blue', label: 'Blue'),
          ],
          onChanged: (s) => chosen = s,
        ),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Red'));
    await tester.pumpAndSettle();
    expect(chosen, isNull);
    await tester.tap(find.text('Blue'));
    await tester.pumpAndSettle();
    expect(chosen, 'blue');
    expect(find.text('Blue'), findsNothing);
  });

  testWidgets('drag and system back dismiss the owning sheet once', (
    tester,
  ) async {
    var closes = 0;
    var open = true;
    await tester.pumpWidget(
      _host(
        w.StatefulBuilder(
          builder: (context, setState) => w.Column(
            children: [
              w.GestureDetector(
                onTap: () => setState(() => open = true),
                child: const w.Text('Show'),
              ),
              BottomSheet(
                open: open,
                onClose: () => setState(() {
                  open = false;
                  closes++;
                }),
                title: 'Share',
                child: const w.Text('Sheet content'),
              ),
            ],
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    await tester.drag(find.text('Share'), const w.Offset(0, 150));
    await tester.pumpAndSettle();
    expect(closes, 1);
    await tester.tap(find.text('Show'));
    await tester.pumpAndSettle();
    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();
    expect(closes, 2);
  });

  testWidgets(
    'the glass preview follows live native low-power and contrast settings',
    (tester) async {
      const channel = EventChannel('acme.ui/glass');
      late MockStreamHandlerEventSink events;
      int listened = 0, cancelled = 0;
      final messenger = tester.binding.defaultBinaryMessenger;
      messenger.setMockStreamHandler(
        channel,
        MockStreamHandler.inline(
          onListen: (_, sink) {
            events = sink;
            listened++;
            sink.success(true);
          },
          onCancel: (_) {
            cancelled++;
          },
        ),
      );
      await tester.pumpWidget(
        _host(
          const GlassScene(
            child: GlassPreviewOverride(
              blur: true,
              child: TopBar(title: 'Glass', surface: Surface.glass),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(listened, 1);
      expect(find.byType(w.BackdropFilter), findsOneWidget);
      events.success(false);
      await tester.pumpAndSettle();
      expect(find.byType(w.BackdropFilter), findsNothing);
      events.success(true);
      await tester.pumpAndSettle();
      expect(find.byType(w.BackdropFilter), findsOneWidget);
      await tester.pumpWidget(const w.SizedBox.shrink());
      await tester.pump();
      expect(cancelled, 1);
      messenger.setMockStreamHandler(channel, null);
    },
  );
  testWidgets(
    'toast action closes once without taking focus or starting a timeout',
    (tester) async {
      var actions = 0, closes = 0, open = true;
      await tester.pumpWidget(
        _host(
          w.StatefulBuilder(
            builder: (context, refresh) => Toast(
              open: open,
              message: 'Report saved',
              duration: Duration.zero,
              onClose: () => refresh(() {
                open = false;
                closes++;
              }),
              action: ToastAction(
                label: 'Undo',
                onPressed: () {
                  actions++;
                },
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.text('Undo'));
      await tester.pumpAndSettle();
      expect((actions, closes), (1, 1));
      expect(find.text('Report saved'), findsNothing);
    },
  );
  testWidgets('pointer menu anchors to the trigger and closes on Escape', (
    tester,
  ) async {
    await tester.pumpWidget(
      _host(
        Menu(
          label: 'Actions',
          trigger: (show) =>
              w.GestureDetector(onTap: show, child: const w.Text('Open menu')),
          items: [MenuItem(label: 'Rename', onSelected: () {})],
        ),
        sizes: SizeTokens.pointer,
      ),
    );
    await tester.tap(find.text('Open menu'));
    await tester.pumpAndSettle();
    expect(find.text('Rename'), findsOneWidget);
    expect(find.bySemanticsLabel('Close'), findsNothing);
    await tester.sendKeyEvent(LogicalKeyboardKey.escape);
    await tester.pumpAndSettle();
    expect(find.text('Rename'), findsNothing);
  });
  testWidgets(
    'navigation follows the glass tier; native accessibility wins over the preview',
    (tester) async {
      w.Widget bar(bool contrast) => _host(
        w.MediaQuery(
          data: w.MediaQueryData(highContrast: contrast),
          child: const GlassTestSettings(
            allowed: true,
            child: GlassScene(
              child: GlassPreviewOverride(
                blur: true,
                child: TopBar(title: 'Collections', surface: Surface.glass),
              ),
            ),
          ),
        ),
      );
      await tester.pumpWidget(bar(false));
      await tester.pump();
      expect(find.byType(w.BackdropFilter), findsOneWidget);
      await tester.pumpWidget(bar(true));
      await tester.pump();
      expect(find.byType(w.BackdropFilter), findsNothing);
    },
  );
}

class _PreviewTab extends w.StatelessWidget {
  const _PreviewTab();
  @override
  w.Widget build(w.BuildContext context) => TabBar(
    items: const [
      TabBarItem(value: 'home', label: 'Home', icon: IconName.house),
    ],
    value: 'home',
    onChanged: (_) {},
    surface: Surface.glass,
  );
}
