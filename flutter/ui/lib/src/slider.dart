import 'dart:math' as math;

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart' as w;

import 'text.dart';
import 'theme.dart';
import 'tokens/tokens.g.dart';

int _decimals(double value) {
  final parts = value.toString().split('e');
  final digits = (parts.first.split('.').elementAtOrNull(1) ?? '')
      .replaceFirst(RegExp(r'0+$'), '')
      .length;
  return math
      .max(0, digits - (parts.length > 1 ? int.parse(parts[1]) : 0))
      .clamp(0, 15);
}

/// Work in units of the finest decimal so that 0.3 is a step of 0.1 and the last step fits.
double snapSlider(double raw, double min, double max, double step) {
  if (max <= min || step <= 0) return min;
  final scale = math
      .pow(
        10,
        [_decimals(min), _decimals(max), _decimals(step)].reduce(math.max),
      )
      .toDouble();
  final lo = (min * scale).round(),
      hi = (max * scale).round(),
      unit = (step * scale).round();
  if (unit == 0) return min;
  final index = ((raw * scale - lo) / unit).round().clamp(0, (hi - lo) ~/ unit);
  return (lo + index * unit) / scale;
}

class Slider extends w.StatefulWidget {
  const Slider({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
    this.min = 0,
    this.max = 100,
    this.step = 1,
    this.disabled = false,
    this.showValue = false,
  }) : assert(max >= min),
       assert(step > 0);
  final String label;
  final double value, min, max, step;
  final bool disabled, showValue;
  final w.ValueChanged<double> onChanged;
  @override
  w.State<Slider> createState() => _SliderState();
}

class _SliderState extends w.State<Slider> {
  bool focused = false;
  @override
  w.Widget build(w.BuildContext context) {
    final theme = AcmeTheme.of(context), c = theme.colors, s = theme.sizes;
    final rtl = w.Directionality.of(context) == w.TextDirection.rtl;
    final fraction = widget.max == widget.min
        ? 0.0
        : ((widget.value - widget.min) / (widget.max - widget.min)).clamp(
            0.0,
            1.0,
          );
    final precision = math.max(_decimals(widget.min), _decimals(widget.step));
    final display = widget.value.toStringAsFixed(precision);
    void set(double raw) {
      final next = snapSlider(raw, widget.min, widget.max, widget.step);
      if (!widget.disabled && next != widget.value) widget.onChanged(next);
    }

    final inc = snapSlider(
          widget.value + widget.step,
          widget.min,
          widget.max,
          widget.step,
        ),
        dec = snapSlider(
          widget.value - widget.step,
          widget.min,
          widget.max,
          widget.step,
        );
    return w.Semantics(
      slider: true,
      label: widget.label,
      value: display,
      enabled: !widget.disabled,
      increasedValue: inc.toStringAsFixed(precision),
      decreasedValue: dec.toStringAsFixed(precision),
      onIncrease: widget.disabled || inc == widget.value
          ? null
          : () => set(inc),
      onDecrease: widget.disabled || dec == widget.value
          ? null
          : () => set(dec),
      child: w.ExcludeSemantics(
        child: w.Column(
          mainAxisSize: w.MainAxisSize.min,
          crossAxisAlignment: w.CrossAxisAlignment.stretch,
          children: [
            w.Row(
              mainAxisAlignment: w.MainAxisAlignment.spaceBetween,
              children: [
                Text(widget.label, variant: TextVariant.label),
                if (widget.showValue)
                  Text(
                    display,
                    variant: TextVariant.detail,
                    tone: TextTone.secondary,
                  ),
              ],
            ),
            w.CallbackShortcuts(
              bindings: {
                w.SingleActivator(LogicalKeyboardKey.arrowRight): () =>
                    set(rtl ? dec : inc),
                w.SingleActivator(LogicalKeyboardKey.arrowLeft): () =>
                    set(rtl ? inc : dec),
                w.SingleActivator(LogicalKeyboardKey.arrowUp): () => set(inc),
                w.SingleActivator(LogicalKeyboardKey.arrowDown): () => set(dec),
                w.SingleActivator(LogicalKeyboardKey.home): () =>
                    set(widget.min),
                w.SingleActivator(LogicalKeyboardKey.end): () =>
                    set(widget.max),
              },
              child: w.FocusableActionDetector(
                enabled: !widget.disabled,
                onShowFocusHighlight: (f) => setState(() => focused = f),
                child: w.LayoutBuilder(
                  builder: (context, box) {
                    final travel = math.max(0.0, box.maxWidth - s.sliderThumb);
                    void move(double x) {
                      final along = travel == 0
                          ? 0.0
                          : ((x - s.sliderThumb / 2) / travel).clamp(0.0, 1.0);
                      set(
                        widget.min +
                            (rtl ? 1 - along : along) *
                                (widget.max - widget.min),
                      );
                    }

                    return w.GestureDetector(
                      behavior: w.HitTestBehavior.opaque,
                      onTapUp: widget.disabled
                          ? null
                          : (d) => move(d.localPosition.dx),
                      onHorizontalDragStart: widget.disabled
                          ? null
                          : (d) => move(d.localPosition.dx),
                      onHorizontalDragUpdate: widget.disabled
                          ? null
                          : (d) => move(d.localPosition.dx),
                      child: w.SizedBox(
                        height: s.targetMin,
                        child: w.Stack(
                          alignment: w.Alignment.center,
                          children: [
                            w.Container(
                              height: s.sliderTrack,
                              decoration: w.BoxDecoration(
                                color: c.sliderTrack,
                                borderRadius: w.BorderRadius.circular(
                                  RadiusTokens.full,
                                ),
                              ),
                              alignment: w.AlignmentDirectional.centerStart,
                              child: w.FractionallySizedBox(
                                widthFactor: fraction,
                                heightFactor: 1,
                                child: w.DecoratedBox(
                                  decoration: w.BoxDecoration(
                                    color: widget.disabled
                                        ? c.sliderDisabledFill
                                        : c.sliderFill,
                                    borderRadius: w.BorderRadius.circular(
                                      RadiusTokens.full,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            w.PositionedDirectional(
                              start: travel * fraction,
                              child: w.Container(
                                width: s.sliderThumb,
                                height: s.sliderThumb,
                                decoration: w.BoxDecoration(
                                  color: c.sliderThumb,
                                  shape: w.BoxShape.circle,
                                  border: w.Border.all(
                                    color: focused
                                        ? c.borderFocus
                                        : c.sliderThumbBorder,
                                    width: BorderTokens.widthThick,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
