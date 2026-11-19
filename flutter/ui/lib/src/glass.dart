import 'dart:async';
import 'dart:ui' as ui;

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import 'theme.dart';
import 'tokens/tokens.g.dart';

enum Surface { solid, glass }

/// Shares one read of the scrolling backdrop between the bars of a screen.
class GlassScene extends StatelessWidget {
  const GlassScene({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final body = BackdropGroup(child: child);
    final test = GlassTestSettings.of(context);
    if (test != null) return _DeviceGlass(allowed: test, child: body);
    return ValueListenableBuilder<bool>(
      valueListenable: _GlassSettings.instance,
      child: body,
      builder: (_, allowed, child) =>
          _DeviceGlass(allowed: allowed, child: child!),
    );
  }
}

/// Kept off the public library entry point. The preview can draw both device tiers in tests.
class GlassPreviewOverride extends InheritedWidget {
  const GlassPreviewOverride({
    super.key,
    required this.blur,
    required super.child,
  });
  final bool blur;
  static bool? of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<GlassPreviewOverride>()?.blur;
  @override
  bool updateShouldNotify(GlassPreviewOverride oldWidget) =>
      oldWidget.blur != blur;
}

/// Fakes platform settings for headless golden tests. The sample app uses the native channel.
class GlassTestSettings extends InheritedWidget {
  const GlassTestSettings({
    super.key,
    required this.allowed,
    required super.child,
  });
  final bool allowed;
  static bool? of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<GlassTestSettings>()?.allowed;
  @override
  bool updateShouldNotify(GlassTestSettings oldWidget) =>
      oldWidget.allowed != allowed;
}

class _DeviceGlass extends InheritedWidget {
  const _DeviceGlass({required this.allowed, required super.child});
  final bool allowed;
  @override
  bool updateShouldNotify(_DeviceGlass oldWidget) =>
      oldWidget.allowed != allowed;
}

bool glassBlurEnabled(BuildContext context) =>
    context.dependOnInheritedWidgetOfExactType<_DeviceGlass>()?.allowed ==
        true &&
    !MediaQuery.highContrastOf(context) &&
    GlassPreviewOverride.of(context) != false;

// A new surface must know the latest setting even if another surface already subscribed.
class _GlassSettings extends ChangeNotifier implements ValueListenable<bool> {
  static final instance = _GlassSettings();
  static const channel = EventChannel('acme.ui/glass');
  StreamSubscription<dynamic>? _events;
  bool _allowed = false;
  @override
  bool get value => _allowed;

  @override
  void addListener(VoidCallback listener) {
    super.addListener(listener);
    _events ??= channel.receiveBroadcastStream().listen(
      (event) => _update(event == true),
      onError: (Object error) => _update(false),
    );
  }

  void _update(bool allowed) {
    if (_allowed == allowed) return;
    _allowed = allowed;
    notifyListeners();
  }

  @override
  void removeListener(VoidCallback listener) {
    super.removeListener(listener);
    if (hasListeners) return;
    unawaited(_events?.cancel());
    _events = null;
    _allowed = false;
  }
}

final _filter = ui.ImageFilter.compose(
  inner: ui.ImageFilter.blur(
    sigmaX: GlassTokens.blur,
    sigmaY: GlassTokens.blur,
    tileMode: TileMode.clamp,
  ),
  outer: ui.ColorFilter.matrix(_saturation(GlassTokens.saturation)),
);

List<double> _saturation(double s) {
  final r = .2126 * (1 - s), g = .7152 * (1 - s), b = .0722 * (1 - s);
  return [
    r + s,
    g,
    b,
    0,
    0,
    r,
    g + s,
    b,
    0,
    0,
    r,
    g,
    b + s,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
  ];
}

/// The sheet reads its own backdrop above the modal barrier. Bars share their enclosing group.
class GlassPanel extends StatelessWidget {
  const GlassPanel({
    super.key,
    required this.radius,
    this.sheet = false,
    required this.child,
  });
  final BorderRadius radius;
  final bool sheet;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final c = AcmeTheme.of(context).colors;
    final shadow = (sheet ? ShadowTokens.overlay : ShadowTokens.raised)
        .toBoxShadow()
        .copyWith(color: c.glassShadow);
    Widget panel(bool blur) {
      final contents = DecoratedBox(
        decoration: BoxDecoration(
          color: blur
              ? (sheet ? c.glassTintStrong : c.glassTint)
              : c.glassFallback,
        ),
        child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: blur
                ? LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      c.glassHighlight,
                      c.glassHighlight.withValues(alpha: 0),
                    ],
                    stops: const [0, .5],
                  )
                : null,
          ),
          child: child,
        ),
      );
      return DecoratedBox(
        decoration: BoxDecoration(borderRadius: radius, boxShadow: [shadow]),
        child: ClipRRect(
          borderRadius: radius,
          child: DecoratedBox(
            position: DecorationPosition.foreground,
            decoration: BoxDecoration(
              borderRadius: radius,
              border: Border.all(
                color: c.glassBorder,
                width: BorderTokens.widthThin,
              ),
            ),
            child: !blur
                ? contents
                : sheet
                ? BackdropFilter(filter: _filter, child: contents)
                : BackdropFilter.grouped(filter: _filter, child: contents),
          ),
        ),
      );
    }

    if (context.dependOnInheritedWidgetOfExactType<_DeviceGlass>() == null) {
      return GlassScene(
        child: Builder(builder: (inner) => panel(glassBlurEnabled(inner))),
      );
    }
    return panel(glassBlurEnabled(context));
  }
}
