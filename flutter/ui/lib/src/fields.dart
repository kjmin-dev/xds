import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart' as w;

import 'button.dart';
import 'icon.dart';
import 'text.dart';
import 'theme.dart';
import 'tokens/tokens.g.dart';

class FieldFrame extends w.StatelessWidget {
  const FieldFrame({
    super.key,
    required this.label,
    required this.child,
    this.description,
    this.error,
    this.counter,
  });
  final String label;
  final String? description, error, counter;
  final w.Widget child;
  @override
  w.Widget build(w.BuildContext context) => w.Column(
    mainAxisSize: w.MainAxisSize.min,
    crossAxisAlignment: w.CrossAxisAlignment.stretch,
    spacing: SpaceTokens.s1,
    children: [
      Text(label, variant: TextVariant.label),
      child,
      if (error != null || description != null || counter != null)
        w.Row(
          crossAxisAlignment: w.CrossAxisAlignment.start,
          spacing: SpaceTokens.s2,
          children: [
            w.Expanded(
              child: error != null
                  ? w.Semantics(
                      liveRegion: true,
                      child: Text(
                        error!,
                        variant: TextVariant.footnote,
                        tone: TextTone.danger,
                      ),
                    )
                  : description != null
                  ? Text(
                      description!,
                      variant: TextVariant.footnote,
                      tone: TextTone.secondary,
                    )
                  : const w.SizedBox.shrink(),
            ),
            if (counter != null)
              Text(
                counter!,
                variant: TextVariant.footnote,
                tone: TextTone.secondary,
              ),
          ],
        ),
    ],
  );
}

class FieldBox extends w.StatelessWidget {
  const FieldBox({
    super.key,
    required this.child,
    this.focused = false,
    this.invalid = false,
    this.disabled = false,
    this.pill = false,
  });
  final w.Widget child;
  final bool focused, invalid, disabled, pill;
  @override
  w.Widget build(w.BuildContext context) {
    final theme = AcmeTheme.of(context), c = theme.colors;
    return w.Container(
      constraints: w.BoxConstraints(minHeight: theme.sizes.controlMd),
      padding: const w.EdgeInsets.symmetric(
        horizontal: SpaceTokens.s3,
        vertical: SpaceTokens.s1,
      ),
      alignment: w.AlignmentDirectional.centerStart,
      decoration: w.BoxDecoration(
        color: disabled ? c.backgroundDisabled : c.fieldBackground,
        borderRadius: w.BorderRadius.circular(
          pill ? RadiusTokens.full : RadiusTokens.md,
        ),
      ),
      foregroundDecoration: w.BoxDecoration(
        borderRadius: w.BorderRadius.circular(
          pill ? RadiusTokens.full : RadiusTokens.md,
        ),
        border: w.Border.all(
          color: invalid
              ? c.fieldBorderInvalid
              : focused
              ? c.fieldBorderFocus
              : disabled
              ? c.borderDefault
              : c.fieldBorder,
          width: focused || invalid
              ? BorderTokens.widthThick
              : BorderTokens.widthThin,
        ),
      ),
      child: w.DefaultTextStyle.merge(
        style: w.TextStyle(color: c.fieldPlaceholder),
        child: child,
      ),
    );
  }
}

class TextField extends w.StatelessWidget {
  const TextField({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
    this.description,
    this.error,
    this.placeholder,
    this.leading,
    this.trailing,
    this.multiline = false,
    this.rows = 3,
    this.maxLength,
    this.disabled = false,
    this.onSubmit,
  }) : assert(rows > 0),
       assert(maxLength == null || maxLength > 0);
  final String label, value;
  final w.ValueChanged<String> onChanged;
  final w.ValueChanged<String>? onSubmit;
  final String? description, error, placeholder;
  final w.Widget? leading, trailing;
  final bool multiline, disabled;
  final int rows;
  final int? maxLength;
  @override
  w.Widget build(w.BuildContext context) => FieldFrame(
    label: label,
    description: description,
    error: error,
    counter: maxLength == null ? null : '${value.characters.length}/$maxLength',
    child: _Input(
      label: label,
      value: value,
      onChanged: onChanged,
      onSubmit: onSubmit,
      placeholder: placeholder,
      leading: leading,
      trailing: trailing,
      rows: multiline ? rows : 1,
      maxLength: maxLength,
      disabled: disabled,
      error: error,
      description: description,
    ),
  );
}

