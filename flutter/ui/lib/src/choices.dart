import 'dart:ui' show SemanticsRole;

import 'package:flutter/widgets.dart' as w;

import 'icon.dart';
import 'pressable.dart';
import 'text.dart';
import 'theme.dart';
import 'tokens/tokens.g.dart';

class ChoiceOption<T> {
  const ChoiceOption(
    this.value,
    this.label, {
    this.description,
    this.icon,
    this.disabled = false,
  });
  final T value;
  final String label;
  final String? description;
  final IconName? icon;
  final bool disabled;
}

class Switch extends w.StatelessWidget {
  const Switch({
    super.key,
    this.label,
    this.accessibilityLabel,
    required this.checked,
    required this.onChanged,
    this.disabled = false,
  });
  final String? label, accessibilityLabel;
  final bool checked, disabled;
  final w.ValueChanged<bool> onChanged;
  @override
  w.Widget build(w.BuildContext context) {
    final theme = AcmeTheme.of(context), c = theme.colors, s = theme.sizes;
    final track = disabled
        ? c.switchDisabledTrack
        : checked
        ? c.switchTrackOn
        : c.switchTrack;
    final thumb = s.switchHeight - 2 * SpaceTokens.s0_5;
    return w.Semantics(
      toggled: checked,
      enabled: !disabled,
      label: accessibilityLabel ?? label,
      child: Pressable(
        onPressed: disabled ? null : () => onChanged(!checked),
        builder: (_, _) => w.ExcludeSemantics(
          child: w.Row(
            mainAxisSize: w.MainAxisSize.min,
            spacing: SpaceTokens.s2,
            children: [
              w.Container(
                width: s.switchWidth,
                height: s.switchHeight,
                padding: const w.EdgeInsets.all(SpaceTokens.s0_5),
                decoration: w.BoxDecoration(
                  color: track,
                  borderRadius: w.BorderRadius.circular(RadiusTokens.full),
                ),
                child: w.AnimatedAlign(
                  duration: theme.reducedMotion
                      ? Duration.zero
                      : MotionTokens.durationFast,
                  curve: MotionTokens.easingStandard,
                  alignment: checked
                      ? w.AlignmentDirectional.centerEnd
                      : w.AlignmentDirectional.centerStart,
                  child: w.Container(
                    width: thumb,
                    height: thumb,
                    decoration: w.BoxDecoration(
                      shape: w.BoxShape.circle,
                      color: disabled ? c.switchDisabledThumb : c.switchThumb,
                    ),
                  ),
                ),
              ),
              if (label case final label?)
                w.Flexible(
                  child: w.Text(
                    label,
                    style: theme.text(
                      TypographyTokens.body,
                      disabled ? c.textDisabled : c.textPrimary,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class Checkbox extends w.StatelessWidget {
  const Checkbox({
    super.key,
    this.label,
    this.accessibilityLabel,
    required this.checked,
    required this.onChanged,
    this.disabled = false,
  });
  final String? label, accessibilityLabel;
  final bool checked, disabled;
  final w.ValueChanged<bool> onChanged;
  @override
  w.Widget build(w.BuildContext context) {
    final theme = AcmeTheme.of(context), c = theme.colors;
    final fill = disabled
        ? c.checkboxDisabledBackground
        : checked
        ? c.checkboxBackgroundChecked
        : null;
    return w.Semantics(
      checked: checked,
      enabled: !disabled,
      label: accessibilityLabel ?? label,
      child: Pressable(
        onPressed: disabled ? null : () => onChanged(!checked),
        builder: (_, _) => w.ExcludeSemantics(
          child: w.Row(
            mainAxisSize: w.MainAxisSize.min,
            spacing: SpaceTokens.s2,
            children: [
              w.Container(
                width: theme.sizes.checkbox,
                height: theme.sizes.checkbox,
                alignment: w.Alignment.center,
                decoration: w.BoxDecoration(
                  color: fill,
                  borderRadius: w.BorderRadius.circular(RadiusTokens.sm),
                  border: checked || disabled
                      ? null
                      : w.Border.all(
                          color: c.checkboxBorder,
                          width: BorderTokens.widthThick,
                        ),
                ),
                child: checked
                    ? Icon(
                        IconName.check,
                        size: IconSize.sm,
                        color: disabled
                            ? c.checkboxDisabledMark
                            : c.checkboxMark,
                      )
                    : null,
              ),
              if (label case final label?)
                w.Flexible(
                  child: w.Text(
                    label,
                    style: theme.text(
                      TypographyTokens.body,
                      disabled ? c.textDisabled : c.textPrimary,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class RadioGroup<T> extends w.StatelessWidget {
  const RadioGroup({
    super.key,
    required this.label,
    required this.options,
    required this.value,
    required this.onChanged,
    this.disabled = false,
    this.error,
  });
  final String label;
  final List<ChoiceOption<T>> options;
  final T? value;
  final w.ValueChanged<T> onChanged;
  final bool disabled;
  final String? error;
  @override
  w.Widget build(w.BuildContext context) {
    final theme = AcmeTheme.of(context), c = theme.colors;
    return w.Semantics(
      label: label,
      explicitChildNodes: true,
      child: w.RadioGroup<T>(
        groupValue: value,
        onChanged: (next) {
          if (next != null) onChanged(next);
        },
        child: w.Builder(
          builder: (context) => w.Column(
            mainAxisSize: w.MainAxisSize.min,
            crossAxisAlignment: w.CrossAxisAlignment.stretch,
            spacing: SpaceTokens.s1,
            children: [
              Text(label, variant: TextVariant.label),
              for (final option in options)
                _ChoiceRadio<T>(
                  key: w.ValueKey(option.value),
                  value: option.value,
                  enabled: !disabled && !option.disabled,
                  builder: (_, state) {
                    final off = disabled || option.disabled,
                        selected = option.value == value;
                    return w.Container(
                      constraints: w.BoxConstraints(
                        minHeight: theme.sizes.targetMin,
                      ),
                      alignment: w.AlignmentDirectional.centerStart,
                      decoration: state.states.contains(w.WidgetState.focused)
                          ? w.BoxDecoration(
                              border: w.Border.all(
                                color: c.borderFocus,
                                width: FocusTokens.width,
                              ),
                              borderRadius: w.BorderRadius.circular(
                                RadiusTokens.sm,
                              ),
                            )
                          : null,
                      child: w.Row(
                        spacing: SpaceTokens.s2,
                        children: [
                          w.Container(
                            width: theme.sizes.radio,
                            height: theme.sizes.radio,
                            alignment: w.Alignment.center,
                            decoration: w.BoxDecoration(
                              shape: w.BoxShape.circle,
                              color: off ? c.radioDisabledBackground : null,
                              border: w.Border.all(
                                color: off
                                    ? c.radioDisabledBackground
                                    : selected
                                    ? c.radioBorderChecked
                                    : c.radioBorder,
                                width: BorderTokens.widthThick,
                              ),
                            ),
                            child: selected
                                ? w.FractionallySizedBox(
                                    widthFactor: .5,
                                    heightFactor: .5,
                                    child: w.DecoratedBox(
                                      decoration: w.BoxDecoration(
                                        shape: w.BoxShape.circle,
                                        color: off
                                            ? c.radioDisabledDot
                                            : c.radioDot,
                                      ),
                                    ),
                                  )
                                : null,
                          ),
                          w.Expanded(
                            child: w.Column(
                              mainAxisSize: w.MainAxisSize.min,
                              crossAxisAlignment: w.CrossAxisAlignment.start,
                              children: [
                                w.Text(
                                  option.label,
                                  style: theme.text(
                                    TypographyTokens.body,
                                    off ? c.textDisabled : c.textPrimary,
                                  ),
                                ),
                                if (option.description case final desc?)
                                  w.Text(
                                    desc,
                                    style: theme.text(
                                      TypographyTokens.detail,
                                      off ? c.textDisabled : c.textSecondary,
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              if (error case final error?)
                w.Semantics(
                  liveRegion: true,
                  child: Text(
                    error,
                    variant: TextVariant.footnote,
                    tone: TextTone.danger,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class SegmentedControl<T> extends w.StatelessWidget {
  const SegmentedControl({
    super.key,
    required this.options,
    required this.value,
    required this.onChanged,
    this.fullWidth = false,
  });
  final List<ChoiceOption<T>> options;
  final T value;
  final w.ValueChanged<T> onChanged;
  final bool fullWidth;
  @override
  w.Widget build(w.BuildContext context) {
    final theme = AcmeTheme.of(context);
    final colors = theme.colors;
    const inset = SpaceTokens.s1;
    final corner = w.BorderRadius.circular(RadiusTokens.md - inset);
    final selected = options.indexWhere((option) => option.value == value);
    final group = w.RadioGroup<T>(
      groupValue: value,
      onChanged: (next) {
        if (next != null) onChanged(next);
      },
      child: w.Stack(
        fit: w.StackFit.passthrough,
        children: [
          if (selected >= 0)
            w.Positioned.fill(
              child: w.AnimatedAlign(
                duration: theme.reducedMotion
                    ? Duration.zero
                    : MotionTokens.durationFast,
                curve: MotionTokens.easingStandard,
                alignment: w.AlignmentDirectional(
                  options.length < 2
                      ? 0
                      : 2 * selected / (options.length - 1) - 1,
                  0,
                ),
                child: w.FractionallySizedBox(
                  widthFactor: 1 / options.length,
                  heightFactor: 1,
                  child: w.DecoratedBox(
                    decoration: w.BoxDecoration(
                      color: colors.segmentedSelectedBackground,
                      borderRadius: corner,
                      border: w.Border.all(
                        color: colors.segmentedSelectedBorder,
                        width: BorderTokens.widthThin,
                      ),
                      boxShadow: [ShadowTokens.subtle.toBoxShadow()],
                    ),
                  ),
                ),
              ),
            ),
          w.Row(
            children: [
              for (final option in options)
                w.Expanded(
                  child: _ChoiceRadio<T>(
                    key: w.ValueKey(option.value),
                    value: option.value,
                    enabled: !option.disabled,
                    builder: (_, state) => w.Container(
                      alignment: w.Alignment.center,
                      padding: const w.EdgeInsets.symmetric(
                        horizontal: SpaceTokens.s4,
                      ),
                      decoration: state.states.contains(w.WidgetState.focused)
                          ? w.BoxDecoration(
                              borderRadius: corner,
                              border: w.Border.all(
                                color: colors.borderFocus,
                                width: FocusTokens.width,
                              ),
                            )
                          : null,
                      child: w.Text(
                        option.label,
                        maxLines: 1,
                        overflow: w.TextOverflow.ellipsis,
                        style: theme.text(
                          TypographyTokens.label,
                          value == option.value
                              ? colors.segmentedSelectedText
                              : colors.segmentedText,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
    final track = w.Container(
      height: theme.sizes.controlMd,
      padding: const w.EdgeInsets.all(inset),
      decoration: w.BoxDecoration(
        color: colors.segmentedTrack,
        borderRadius: w.BorderRadius.circular(RadiusTokens.md),
      ),
      child: group,
    );
    if (fullWidth) return track;
    // Give every segment the widest label's width even when the parent stretches its children.
    return w.Align(
      alignment: w.AlignmentDirectional.centerStart,
      widthFactor: 1,
      heightFactor: 1,
      child: w.IntrinsicWidth(child: track),
    );
  }
}

class Chip extends w.StatelessWidget {
  const Chip({
    super.key,
    required this.label,
    required this.onPressed,
    this.selected = false,
    this.disabled = false,
    this.iconStart,
  });
  final String label;
  final w.VoidCallback? onPressed;
  final bool selected, disabled;
  final IconName? iconStart;
  @override
  w.Widget build(w.BuildContext context) {
    final theme = AcmeTheme.of(context),
        c = theme.colors,
        corner = w.BorderRadius.circular(RadiusTokens.full);
    final off = disabled || onPressed == null;
    final ink = off
        ? c.chipDisabledText
        : selected
        ? c.chipSelectedText
        : c.chipText;
    return w.Semantics(
      button: true,
      toggled: selected,
      enabled: !off,
      child: Pressable(
        onPressed: off ? null : onPressed,
        radius: corner,
        builder: (pressed, hovered) {
          final bg = off
              ? c.chipDisabledBackground
              : selected
              ? (pressed
                    ? c.chipSelectedBackgroundPressed
                    : hovered
                    ? c.chipSelectedBackgroundHover
                    : c.chipSelectedBackground)
              : (pressed
                    ? c.chipBackgroundPressed
                    : hovered
                    ? c.chipBackgroundHover
                    : c.chipBackground);
          return w.Container(
            constraints: w.BoxConstraints(minHeight: theme.sizes.chip),
            padding: const w.EdgeInsets.symmetric(horizontal: SpaceTokens.s3),
            decoration: w.BoxDecoration(
              color: bg,
              borderRadius: corner,
              border: selected && !off
                  ? w.Border.all(
                      color: c.chipSelectedBorder,
                      width: BorderTokens.widthThin,
                    )
                  : null,
            ),
            child: w.Row(
              mainAxisSize: w.MainAxisSize.min,
              spacing: SpaceTokens.s1,
              children: [
                if ((selected ? IconName.check : iconStart) case final icon?)
                  Icon(icon, size: IconSize.sm, color: ink),
                w.Text(label, style: theme.text(TypographyTokens.label, ink)),
              ],
            ),
          );
        },
      ),
    );
  }
}

class ChipBar extends w.StatelessWidget {
  const ChipBar({super.key, required this.label, required this.children});
  final String label;
  final List<w.Widget> children;
  @override
  w.Widget build(w.BuildContext context) => w.Semantics(
    container: true,
    explicitChildNodes: true,
    label: label,
    child: w.SingleChildScrollView(
      scrollDirection: w.Axis.horizontal,
      padding: const w.EdgeInsets.all(FocusTokens.width),
      child: w.Row(spacing: SpaceTokens.s2, children: children),
    ),
  );
}

class Tabs<T> extends w.StatelessWidget {
  const Tabs({
    super.key,
    required this.label,
    required this.items,
    required this.value,
    required this.onChanged,
    this.fullWidth = false,
  });
  final String label;
  final List<ChoiceOption<T>> items;
  final T value;
  final w.ValueChanged<T> onChanged;
  final bool fullWidth;
  @override
  w.Widget build(w.BuildContext context) {
    final theme = AcmeTheme.of(context), c = theme.colors;
    final tabs = <w.Widget>[
      for (final item in items)
        w.Semantics(
          container: true,
          excludeSemantics: true,
          label: item.label,
          onTap: item.disabled ? null : () => onChanged(item.value),
          role: SemanticsRole.tab,
          selected: item.value == value,
          enabled: !item.disabled,
          child: Pressable(
            minTarget: false,
            onPressed: item.disabled ? null : () => onChanged(item.value),
            builder: (_, hovered) {
              final selected = item.value == value;
              final color = selected
                  ? c.tabsTextSelected
                  : hovered
                  ? c.tabsTextHover
                  : c.tabsText;
              return w.Container(
                alignment: w.Alignment.center,
                constraints: w.BoxConstraints(minHeight: theme.sizes.tab),
                padding: const w.EdgeInsets.symmetric(
                  horizontal: SpaceTokens.s3,
                ),
                decoration: w.BoxDecoration(
                  border: w.Border(
                    bottom: w.BorderSide(
                      color: selected ? c.tabsIndicator : c.tabsBorder,
                      width: selected
                          ? BorderTokens.widthThick
                          : BorderTokens.widthThin,
                    ),
                  ),
                ),
                child: w.Row(
                  mainAxisSize: w.MainAxisSize.min,
                  spacing: SpaceTokens.s1,
                  children: [
                    if (item.icon case final icon?)
                      Icon(icon, size: IconSize.sm, color: color),
                    w.Text(
                      item.label,
                      maxLines: 1,
                      style: theme.text(TypographyTokens.label, color),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
    ];
    final row = w.Row(
      mainAxisSize: fullWidth ? w.MainAxisSize.max : w.MainAxisSize.min,
      children: [
        for (final tab in tabs)
          if (fullWidth) w.Expanded(child: tab) else tab,
      ],
    );
    final tabList = w.Semantics(
      container: true,
      role: SemanticsRole.tabBar,
      label: label,
      explicitChildNodes: true,
      child: row,
    );
    // Keep the scroll container outside the tab list so assistive technology sees its tabs as direct children.
    return fullWidth
        ? tabList
        : w.SingleChildScrollView(
            scrollDirection: w.Axis.horizontal,
            child: tabList,
          );
  }
}

class _ChoiceRadio<T> extends w.StatefulWidget {
  const _ChoiceRadio({
    super.key,
    required this.value,
    required this.enabled,
    required this.builder,
  });
  final T value;
  final bool enabled;
  final w.RadioBuilder builder;
  @override
  w.State<_ChoiceRadio<T>> createState() => _ChoiceRadioState<T>();
}

class _ChoiceRadioState<T> extends w.State<_ChoiceRadio<T>> {
  final focus = w.FocusNode();
  @override
  void dispose() {
    focus.dispose();
    super.dispose();
  }

  @override
  w.Widget build(w.BuildContext context) => w.RawRadio<T>(
    value: widget.value,
    groupRegistry: w.RadioGroup.maybeOf<T>(context),
    mouseCursor: w.WidgetStatePropertyAll(
      widget.enabled ? w.SystemMouseCursors.click : w.SystemMouseCursors.basic,
    ),
    toggleable: false,
    autofocus: false,
    focusNode: focus,
    enabled: widget.enabled,
    builder: widget.builder,
  );
}
