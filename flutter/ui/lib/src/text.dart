import 'package:flutter/widgets.dart' as w;

import 'theme.dart';
import 'tokens/tokens.g.dart';

enum TextVariant {
  display,
  title,
  heading,
  body,
  bodyStrong,
  label,
  detail,
  footnote,
}

enum TextTone { primary, secondary, accent, danger, success, warning, inherit }

class Text extends w.StatelessWidget {
  const Text(
    this.text, {
    super.key,
    this.variant = TextVariant.body,
    this.tone = TextTone.inherit,
    this.heading = false,
    this.level,
    this.maxLines,
    this.align,
  });
  final String text;
  final TextVariant variant;
  final TextTone tone;
  final bool heading;
  final int? level, maxLines;
  final w.TextAlign? align;

  @override
  w.Widget build(w.BuildContext context) {
    final theme = AcmeTheme.of(context);
    final c = theme.colors;
    final role = switch (variant) {
      TextVariant.display => TypographyTokens.display,
      TextVariant.title => TypographyTokens.title,
      TextVariant.heading => TypographyTokens.heading,
      TextVariant.body => TypographyTokens.body,
      TextVariant.bodyStrong => TypographyTokens.bodyStrong,
      TextVariant.label => TypographyTokens.label,
      TextVariant.detail => TypographyTokens.detail,
      TextVariant.footnote => TypographyTokens.footnote,
    };
    final color = switch (tone) {
      TextTone.primary => c.textPrimary,
      TextTone.secondary => c.textSecondary,
      TextTone.accent => c.textAccent,
      TextTone.danger => c.statusDanger,
      TextTone.success => c.statusSuccess,
      TextTone.warning => c.statusWarning,
      TextTone.inherit =>
        w.DefaultTextStyle.of(context).style.color ?? c.textPrimary,
    };
    final child = w.Text(
      text,
      style: theme.text(role, color),
      textAlign: align,
      maxLines: maxLines,
      overflow: maxLines == null ? null : w.TextOverflow.ellipsis,
    );
    return heading || level != null
        ? w.Semantics(header: true, headingLevel: level, child: child)
        : child;
  }
}