class SearchField extends w.StatelessWidget {
  const SearchField({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
    this.placeholder,
    this.onSubmit,
    this.clearLabel = 'Clear search',
    this.disabled = false,
  });
  final String value, label, clearLabel;
  final String? placeholder;
  final w.ValueChanged<String> onChanged;
  final w.ValueChanged<String>? onSubmit;
  final bool disabled;
  @override
  w.Widget build(w.BuildContext context) => _Input(
    label: label,
    value: value,
    onChanged: onChanged,
    onSubmit: onSubmit,
    placeholder: placeholder,
    disabled: disabled,
    search: true,
    rows: 1,
    leading: const Icon(IconName.search, size: IconSize.sm),
    trailing: value.isEmpty || disabled
        ? null
        : IconButton(
            icon: IconName.x,
            label: clearLabel,
            size: ControlSize.sm,
            onPressed: () => onChanged(''),
          ),
  );
}

class _Input extends w.StatefulWidget {
  const _Input({
    required this.value,
    required this.label,
    required this.onChanged,
    required this.rows,
    required this.disabled,
    this.search = false,
    this.onSubmit,
    this.error,
    this.description,
    this.placeholder,
    this.leading,
    this.trailing,
    this.maxLength,
  });
  final String value, label;
  final w.ValueChanged<String> onChanged;
  final w.ValueChanged<String>? onSubmit;
  final String? placeholder, error, description;
  final bool search, disabled;
  final w.Widget? leading, trailing;
  final int rows;
  final int? maxLength;
  @override
  w.State<_Input> createState() => _InputState();
}

class _InputState extends w.State<_Input>
    implements w.TextSelectionGestureDetectorBuilderDelegate {
  late final controller = w.TextEditingController(text: widget.value);
  late final focus = w.FocusNode(canRequestFocus: !widget.disabled)
    ..addListener(_focusChanged);
  @override
  final editableTextKey = w.GlobalKey<w.EditableTextState>();
  late final gestures = w.TextSelectionGestureDetectorBuilder(delegate: this);
  @override
  bool get forcePressEnabled => false;
  @override
  bool get selectionEnabled => !widget.disabled;
  void _focusChanged() => setState(() {});

  void _reconcile() {
    if (controller.text == widget.value) return;
    final selection = controller.selection;
    // Preserve the IME composing range during acknowledgements and keep both selection ends
    // inside the accepted text when the caller transforms or rejects an edit.
    controller.value = w.TextEditingValue(
      text: widget.value,
      selection: selection.isValid
          ? w.TextSelection(
              baseOffset: selection.baseOffset.clamp(0, widget.value.length),
              extentOffset: selection.extentOffset.clamp(
                0,
                widget.value.length,
              ),
            )
          : w.TextSelection.collapsed(offset: widget.value.length),
    );
  }

  @override
  void didUpdateWidget(_Input old) {
    super.didUpdateWidget(old);
    focus.canRequestFocus = !widget.disabled;
    _reconcile();
  }

  @override
  void dispose() {
    focus.removeListener(_focusChanged);
    focus.dispose();
    controller.dispose();
    super.dispose();
  }

  @override
  w.Widget build(w.BuildContext context) {
    final theme = AcmeTheme.of(context), c = theme.colors;
    final role = theme.text(
      TypographyTokens.body,
      widget.disabled ? c.textDisabled : c.fieldText,
    );
    final field = w.Semantics(
      label: widget.label,
      hint: widget.error ?? widget.description,
      enabled: !widget.disabled,
      child: w.Stack(
        alignment: w.AlignmentDirectional.centerStart,
        children: [
          if (widget.value.isEmpty && widget.placeholder != null)
            w.ExcludeSemantics(
              child: w.Text(
                widget.placeholder!,
                style: role.copyWith(color: c.fieldPlaceholder),
              ),
            ),
          w.EditableText(
            key: editableTextKey,
            controller: controller,
            focusNode: focus,
            style: role,
            cursorColor: c.fieldBorderFocus,
            backgroundCursorColor: c.fieldBorder,
            selectionColor: c.accentSubtle,
            readOnly: widget.disabled,
            rendererIgnoresPointer: true,
            showSelectionHandles: true,
            selectionControls: _handles,
            contextMenuBuilder: (ctx, state) => _editMenu(ctx, state, theme),
            minLines: widget.rows,
            maxLines: widget.rows,
            keyboardType: widget.rows > 1
                ? TextInputType.multiline
                : TextInputType.text,
            textInputAction: widget.search
                ? TextInputAction.search
                : widget.rows > 1
                ? TextInputAction.newline
                : TextInputAction.done,
            inputFormatters: [
              if (widget.maxLength case final max?)
                LengthLimitingTextInputFormatter(max),
            ],
            onChanged: (text) {
              widget.onChanged(text);
              // An owner can keep the old value without rebuilding the parent.
              w.WidgetsBinding.instance.addPostFrameCallback((_) {
                if (mounted) _reconcile();
              });
            },
            onSubmitted: widget.onSubmit,
          ),
        ],
      ),
    );
    return FieldBox(
      invalid: widget.error != null,
      disabled: widget.disabled,
      focused: focus.hasFocus,
      pill: widget.search,
      child: w.Row(
        spacing: SpaceTokens.s2,
        children: [
          ?widget.leading,
          w.Expanded(
            child: widget.disabled
                ? w.IgnorePointer(child: field)
                : gestures.buildGestureDetector(
                    behavior: w.HitTestBehavior.opaque,
                    child: field,
                  ),
          ),
          ?widget.trailing,
        ],
      ),
    );
  }
}

