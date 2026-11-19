import 'package:flutter/widgets.dart' hide Icon;

import 'icon.dart';
import 'indicators.dart';
import 'pressable.dart';
import 'theme.dart';
import 'tokens/tokens.g.dart';

enum ButtonVariant { primary, secondary, ghost, danger }

enum ControlSize { sm, md, lg }

class _Look {
  const _Look(this.background, this.hover, this.pressed, this.text);
  final Color background;
  final Color hover;
  final Color pressed;
  final Color text;
}

_Look _look(ColorTokens c, ButtonVariant variant) => switch (variant) {
  ButtonVariant.primary => _Look(
    c.buttonPrimaryBackground,
    c.buttonPrimaryBackgroundHover,
    c.buttonPrimaryBackgroundPressed,
    c.buttonPrimaryText,
  ),
  ButtonVariant.secondary => _Look(
    c.buttonSecondaryBackground,
    c.buttonSecondaryBackgroundHover,
    c.buttonSecondaryBackgroundPressed,
    c.buttonSecondaryText,
  ),
  ButtonVariant.ghost => _Look(
    const Color(0x00000000),
    c.buttonGhostBackgroundHover,
    c.buttonGhostBackgroundPressed,
    c.buttonGhostText,
  ),
  ButtonVariant.danger => _Look(
    c.buttonDangerBackground,
    c.buttonDangerBackgroundHover,
    c.buttonDangerBackgroundPressed,
    c.buttonDangerText,
  ),
};

class Button extends StatelessWidget {
  const Button({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = ButtonVariant.secondary,
    this.size = ControlSize.md,
    this.disabled = false,
    this.loading = false,
    this.fullWidth = false,
    this.selected,
    this.iconStart,
    this.iconEnd,
  });
  final String label;
  final VoidCallback? onPressed;
  final ButtonVariant variant;
  final ControlSize size;
  final bool disabled, loading, fullWidth;
  final bool? selected;
  final IconName? iconStart, iconEnd;
  @override
  Widget build(BuildContext context) => _Action(
    label: label,
    onPressed: onPressed,
    variant: variant,
    size: size,
    disabled: disabled,
    loading: loading,
    fullWidth: fullWidth,
    selected: selected,
    iconStart: iconStart,
    iconEnd: iconEnd,
  );
}

class IconButton extends StatelessWidget {
  const IconButton({
    super.key,
    required this.label,
    required this.icon,
    required this.onPressed,
    this.variant = ButtonVariant.ghost,
    this.size = ControlSize.md,
    this.disabled = false,
    this.loading = false,
    this.selected,
  });
  final String label;
  final VoidCallback? onPressed;
  final IconName icon;
  final ButtonVariant variant;
  final ControlSize size;
  final bool disabled, loading;
  final bool? selected;
  @override
  Widget build(BuildContext context) => _Action(
    label: label,
    onPressed: onPressed,
    variant: variant,
    size: size,
    disabled: disabled,
    loading: loading,
    fullWidth: false,
    selected: selected,
    iconStart: icon,
    iconOnly: true,
  );
}

class _Action extends StatelessWidget {
  const _Action({
    required this.label,
    required this.onPressed,
    required this.variant,
    required this.size,
    required this.disabled,
    required this.loading,
    required this.fullWidth,
    this.selected,
    this.iconStart,
    this.iconEnd,
    this.iconOnly = false,
  });
  final String label;
  final VoidCallback? onPressed;
  final ButtonVariant variant;
  final ControlSize size;
  final bool disabled, loading, fullWidth, iconOnly;
  final bool? selected;
  final IconName? iconStart, iconEnd;

  @override
  Widget build(BuildContext context) {
    final theme = AcmeTheme.of(context);
    final c = theme.colors;
    final inactive = disabled || onPressed == null;
    final on =
        selected == true &&
        !inactive &&
        (variant == ButtonVariant.secondary || variant == ButtonVariant.ghost);
    final look = on
        ? _Look(
            c.buttonSelectedBackground,
            c.buttonSelectedBackgroundHover,
            c.buttonSelectedBackgroundPressed,
            c.buttonSelectedText,
          )
        : _look(c, variant);
    final height = switch (size) {
      ControlSize.sm => theme.sizes.controlSm,
      ControlSize.md => theme.sizes.controlMd,
      ControlSize.lg => theme.sizes.controlLg,
    };
    final padding = switch (size) {
      ControlSize.sm => SpaceTokens.s3,
      ControlSize.md => SpaceTokens.s4,
      ControlSize.lg => SpaceTokens.s6,
    };
    final color = inactive ? c.buttonDisabledText : look.text;
    final outline = inactive
        ? null
        : on
        ? c.buttonSelectedBorder
        : variant == ButtonVariant.secondary
        ? c.buttonSecondaryBorder
        : null;
    final corner = BorderRadius.circular(theme.sizes.buttonRadius);
    final iconSize = size == ControlSize.lg ? IconSize.md : IconSize.sm;
    final enabled = !inactive && !loading;
    return Semantics(
      button: true,
      enabled: enabled,
      toggled: selected,
      label: label,
      value: loading ? 'Loading' : null,
      child: Pressable(
        onPressed: enabled ? onPressed : null,
        radius: corner,
        builder: (pressed, hovered) {
          final fill = inactive
              ? (variant == ButtonVariant.ghost
                    ? null
                    : c.buttonDisabledBackground)
              : pressed
              ? look.pressed
              : hovered
              ? look.hover
              : look.background;
          return AnimatedScale(
            scale: pressed ? MotionTokens.pressScale : 1,
            curve: MotionTokens.easingStandard,
            duration: theme.reducedMotion
                ? Duration.zero
                : MotionTokens.durationFast,
            child: Container(
              width: iconOnly
                  ? height
                  : fullWidth
                  ? double.infinity
                  : null,
              constraints: BoxConstraints(minHeight: height, minWidth: height),
              padding: EdgeInsets.symmetric(horizontal: iconOnly ? 0 : padding),
              decoration: BoxDecoration(
                color: fill,
                borderRadius: corner,
                border: outline == null
                    ? null
                    : Border.all(color: outline, width: BorderTokens.widthThin),
                boxShadow: variant == ButtonVariant.ghost || inactive
                    ? null
                    : [ShadowTokens.subtle.toBoxShadow()],
              ),
              child: ExcludeSemantics(
                child: Row(
                  mainAxisSize: fullWidth ? MainAxisSize.max : MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  spacing: SpaceTokens.s2,
                  children: [
                    if (loading)
                      Spinner(size: ControlSize.sm, color: color)
                    else if (iconStart case final icon?)
                      Icon(icon, size: iconSize, color: color, filled: on),
                    if (!iconOnly)
                      Flexible(
                        child: Text(
                          label,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: theme.text(
                            size == ControlSize.lg
                                ? TypographyTokens.bodyStrong
                                : TypographyTokens.label,
                            color,
                          ),
                        ),
                      ),
                    if (iconEnd case final icon?)
                      Icon(icon, size: iconSize, color: color),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
