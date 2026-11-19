import 'dart:ui' show SemanticsRole;
import 'dart:math' as math;

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart' hide Icon;

import 'fields.dart';
import 'icon.dart';
import 'modals.dart';
import 'pressable.dart';
import 'theme.dart';
import 'tokens/tokens.g.dart';

enum MenuAlign { start, end }

class MenuItem {
  const MenuItem({
    required String this.label,
    required this.onSelected,
    this.icon,
    this.danger = false,
    this.disabled = false,
    this.selected = false,
  });
  const MenuItem.separator()
    : label = null,
      onSelected = null,
      icon = null,
      danger = false,
      disabled = true,
      selected = false;
  final String? label;
  final VoidCallback? onSelected;
  final IconName? icon;
  final bool danger, disabled, selected;
}

class SelectOption<T> {
  const SelectOption({
    required this.value,
    required this.label,
    this.description,
    this.disabled = false,
  });
  final T value;
  final String label;
  final String? description;
  final bool disabled;
}

class Menu extends StatelessWidget {
  const Menu({
    super.key,
    required this.label,
    required this.trigger,
    required this.items,
    this.align = MenuAlign.start,
    this.defaultOpen = false,
  });
  final String label;
  final Widget Function(VoidCallback show) trigger;
  final List<MenuItem> items;
  final MenuAlign align;
  final bool defaultOpen;
  @override
  Widget build(BuildContext context) => _Choices(
    label: label,
    defaultOpen: defaultOpen,
    align: align,
    trigger: (open, show) => Semantics(expanded: open, child: trigger(show)),
    rows: (close) => [
      for (final item in items)
        if (item.label case final name?)
          _ChoiceRow(
            label: name,
            icon: item.icon,
            selected: item.selected,
            danger: item.danger,
            onPressed: item.disabled
                ? null
                : () {
                    close();
                    item.onSelected?.call();
                  },
          )
        else
          ColoredBox(
            color: AcmeTheme.of(context).colors.menuBorder,
            child: const SizedBox(height: BorderTokens.widthThin),
          ),
    ],
  );
}

class Select<T> extends StatelessWidget {
  const Select({
    super.key,
    required this.label,
    required this.options,
    this.value,
    required this.onChanged,
    this.placeholder,
    this.description,
    this.error,
    this.disabled = false,
    this.defaultOpen = false,
  });
  final String label;
  final List<SelectOption<T>> options;
  final T? value;
  final ValueChanged<T> onChanged;
  final String? placeholder, description, error;
  final bool disabled, defaultOpen;
  @override
  Widget build(BuildContext context) => _Choices(
    label: label,
    defaultOpen: defaultOpen && !disabled,
    disabled: disabled,
    matchWidth: true,
    trigger: (open, show) => ChoiceField(
      label: label,
      value: options.where((e) => e.value == value).firstOrNull?.label,
      placeholder: placeholder,
      description: description,
      error: error,
      icon: IconName.chevronDown,
      open: open,
      disabled: disabled,
      onPressed: show,
    ),
    rows: (close) => [
      for (final item in options)
        _ChoiceRow(
          label: item.label,
          description: item.description,
          radio: true,
          selected: item.value == value,
          onPressed: item.disabled
              ? null
              : () {
                  close();
                  onChanged(item.value);
                },
        ),
    ],
  );
}