final _handles = _SelectionHandles();

class _SelectionHandles extends w.TextSelectionControls
    with w.TextSelectionHandleControls {
  @override
  w.Size getHandleSize(double textLineHeight) =>
      const w.Size.square(SpaceTokens.s3);
  @override
  w.Offset getHandleAnchor(
    w.TextSelectionHandleType type,
    double textLineHeight,
  ) => w.Offset(
    type == w.TextSelectionHandleType.left
        ? SpaceTokens.s3
        : type == w.TextSelectionHandleType.right
        ? 0
        : SpaceTokens.s1_5,
    0,
  );
  @override
  w.Widget buildHandle(
    w.BuildContext context,
    w.TextSelectionHandleType type,
    double textLineHeight, [
    w.VoidCallback? onTap,
  ]) {
    final color = w.DefaultSelectionStyle.of(context).cursorColor;
    final radius = w.Radius.circular(SpaceTokens.s3);
    return w.GestureDetector(
      onTap: onTap,
      child: w.DecoratedBox(
        decoration: w.BoxDecoration(
          color: color,
          borderRadius: w.BorderRadius.only(
            topLeft: type == w.TextSelectionHandleType.right
                ? w.Radius.zero
                : radius,
            topRight: type == w.TextSelectionHandleType.left
                ? w.Radius.zero
                : radius,
            bottomLeft: radius,
            bottomRight: radius,
          ),
        ),
        child: const w.SizedBox.square(dimension: SpaceTokens.s3),
      ),
    );
  }
}

w.Widget _editMenu(
  w.BuildContext context,
  w.EditableTextState state,
  AcmeThemeData theme,
) {
  if (w.SystemContextMenu.isSupportedByField(state)) {
    return w.SystemContextMenu.editableText(editableTextState: state);
  }
  final labels = w.WidgetsLocalizations.of(context);
  final anchors = state.contextMenuAnchors;
  final items = state.contextMenuButtonItems;
  return w.CustomSingleChildLayout(
    delegate: w.TextSelectionToolbarLayoutDelegate(
      anchorAbove: anchors.primaryAnchor,
      anchorBelow: anchors.secondaryAnchor ?? anchors.primaryAnchor,
    ),
    child: w.DecoratedBox(
      decoration: w.BoxDecoration(
        color: theme.colors.menuBackground,
        borderRadius: w.BorderRadius.circular(RadiusTokens.md),
        boxShadow: [ShadowTokens.overlay.toBoxShadow()],
      ),
      child: w.Padding(
        padding: const w.EdgeInsets.all(SpaceTokens.s1),
        child: w.Wrap(
          children: [
            for (final item in items)
              if ((item.label ??
                      switch (item.kind) {
                        w.ContextMenuButtonKind.copy => labels.copyButtonLabel,
                        w.ContextMenuButtonKind.cut => labels.cutButtonLabel,
                        w.ContextMenuButtonKind.paste =>
                          labels.pasteButtonLabel,
                        w.ContextMenuButtonKind.selectAll =>
                          labels.selectAllButtonLabel,
                        _ => null,
                      })
                  case final label?)
                w.Semantics(
                  button: true,
                  child: w.GestureDetector(
                    onTap: item.onPressed,
                    child: w.Padding(
                      padding: const w.EdgeInsets.all(SpaceTokens.s2),
                      child: w.Text(
                        label,
                        style: theme.text(
                          TypographyTokens.label,
                          theme.colors.menuText,
                        ),
                      ),
                    ),
                  ),
                ),
          ],
        ),
      ),
    ),
  );
}
