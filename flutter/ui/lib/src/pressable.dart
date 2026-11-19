import 'package:flutter/widgets.dart';

import 'theme.dart';
import 'tokens/tokens.g.dart';

/// Keeps keyboard and touch activation, focus and hover feedback in step across controls.
class Pressable extends StatefulWidget {
  const Pressable({
    super.key,
    required this.onPressed,
    required this.builder,
    this.focusNode,
    this.radius,
    this.minTarget = true,
  });

  final VoidCallback? onPressed;
  final Widget Function(bool pressed, bool hovered) builder;
  final FocusNode? focusNode;
  final BorderRadius? radius;
  final bool minTarget;

  @override
  State<Pressable> createState() => _PressableState();
}

class _PressableState extends State<Pressable> {
  bool pressed = false, hovered = false, focused = false;

  @override
  Widget build(BuildContext context) {
    final theme = AcmeTheme.of(context);
    final enabled = widget.onPressed != null;
    final body = DecoratedBox(
      position: DecorationPosition.foreground,
      decoration: BoxDecoration(
        borderRadius: widget.radius,
        border: enabled && focused
            ? Border.all(
                color: theme.colors.borderFocus,
                width: FocusTokens.width,
                strokeAlign: BorderSide.strokeAlignOutside,
              )
            : null,
      ),
      child: widget.builder(enabled && pressed, enabled && hovered),
    );
    return FocusableActionDetector(
      enabled: enabled,
      focusNode: widget.focusNode,
      mouseCursor: enabled
          ? SystemMouseCursors.click
          : SystemMouseCursors.basic,
      onShowFocusHighlight: (value) => setState(() => focused = value),
      onShowHoverHighlight: (value) => setState(() => hovered = value),
      actions: {
        ActivateIntent: CallbackAction<ActivateIntent>(
          onInvoke: (_) {
            widget.onPressed?.call();
            return null;
          },
        ),
      },
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: widget.onPressed,
        onTapDown: enabled ? (_) => setState(() => pressed = true) : null,
        onTapUp: enabled ? (_) => setState(() => pressed = false) : null,
        onTapCancel: enabled ? () => setState(() => pressed = false) : null,
        child: widget.minTarget
            ? ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: theme.sizes.targetMin,
                  minWidth: theme.sizes.targetMin,
                ),
                child: Align(
                  alignment: AlignmentDirectional.centerStart,
                  widthFactor: 1,
                  heightFactor: 1,
                  child: body,
                ),
              )
            : body,
      ),
    );
  }
}
