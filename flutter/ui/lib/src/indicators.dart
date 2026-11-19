import 'dart:math' as math;
import 'dart:ui' show SemanticsRole;

import 'package:flutter/widgets.dart';

import 'button.dart' show ControlSize;
import 'theme.dart';
import 'tokens/tokens.g.dart';

class Divider extends StatelessWidget {
  const Divider({super.key});
  @override
  Widget build(BuildContext context) => ExcludeSemantics(
    child: SizedBox(
      height: BorderTokens.widthThin,
      width: double.infinity,
      child: ColoredBox(color: AcmeTheme.of(context).colors.borderDefault),
    ),
  );
}

class ProgressBar extends StatelessWidget {
  const ProgressBar({super.key, required this.value, required this.label});
  final double value;
  final String label;
  @override
  Widget build(BuildContext context) {
    final theme = AcmeTheme.of(context);
    final fraction = value.isFinite ? value.clamp(0.0, 1.0) : 0.0;
    return Semantics(
      role: SemanticsRole.progressBar,
      minValue: "0",
      maxValue: "100",
      label: label,
      value: '${(fraction * 100).round()}%',
      child: ClipRRect(
        borderRadius: BorderRadius.circular(RadiusTokens.full),
        child: Container(
          height: theme.sizes.progress,
          color: theme.colors.progressTrack,
          alignment: AlignmentDirectional.centerStart,
          child: FractionallySizedBox(
            widthFactor: fraction,
            heightFactor: 1,
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: theme.colors.progressFill,
                borderRadius: BorderRadius.circular(RadiusTokens.full),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class Spinner extends StatefulWidget {
  const Spinner({
    super.key,
    this.size = ControlSize.md,
    this.label,
    this.color,
  });
  final ControlSize size;
  final String? label;
  final Color? color;
  @override
  State<Spinner> createState() => _SpinnerState();
}

class _SpinnerState extends State<Spinner> with SingleTickerProviderStateMixin {
  late final controller = AnimationController(
    vsync: this,
    duration: MotionTokens.durationPulse,
  );
  bool? _reduced;
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final reduced = AcmeTheme.of(context).reducedMotion;
    if (_reduced == reduced) return;
    _reduced = reduced;
    controller.repeat(reverse: reduced);
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = AcmeTheme.of(context);
    final diameter = switch (widget.size) {
      ControlSize.sm => theme.sizes.spinnerSm,
      ControlSize.md => theme.sizes.spinnerMd,
      ControlSize.lg => theme.sizes.spinnerLg,
    };
    final arc = CustomPaint(
      size: Size.square(diameter),
      painter: _Arc(widget.color ?? theme.colors.textSecondary),
    );
    // The stationary arc pulses gently when rotation would be distracting.
    final drawing = theme.reducedMotion
        ? FadeTransition(
            opacity: Tween<double>(begin: 1, end: .4).animate(controller),
            child: arc,
          )
        : RotationTransition(turns: controller, child: arc);
    return widget.label == null
        ? ExcludeSemantics(child: drawing)
        : Semantics(
            role: SemanticsRole.loadingSpinner,
            label: widget.label,
            child: drawing,
          );
  }
}

class _Arc extends CustomPainter {
  const _Arc(this.color);
  final Color color;
  @override
  void paint(Canvas canvas, Size size) {
    final unit = size.shortestSide / 24;
    final ring = (Offset.zero & size).deflate(3 * unit);
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3 * unit;
    canvas.drawOval(
      ring,
      paint..color = color.withValues(alpha: color.a * .25),
    );
    canvas.drawArc(
      ring,
      -math.pi / 2,
      math.pi / 2,
      false,
      paint
        ..color = color
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(_Arc oldDelegate) => color != oldDelegate.color;
}

enum SkeletonShape { text, rect, circle }

class Skeleton extends StatefulWidget {
  const Skeleton({
    super.key,
    this.shape = SkeletonShape.text,
    this.width,
    this.height,
  });
  final SkeletonShape shape;
  final double? width, height;
  @override
  State<Skeleton> createState() => _SkeletonState();
}

class _SkeletonState extends State<Skeleton>
    with SingleTickerProviderStateMixin {
  late final controller = AnimationController(
    vsync: this,
    duration: MotionTokens.durationPulse,
  );
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (AcmeTheme.of(context).reducedMotion) {
      controller.stop();
      controller.value = 0;
    } else if (!controller.isAnimating) {
      controller.repeat(reverse: true);
    }
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = AcmeTheme.of(context).colors;
    final circle = widget.shape == SkeletonShape.circle;
    final h =
        widget.height ??
        (circle
            ? widget.width ?? AcmeTheme.of(context).sizes.avatarMd
            : widget.shape == SkeletonShape.text
            ? SpaceTokens.s4
            : SpaceTokens.s16);
    return ExcludeSemantics(
      child: AnimatedBuilder(
        animation: controller,
        builder: (_, _) => Container(
          height: h,
          width: circle ? h : widget.width ?? double.infinity,
          decoration: BoxDecoration(
            color: Color.lerp(
              c.skeletonBackground,
              c.skeletonHighlight,
              controller.value,
            ),
            borderRadius: BorderRadius.circular(
              circle
                  ? RadiusTokens.full
                  : widget.shape == SkeletonShape.rect
                  ? RadiusTokens.md
                  : RadiusTokens.sm,
            ),
          ),
        ),
      ),
    );
  }
}
