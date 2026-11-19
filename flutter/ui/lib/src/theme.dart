import 'package:flutter/foundation.dart'
    show TargetPlatform, defaultTargetPlatform;
import 'package:flutter/widgets.dart';

import 'tokens/tokens.g.dart';

/// What the components under an [AcmeTheme] draw with.
@immutable
final class AcmeThemeData {
  const AcmeThemeData({
    required this.brightness,
    required this.sizes,
    this.reducedMotion = false,
    this.fontFamily,
  });

  final Brightness brightness;
  final SizeTokens sizes;

  /// Whether the person asked the system for less motion. Animations jump instead.
  final bool reducedMotion;

  /// A family the app has bundled, such as Pretendard. Without one, text uses the system font.
  final String? fontFamily;

  ColorTokens get colors =>
      brightness == Brightness.dark ? ColorTokens.dark : ColorTokens.light;

  /// A type role, in a color and in the theme's family.
  TextStyle text(TextStyle role, Color color) =>
      role.copyWith(color: color, fontFamily: fontFamily);
}

/// Gives the components under it their colors and sizes. The brightness follows the system
/// unless it is set. Mobile uses the touch sizes and desktop uses the pointer sizes.
class AcmeTheme extends StatelessWidget {
  const AcmeTheme({
    super.key,
    this.brightness,
    this.sizes,
    this.fontFamily,
    required this.child,
  });

  final Brightness? brightness;
  final SizeTokens? sizes;
  final String? fontFamily;
  final Widget child;

  static AcmeThemeData of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<_AcmeThemeScope>();
    assert(scope != null, 'No AcmeTheme above this widget');
    return scope!.data;
  }

  @override
  Widget build(BuildContext context) {
    final media = MediaQuery.maybeOf(context);
    final data = AcmeThemeData(
      brightness: brightness ?? media?.platformBrightness ?? Brightness.light,
      sizes:
          sizes ??
          switch (defaultTargetPlatform) {
            TargetPlatform.macOS ||
            TargetPlatform.windows ||
            TargetPlatform.linux => SizeTokens.pointer,
            _ => SizeTokens.touch,
          },
      reducedMotion: media?.disableAnimations ?? false,
      fontFamily: fontFamily,
    );
    final colors = data.colors;
    return _AcmeThemeScope(
      data: data,
      child: DefaultTextStyle(
        style: data.text(TypographyTokens.body, colors.textPrimary),
        child: DefaultSelectionStyle(
          cursorColor: colors.accentDefault,
          selectionColor: colors.accentSubtle,
          child: child,
        ),
      ),
    );
  }
}

class _AcmeThemeScope extends InheritedWidget {
  const _AcmeThemeScope({required this.data, required super.child});

  final AcmeThemeData data;

  @override
  bool updateShouldNotify(_AcmeThemeScope oldWidget) =>
      data.brightness != oldWidget.data.brightness ||
      !identical(data.sizes, oldWidget.data.sizes) ||
      data.reducedMotion != oldWidget.data.reducedMotion ||
      data.fontFamily != oldWidget.data.fontFamily;
}
