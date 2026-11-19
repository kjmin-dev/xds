import 'package:flutter/widgets.dart' as w;

import 'badges.dart';
import 'icon.dart';
import 'pressable.dart';
import 'text.dart';
import 'theme.dart';
import 'tokens/tokens.g.dart';

class Card extends w.StatelessWidget {
  const Card({
    super.key,
    this.title,
    this.description,
    this.actions,
    this.media,
    this.child,
    this.onPressed,
    this.flush = false,
    this.selected = false,
  }) : assert(onPressed == null || actions == null);
  final String? title, description;
  final w.Widget? actions, media, child;
  final w.VoidCallback? onPressed;
  final bool flush, selected;
  @override
  w.Widget build(w.BuildContext context) {
    final c = AcmeTheme.of(context).colors;
    final corner = w.BorderRadius.circular(RadiusTokens.lg);
    w.Widget buildCard(bool pressed, bool hovered) => w.Container(
      decoration: w.BoxDecoration(
        color: pressed
            ? c.cardBackgroundPressed
            : hovered
            ? c.cardBackgroundHover
            : c.backgroundSurface,
        borderRadius: corner,
        boxShadow: [ShadowTokens.subtle.toBoxShadow()],
      ),
      foregroundDecoration: w.BoxDecoration(
        border: w.Border.all(
          color: selected ? c.cardBorderSelected : c.borderDefault,
          width: selected ? BorderTokens.widthThick : BorderTokens.widthThin,
        ),
        borderRadius: corner,
      ),
      clipBehavior: w.Clip.antiAlias,
      child: w.Column(
        crossAxisAlignment: w.CrossAxisAlignment.stretch,
        mainAxisSize: w.MainAxisSize.min,
        children: [
          ?media,
          w.Padding(
            padding: w.EdgeInsets.all(flush ? 0 : SpaceTokens.s4),
            child: w.Column(
              crossAxisAlignment: w.CrossAxisAlignment.stretch,
              spacing: flush ? 0 : SpaceTokens.s4,
              children: [
                if (title != null || description != null || actions != null)
                  w.Row(
                    crossAxisAlignment: w.CrossAxisAlignment.start,
                    spacing: SpaceTokens.s3,
                    children: [
                      w.Expanded(
                        child: w.Column(
                          crossAxisAlignment: w.CrossAxisAlignment.start,
                          spacing: SpaceTokens.s0_5,
                          children: [
                            if (title case final title?)
                              Text(
                                title,
                                variant: TextVariant.heading,
                                heading: true,
                              ),
                            if (description case final desc?)
                              Text(
                                desc,
                                variant: TextVariant.detail,
                                tone: TextTone.secondary,
                              ),
                          ],
                        ),
                      ),
                      ?actions,
                    ],
                  ),
                ?child,
              ],
            ),
          ),
        ],
      ),
    );
    return onPressed == null
        ? buildCard(false, false)
        : w.Semantics(
            button: true,
            selected: selected,
            child: Pressable(
              onPressed: onPressed,
              radius: corner,
              builder: buildCard,
              minTarget: false,
            ),
          );
  }
}

class ListRow extends w.StatelessWidget {
  const ListRow({
    super.key,
    required this.title,
    this.description,
    this.leading,
    this.trailing,
    this.chevron = false,
    this.onPressed,
    this.disabled = false,
    this.selected = false,
    this.compact = false,
  });
  final String title;
  final String? description;
  final w.Widget? leading, trailing;
  final w.VoidCallback? onPressed;
  final bool chevron, disabled, selected, compact;
  @override
  w.Widget build(w.BuildContext context) {
    final theme = AcmeTheme.of(context), c = theme.colors;
    w.Widget row(bool pressed, bool hovered) => w.Container(
      constraints: w.BoxConstraints(
        minHeight: compact ? theme.sizes.listRowCompact : theme.sizes.listRow,
      ),
      padding: w.EdgeInsets.symmetric(
        horizontal: SpaceTokens.s4,
        vertical: compact ? SpaceTokens.s1 : SpaceTokens.s2,
      ),
      color: selected
          ? (pressed || hovered
                ? c.listRowBackgroundSelectedHover
                : c.listRowBackgroundSelected)
          : pressed
          ? c.listRowBackgroundPressed
          : hovered
          ? c.listRowBackgroundHover
          : null,
      child: w.Row(
        spacing: SpaceTokens.s3,
        children: [
          ?leading,
          w.Expanded(
            child: w.Column(
              crossAxisAlignment: w.CrossAxisAlignment.start,
              mainAxisSize: w.MainAxisSize.min,
              spacing: SpaceTokens.s0_5,
              children: [
                Text(
                  title,
                  variant: selected
                      ? TextVariant.bodyStrong
                      : compact
                      ? TextVariant.label
                      : TextVariant.body,
                  tone: disabled ? TextTone.secondary : TextTone.primary,
                ),
                if (description case final desc?)
                  Text(
                    desc,
                    variant: compact
                        ? TextVariant.footnote
                        : TextVariant.detail,
                    tone: TextTone.secondary,
                  ),
              ],
            ),
          ),
          ?trailing,
          if (chevron)
            Icon(
              IconName.chevronRight,
              directional: true,
              color: c.textSecondary,
              size: IconSize.sm,
            ),
        ],
      ),
    );
    return onPressed == null
        ? row(false, false)
        : w.Semantics(
            button: true,
            enabled: !disabled,
            selected: selected,
            child: Pressable(
              onPressed: disabled ? null : onPressed,
              builder: row,
            ),
          );
  }
}

