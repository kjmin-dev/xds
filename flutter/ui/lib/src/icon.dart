import 'package:flutter/widgets.dart' hide Icon;

import 'theme.dart';
import 'tokens/tokens.g.dart';

/// `xs` fits inside a badge, `sm` and `md` sit beside text, `lg` stands alone, `xl` illustrates.
enum IconSize { xs, sm, md, lg, xl }

// The grid the icons in design/icons are drawn on, and the width of their stroke.
const double _grid = 24;
const double _strokeWidth = 2;

/// An icon from design/icons, in the color of the text around it unless given one.
class Icon extends StatelessWidget {
  const Icon(
    this.name, {
    super.key,
    this.size = IconSize.md,
    this.color,
    this.filled = false,
    this.label,
    this.directional = false,
  });

  final IconName name;
  final IconSize size;
  final Color? color;
  final bool filled;
  final String? label;
  final bool directional;

  @override
  Widget build(BuildContext context) {
    final theme = AcmeTheme.of(context);
    final sizes = theme.sizes;
    final side = switch (size) {
      IconSize.xs => sizes.iconXs,
      IconSize.sm => sizes.iconSm,
      IconSize.md => sizes.iconMd,
      IconSize.lg => sizes.iconLg,
      IconSize.xl => sizes.iconXl,
    };
    final tint =
        color ??
        DefaultTextStyle.of(context).style.color ??
        theme.colors.textPrimary;
    final mirrored =
        directional && Directionality.of(context) == TextDirection.rtl;
    final drawing = CustomPaint(
      size: Size.square(side),
      painter: _IconPainter(
        _paths(name),
        tint,
        filled: filled,
        mirrored: mirrored,
      ),
    );
    return Semantics(
      label: label,
      image: label != null,
      excludeSemantics: true,
      child: label == null ? ExcludeSemantics(child: drawing) : drawing,
    );
  }
}

// Parsed once per icon: the path data never changes while the app runs.
final Map<IconName, List<Path>> _cache = {};
List<Path> _paths(IconName name) =>
    _cache[name] ??= name.paths.map(parseSvgPath).toList();

class _IconPainter extends CustomPainter {
  _IconPainter(
    this.paths,
    this.color, {
    required this.filled,
    required this.mirrored,
  });

  final List<Path> paths;
  final Color color;
  final bool filled;
  final bool mirrored;

  @override
  void paint(Canvas canvas, Size size) {
    final unit = size.shortestSide / _grid;
    canvas.save();
    if (mirrored) {
      canvas.translate(size.width, 0);
      canvas.scale(-1, 1);
    }
    canvas.scale(unit);
    final stroke = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = _strokeWidth
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    final fill = Paint()..color = color;
    for (final path in paths) {
      // The fill goes under the stroke, so a filled icon keeps its rounded outline.
      if (filled) canvas.drawPath(path, fill);
      canvas.drawPath(path, stroke);
    }
    canvas.restore();
  }

  @override
  bool shouldRepaint(_IconPainter old) =>
      old.paths != paths ||
      old.color != color ||
      old.filled != filled ||
      old.mirrored != mirrored;
}

/// Turns SVG path data into a [Path]. Covers the whole path grammar: the icons are drawn by
/// people, and the generator passes their `d` attributes through untouched.
Path parseSvgPath(String data) {
  final path = Path();
  final reader = _Reader(data);
  var command = '';
  var current = Offset.zero;
  var start = Offset.zero;
  // The last control point, which S and T reflect.
  Offset? control;
  var lastCommand = '';
  while (reader.skipSeparators()) {
    if (reader.atCommand) command = reader.command();
    if (command.isEmpty) {
      throw FormatException('Path data must start with a command', data);
    }
    final relative = command == command.toLowerCase();
    Offset point(double x, double y) =>
        relative ? current + Offset(x, y) : Offset(x, y);
    switch (command.toUpperCase()) {
      case 'M':
        current = point(reader.number(), reader.number());
        start = current;
        path.moveTo(current.dx, current.dy);
        // Pairs after the first are line segments.
        command = relative ? 'l' : 'L';
        control = null;
      case 'L':
        current = point(reader.number(), reader.number());
        path.lineTo(current.dx, current.dy);
        control = null;
      case 'H':
        final x = reader.number();
        current = Offset(relative ? current.dx + x : x, current.dy);
        path.lineTo(current.dx, current.dy);
        control = null;
      case 'V':
        final y = reader.number();
        current = Offset(current.dx, relative ? current.dy + y : y);
        path.lineTo(current.dx, current.dy);
        control = null;
      case 'C':
        final c1 = point(reader.number(), reader.number());
        final c2 = point(reader.number(), reader.number());
        final end = point(reader.number(), reader.number());
        path.cubicTo(c1.dx, c1.dy, c2.dx, c2.dy, end.dx, end.dy);
        control = c2;
        current = end;
      case 'S':
        final c1 = 'CS'.contains(lastCommand) && control != null
            ? current * 2 - control
            : current;
        final c2 = point(reader.number(), reader.number());
        final end = point(reader.number(), reader.number());
        path.cubicTo(c1.dx, c1.dy, c2.dx, c2.dy, end.dx, end.dy);
        control = c2;
        current = end;
      case 'Q':
        final c = point(reader.number(), reader.number());
        final end = point(reader.number(), reader.number());
        path.quadraticBezierTo(c.dx, c.dy, end.dx, end.dy);
        control = c;
        current = end;
      case 'T':
        final c = 'QT'.contains(lastCommand) && control != null
            ? current * 2 - control
            : current;
        final end = point(reader.number(), reader.number());
        path.quadraticBezierTo(c.dx, c.dy, end.dx, end.dy);
        control = c;
        current = end;
      case 'A':
        final rx = reader.number();
        final ry = reader.number();
        final rotation = reader.number();
        final large = reader.flag();
        final sweep = reader.flag();
        final end = point(reader.number(), reader.number());
        path.arcToPoint(
          end,
          radius: Radius.elliptical(rx, ry),
          rotation: rotation,
          largeArc: large,
          clockwise: sweep,
        );
        current = end;
        control = null;
      case 'Z':
        // Close has no arguments to repeat. A number after it must be rejected.
        command = '';
        path.close();
        current = start;
        control = null;
      default:
        throw FormatException('Unknown path command $command', data);
    }
    lastCommand = command.toUpperCase();
  }
  return path;
}

class _Reader {
  _Reader(this.text);

  final String text;
  int index = 0;

  static final _number = RegExp(r'[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?');

  bool skipSeparators() {
    while (index < text.length && ' ,\n\t\r'.contains(text[index])) {
      index++;
    }
    return index < text.length;
  }

  bool get atCommand => 'MmLlHhVvCcSsQqTtAaZz'.contains(text[index]);

  String command() => text[index++];

  double number() {
    skipSeparators();
    final match = _number.matchAsPrefix(text, index);
    if (match == null) throw FormatException('Expected a number', text, index);
    index = match.end;
    return double.parse(match[0]!);
  }

  // Arc flags are single digits and may be written without a separator: `a1 1 0 011 1`.
  bool flag() {
    if (!skipSeparators()) {
      throw FormatException('Expected a flag', text, index);
    }
    final digit = text[index++];
    if (digit != '0' && digit != '1') {
      throw FormatException('Expected a flag', text, index - 1);
    }
    return digit == '1';
  }
}