class ChoiceField extends StatelessWidget {
  const ChoiceField({
    super.key,
    required this.label,
    this.value,
    this.placeholder,
    this.description,
    this.error,
    required this.icon,
    required this.open,
    required this.disabled,
    required this.onPressed,
  });
  final String label;
  final String? value, placeholder, description, error;
  final IconName icon;
  final bool open, disabled;
  final VoidCallback onPressed;
  @override
  Widget build(BuildContext context) {
    final t = AcmeTheme.of(context), c = t.colors;
    return FieldFrame(
      label: label,
      description: description,
      error: error,
      child: Semantics(
        label: label,
        value: value ?? placeholder,
        hint: error ?? description,
        expanded: open,
        enabled: !disabled,
        button: true,
        child: Pressable(
          onPressed: disabled ? null : onPressed,
          radius: BorderRadius.circular(RadiusTokens.md),
          builder: (_, _) => FieldBox(
            disabled: disabled,
            invalid: error != null,
            focused: open,
            child: ExcludeSemantics(
              child: Row(
                spacing: SpaceTokens.s2,
                children: [
                  Expanded(
                    child: Text(
                      value ?? placeholder ?? '',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: t.text(
                        TypographyTokens.body,
                        disabled
                            ? c.textDisabled
                            : value == null
                            ? c.fieldPlaceholder
                            : c.fieldText,
                      ),
                    ),
                  ),
                  Icon(icon, size: IconSize.sm, color: c.fieldPlaceholder),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ChoiceRow extends StatelessWidget {
  const _ChoiceRow({
    required this.label,
    this.description,
    this.icon,
    this.danger = false,
    this.selected = false,
    this.radio = false,
    required this.onPressed,
  });
  final String label;
  final String? description;
  final IconName? icon;
  final bool danger, selected, radio;
  final VoidCallback? onPressed;
  @override
  Widget build(BuildContext context) {
    final t = AcmeTheme.of(context), c = t.colors;
    final text = onPressed == null
        ? c.textDisabled
        : danger
        ? c.menuDangerText
        : c.menuText;
    return Semantics(
      container: true,
      excludeSemantics: true,
      label: label,
      hint: description,
      onTap: onPressed,
      role: radio ? SemanticsRole.menuItemRadio : SemanticsRole.menuItem,
      checked: radio ? selected : null,
      enabled: onPressed != null,
      selected: !radio && selected ? true : null,
      child: Pressable(
        onPressed: onPressed,
        builder: (pressed, hovered) => Container(
          constraints: BoxConstraints(minHeight: t.sizes.listRowCompact),
          padding: const EdgeInsets.symmetric(
            horizontal: SpaceTokens.s3,
            vertical: SpaceTokens.s2,
          ),
          decoration: BoxDecoration(
            color: pressed || hovered
                ? (danger
                      ? c.menuDangerBackgroundHover
                      : pressed
                      ? c.menuItemBackgroundPressed
                      : c.menuItemBackgroundHover)
                : null,
            borderRadius: BorderRadius.circular(RadiusTokens.md),
          ),
          child: Row(
            spacing: SpaceTokens.s3,
            children: [
              if (icon case final name?)
                Icon(name, color: danger ? text : c.menuIcon),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label, style: t.text(TypographyTokens.body, text)),
                    if (description case final desc?)
                      Text(
                        desc,
                        style: t.text(TypographyTokens.detail, c.textSecondary),
                      ),
                  ],
                ),
              ),
              if (selected)
                Icon(IconName.check, color: c.menuIcon, size: IconSize.sm),
            ],
          ),
        ),
      ),
    );
  }
}

class _Choices extends StatefulWidget {
  const _Choices({
    required this.label,
    required this.trigger,
    required this.rows,
    required this.defaultOpen,
    this.disabled = false,
    this.align = MenuAlign.start,
    this.matchWidth = false,
  });
  final String label;
  final bool defaultOpen, disabled, matchWidth;
  final MenuAlign align;
  final Widget Function(bool open, VoidCallback show) trigger;
  final List<Widget> Function(VoidCallback close) rows;
  @override
  State<_Choices> createState() => _ChoicesState();
}

class _ChoicesState extends State<_Choices> {
  final _controller = MenuController();
  bool _sheet = false;
  bool get _pointer =>
      identical(AcmeTheme.of(context).sizes, SizeTokens.pointer);
  @override
  void initState() {
    super.initState();
    if (widget.defaultOpen) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _show();
      });
    }
  }

  void _show() {
    if (widget.disabled) return;
    if (_pointer) {
      _controller.open();
    } else {
      setState(() => _sheet = true);
    }
  }

  void _close() {
    if (_controller.isOpen) _controller.close();
    if (_sheet) setState(() => _sheet = false);
  }

  Widget _items() => Semantics(
    container: true,
    role: SemanticsRole.menu,
    label: widget.label,
    explicitChildNodes: true,
    child: Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: widget.rows(_close),
    ),
  );
  @override
  Widget build(BuildContext context) {
    if (!_pointer) {
      return Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          widget.trigger(_sheet, _show),
          BottomSheet(
            open: _sheet && !widget.disabled,
            title: widget.label,
            onClose: _close,
            child: _items(),
          ),
        ],
      );
    }
    final c = AcmeTheme.of(context).colors;
    return RawMenuAnchor(
      controller: _controller,
      onOpen: () => setState(() {}),
      onClose: () => setState(() {}),
      builder: (_, controller, _) => widget.trigger(controller.isOpen, _show),
      overlayBuilder: (context, info) {
        final rect = info.anchorRect, screen = info.overlaySize;
        final width = math.min(
          screen.width,
          widget.matchWidth
              ? rect.width
              : math.max(rect.width, SpaceTokens.s16 * 3),
        );
        final left =
            ((widget.align == MenuAlign.start) ==
                        (Directionality.of(context) == TextDirection.ltr)
                    ? rect.left
                    : rect.right - width)
                .clamp(0.0, screen.width - width);
        final below = screen.height - rect.bottom - SpaceTokens.s1;
        final above = rect.top - SpaceTokens.s1;
        final up =
            below < AcmeTheme.of(context).sizes.listRow * 3 && above > below;
        return Positioned(
          left: left,
          width: width,
          top: up ? null : rect.bottom + SpaceTokens.s1,
          bottom: up ? screen.height - rect.top + SpaceTokens.s1 : null,
          child: TapRegion(
            groupId: info.tapRegionGroupId,
            child: CallbackShortcuts(
              bindings: {
                const SingleActivator(LogicalKeyboardKey.escape): _close,
              },
              child: Focus(
                autofocus: true,
                child: Container(
                  constraints: BoxConstraints(
                    maxHeight: math.max(0, up ? above : below),
                  ),
                  decoration: BoxDecoration(
                    color: c.menuBackground,
                    border: Border.all(color: c.menuBorder),
                    borderRadius: BorderRadius.circular(RadiusTokens.md),
                    boxShadow: [ShadowTokens.overlay.toBoxShadow()],
                  ),
                  padding: const EdgeInsets.all(SpaceTokens.s1),
                  child: SingleChildScrollView(child: _items()),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
