import 'package:flutter/widgets.dart' as w;

import 'button.dart';
import 'icon.dart';
import 'text.dart';
import 'theme.dart';
import 'tokens/tokens.g.dart';

enum BadgeTone { neutral, accent, success, warning, danger, overlay }

class Badge extends w.StatelessWidget {
  const Badge({
    super.key,
    required this.label,
    this.tone = BadgeTone.neutral,
    this.dot = false,
    this.icon,
  });
  final String label;
  final BadgeTone tone;
  final bool dot;
  final IconName? icon;
  @override
  w.Widget build(w.BuildContext context) {
    final theme = AcmeTheme.of(context), c = theme.colors;
    final (bg, fg) = switch (tone) {
      BadgeTone.neutral => (c.badgeNeutralBackground, c.badgeNeutralText),
      BadgeTone.accent => (c.badgeAccentBackground, c.badgeAccentText),
      BadgeTone.success => (c.badgeSuccessBackground, c.badgeSuccessText),
      BadgeTone.warning => (c.badgeWarningBackground, c.badgeWarningText),
      BadgeTone.danger => (c.badgeDangerBackground, c.badgeDangerText),
      BadgeTone.overlay => (c.badgeOverlayBackground, c.badgeOverlayText),
    };
    return w.Container(
      constraints: w.BoxConstraints(minHeight: theme.sizes.badge),
      padding: const w.EdgeInsets.symmetric(horizontal: SpaceTokens.s2),
      decoration: w.BoxDecoration(
        color: bg,
        borderRadius: w.BorderRadius.circular(RadiusTokens.full),
      ),
      child: w.Row(
        mainAxisSize: w.MainAxisSize.min,
        spacing: SpaceTokens.s1,
        children: [
          if (dot)
            w.Container(
              width: SpaceTokens.s1_5,
              height: SpaceTokens.s1_5,
              decoration: w.BoxDecoration(color: fg, shape: w.BoxShape.circle),
            ),
          if (icon case final name?) Icon(name, size: IconSize.xs, color: fg),
          w.Flexible(
            child: w.Text(
              label,
              maxLines: 1,
              overflow: w.TextOverflow.ellipsis,
              style: theme.text(TypographyTokens.footnote, fg),
            ),
          ),
        ],
      ),
    );
  }
}

class CountBadge extends w.StatelessWidget {
  const CountBadge({
    super.key,
    required this.count,
    this.max = 99,
    this.label,
    this.child,
  }) : assert(max >= 0);
  final int count, max;
  final String? label;
  final w.Widget? child;
  @override
  w.Widget build(w.BuildContext context) {
    if (count <= 0) return child ?? const w.SizedBox.shrink();
    final theme = AcmeTheme.of(context), c = theme.colors;
    final value = count > max ? '$max+' : '$count';
    final badge = w.Semantics(
      label: label ?? value,
      excludeSemantics: true,
      child: w.Container(
        constraints: w.BoxConstraints(
          minHeight: theme.sizes.countBadge,
          minWidth: theme.sizes.countBadge,
        ),
        padding: const w.EdgeInsets.symmetric(horizontal: SpaceTokens.s1),
        decoration: w.BoxDecoration(
          color: c.badgeCountBackground,
          borderRadius: w.BorderRadius.circular(RadiusTokens.full),
        ),
        child: w.Text(
          value,
          textAlign: w.TextAlign.center,
          style: theme.text(TypographyTokens.footnote, c.badgeCountText),
        ),
      ),
    );
    if (child == null) return badge;
    return w.Stack(
      clipBehavior: w.Clip.none,
      children: [
        child!,
        w.PositionedDirectional(
          top: -SpaceTokens.s1,
          end: -SpaceTokens.s1,
          child: badge,
        ),
      ],
    );
  }
}

enum BannerTone { info, success, warning, danger }

class Banner extends w.StatelessWidget {
  const Banner({
    super.key,
    required this.message,
    this.tone = BannerTone.info,
    this.title,
    this.action,
    this.onDismiss,
    this.dismissLabel = 'Dismiss',
  });
  final String message, dismissLabel;
  final String? title;
  final BannerTone tone;
  final w.Widget? action;
  final w.VoidCallback? onDismiss;
  @override
  w.Widget build(w.BuildContext context) {
    final theme = AcmeTheme.of(context), c = theme.colors;
    final (bg, fg, mark) = switch (tone) {
      BannerTone.info => (c.bannerInfoBackground, c.bannerInfoAccent, 'i'),
      BannerTone.success => (
        c.bannerSuccessBackground,
        c.bannerSuccessAccent,
        '✓',
      ),
      BannerTone.warning => (
        c.bannerWarningBackground,
        c.bannerWarningAccent,
        '!',
      ),
      BannerTone.danger => (
        c.bannerDangerBackground,
        c.bannerDangerAccent,
        '×',
      ),
    };
    return w.Semantics(
      container: true,
      liveRegion: true,
      child: w.Container(
        decoration: w.BoxDecoration(
          color: bg,
          borderRadius: w.BorderRadius.circular(RadiusTokens.md),
        ),
        padding: const w.EdgeInsets.all(SpaceTokens.s3),
        child: w.Row(
          crossAxisAlignment: w.CrossAxisAlignment.start,
          spacing: SpaceTokens.s2,
          children: [
            w.ExcludeSemantics(
              child: w.Container(
                width: theme.sizes.iconMd,
                height: theme.sizes.iconMd,
                alignment: w.Alignment.center,
                decoration: w.BoxDecoration(
                  shape: w.BoxShape.circle,
                  color: fg,
                ),
                child: w.Text(
                  mark,
                  style: theme.text(TypographyTokens.footnote, bg),
                ),
              ),
            ),
            w.Expanded(
              child: w.DefaultTextStyle.merge(
                style: w.TextStyle(color: c.bannerText),
                child: w.Column(
                  crossAxisAlignment: w.CrossAxisAlignment.start,
                  spacing: SpaceTokens.s1,
                  children: [
                    if (title case final title?)
                      Text(title, variant: TextVariant.label),
                    Text(message, variant: TextVariant.detail),
                    ?action,
                  ],
                ),
              ),
            ),
            if (onDismiss != null)
              IconButton(
                icon: IconName.x,
                label: dismissLabel,
                onPressed: onDismiss,
                size: ControlSize.sm,
              ),
          ],
        ),
      ),
    );
  }
}
