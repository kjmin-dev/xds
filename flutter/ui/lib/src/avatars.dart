import 'dart:math' as math;

import 'package:flutter/widgets.dart';

import 'theme.dart';
import 'tokens/tokens.g.dart';

enum AvatarSize { sm, md, lg, xl }

double _diameter(SizeTokens s, AvatarSize size) => switch (size) {
  AvatarSize.sm => s.avatarSm,
  AvatarSize.md => s.avatarMd,
  AvatarSize.lg => s.avatarLg,
  AvatarSize.xl => s.avatarXl,
};
TextStyle _type(AvatarSize size) => switch (size) {
  AvatarSize.sm => TypographyTokens.footnote,
  AvatarSize.md => TypographyTokens.label,
  AvatarSize.lg => TypographyTokens.bodyStrong,
  AvatarSize.xl => TypographyTokens.title,
};

String initials(String name, [int count = 2]) => name
    .trim()
    .split(RegExp(r'\s+'))
    .where((word) => word.isNotEmpty)
    .take(count)
    .map((word) => String.fromCharCode(word.runes.first).toUpperCase())
    .join();

class Avatar extends StatelessWidget {
  const Avatar({
    super.key,
    required this.name,
    this.size = AvatarSize.md,
    this.src,
  });
  final String name;
  final AvatarSize size;
  final ImageProvider? src;
  @override
  Widget build(BuildContext context) {
    final theme = AcmeTheme.of(context), c = theme.colors;
    final fallback = ColoredBox(
      color: c.avatarBackground,
      child: Center(
        child: Text(
          initials(name, size == AvatarSize.sm ? 1 : 2),
          maxLines: 1,
          textScaler: TextScaler.noScaling,
          style: theme.text(_type(size), c.avatarText),
        ),
      ),
    );
    return Semantics(
      label: name,
      image: true,
      excludeSemantics: true,
      child: SizedBox.square(
        dimension: _diameter(theme.sizes, size),
        child: ClipOval(
          child: src == null
              ? fallback
              : Image(
                  image: src!,
                  fit: BoxFit.cover,
                  frameBuilder: (_, child, frame, synchronous) =>
                      frame != null || synchronous ? child : fallback,
                  errorBuilder: (_, _, _) => fallback,
                ),
        ),
      ),
    );
  }
}

class AvatarPerson {
  const AvatarPerson(this.name, {this.src});
  final String name;
  final ImageProvider? src;
}

class AvatarStack extends StatelessWidget {
  const AvatarStack({
    super.key,
    required this.people,
    this.size = AvatarSize.md,
    this.max = 4,
    this.label,
  });
  final List<AvatarPerson> people;
  final AvatarSize size;
  final int max;
  final String? label;
  @override
  Widget build(BuildContext context) {
    final theme = AcmeTheme.of(context), c = theme.colors;
    final d = _diameter(theme.sizes, size),
        stride = d * .75,
        count = math.min(people.length, math.max(0, max));
    final extra = people.length - count;
    final items = <Widget>[
      for (final person in people.take(count))
        Avatar(name: person.name, src: person.src, size: size),
      if (extra > 0)
        DecoratedBox(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: c.avatarOverflowBackground,
          ),
          child: Center(
            child: Text(
              '+$extra',
              style: theme.text(_type(size), c.avatarOverflowText),
            ),
          ),
        ),
    ];
    if (items.isEmpty) return const SizedBox.shrink();
    return Semantics(
      image: true,
      excludeSemantics: true,
      label: label ?? people.map((p) => p.name).join(', '),
      child: SizedBox(
        width: d + (items.length - 1) * stride,
        height: d,
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            for (var i = 0; i < items.length; i++)
              PositionedDirectional(
                start: i * stride,
                width: d,
                height: d,
                child: DecoratedBox(
                  position: DecorationPosition.foreground,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: c.avatarRing,
                      width: BorderTokens.widthThick,
                      strokeAlign: BorderSide.strokeAlignOutside,
                    ),
                  ),
                  child: items[i],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