enum ThumbnailRatio { ratio16x9, ratio1x1, ratio4x3, ratio9x16 }

class Thumbnail extends w.StatelessWidget {
  const Thumbnail({
    super.key,
    this.src,
    this.alt = '',
    this.ratio = ThumbnailRatio.ratio16x9,
    this.badge,
    this.progress,
  });
  final w.ImageProvider? src;
  final String alt;
  final ThumbnailRatio ratio;
  final String? badge;
  final double? progress;
  @override
  w.Widget build(w.BuildContext context) {
    final c = AcmeTheme.of(context).colors;
    final ratioValue = switch (ratio) {
      ThumbnailRatio.ratio16x9 => 16 / 9,
      ThumbnailRatio.ratio1x1 => 1.0,
      ThumbnailRatio.ratio4x3 => 4 / 3,
      ThumbnailRatio.ratio9x16 => 9 / 16,
    };
    final placeholder = w.ColoredBox(
      color: c.thumbnailBackground,
      child: w.Center(
        child: Icon(IconName.image, size: IconSize.xl, color: c.thumbnailIcon),
      ),
    );
    final fraction = (progress ?? 0).clamp(0.0, 1.0);
    final drawing = w.AspectRatio(
      aspectRatio: ratioValue,
      child: w.ClipRRect(
        borderRadius: w.BorderRadius.circular(RadiusTokens.md),
        child: w.Stack(
          fit: w.StackFit.expand,
          children: [
            if (src case final src?)
              w.Image(
                image: src,
                fit: w.BoxFit.cover,
                frameBuilder: (_, child, frame, sync) =>
                    sync || frame != null ? child : placeholder,
                errorBuilder: (_, _, _) => placeholder,
              )
            else
              placeholder,
            if (badge case final badge?)
              w.PositionedDirectional(
                end: SpaceTokens.s2,
                bottom: SpaceTokens.s2,
                child: Badge(label: badge, tone: BadgeTone.overlay),
              ),
            if (fraction > 0)
              w.PositionedDirectional(
                start: 0,
                end: 0,
                bottom: 0,
                height: SpaceTokens.s1,
                child: w.Container(
                  color: c.overlayBackground,
                  alignment: w.AlignmentDirectional.centerStart,
                  child: w.FractionallySizedBox(
                    heightFactor: 1,
                    widthFactor: fraction,
                    child: w.ColoredBox(color: c.overlayAccent),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
    return alt.isEmpty
        ? w.ExcludeSemantics(child: drawing)
        : w.Semantics(
            image: true,
            label: alt,
            excludeSemantics: true,
            child: drawing,
          );
  }
}

enum MediaLayout { vertical, horizontal }

class MediaCard extends w.StatelessWidget {
  const MediaCard({
    super.key,
    required this.title,
    this.layout = MediaLayout.vertical,
    this.src,
    this.alt = '',
    this.ratio = ThumbnailRatio.ratio16x9,
    this.badge,
    this.progress,
    this.meta = const [],
    this.leading,
    this.action,
    this.onPressed,
  });
  final String title, alt;
  final MediaLayout layout;
  final w.ImageProvider? src;
  final ThumbnailRatio ratio;
  final String? badge;
  final double? progress;
  final List<String> meta;
  final w.Widget? leading, action;
  final w.VoidCallback? onPressed;
  @override
  w.Widget build(w.BuildContext context) {
    final c = AcmeTheme.of(context).colors;
    final corner = w.BorderRadius.circular(RadiusTokens.lg);
    final image = Thumbnail(
      src: src,
      alt: alt,
      ratio: ratio,
      badge: badge,
      progress: progress,
    );
    final text = w.Row(
      crossAxisAlignment: w.CrossAxisAlignment.start,
      spacing: SpaceTokens.s3,
      children: [
        if (layout == MediaLayout.vertical && leading != null) leading!,
        w.Expanded(
          child: w.Column(
            crossAxisAlignment: w.CrossAxisAlignment.start,
            spacing: SpaceTokens.s0_5,
            children: [
              Text(title, variant: TextVariant.bodyStrong, maxLines: 2),
              for (final detail in meta)
                Text(
                  detail,
                  variant: TextVariant.detail,
                  tone: TextTone.secondary,
                  maxLines: 1,
                ),
            ],
          ),
        ),
        ?action,
      ],
    );
    w.Widget body(bool pressed, bool hovered) => w.Container(
      padding: const w.EdgeInsets.all(SpaceTokens.s2),
      decoration: w.BoxDecoration(
        color: pressed
            ? c.cardBackgroundPressed
            : hovered
            ? c.cardBackgroundHover
            : null,
        borderRadius: corner,
      ),
      child: layout == MediaLayout.vertical
          ? w.Column(
              mainAxisSize: w.MainAxisSize.min,
              spacing: SpaceTokens.s3,
              children: [image, text],
            )
          : w.Row(
              crossAxisAlignment: w.CrossAxisAlignment.start,
              spacing: SpaceTokens.s3,
              children: [
                w.Flexible(flex: 2, child: image),
                w.Expanded(flex: 3, child: text),
              ],
            ),
    );
    return onPressed == null
        ? body(false, false)
        : w.Semantics(
            container: true,
            button: true,
            explicitChildNodes: action != null,
            child: Pressable(
              onPressed: onPressed,
              builder: body,
              minTarget: false,
              radius: corner,
            ),
          );
  }
}
