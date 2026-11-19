// The hand-written half of the tokens: the types the generated tokens.g.dart refers to.

import 'package:flutter/painting.dart';

/// A drop shadow, as the token files describe it: lengths in logical pixels, blur as in CSS.
final class ShadowToken {
  const ShadowToken({
    required this.color,
    required this.offsetX,
    required this.offsetY,
    required this.blur,
    required this.spread,
  });

  final Color color;
  final double offsetX;
  final double offsetY;
  final double blur;
  final double spread;

  /// The same shadow as on the web, which is the reference. CSS blurs by a Gaussian whose sigma
  /// is half the blur length; Flutter derives sigma from `blurRadius` as `r * 0.57735 + 0.5`.
  BoxShadow toBoxShadow() {
    final sigma = blur / 2;
    final radius = sigma <= 0.5 ? 0.0 : (sigma - 0.5) / 0.57735;
    return BoxShadow(
      color: color,
      offset: Offset(offsetX, offsetY),
      blurRadius: radius,
      spreadRadius: spread,
    );
  }
}
