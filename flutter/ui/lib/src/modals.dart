import 'dart:ui' show SemanticsRole;
import 'dart:async';

import 'package:flutter/widgets.dart';

import 'glass.dart';
import 'pressable.dart';
import 'theme.dart';
import 'tokens/tokens.g.dart';

class _PanelRoute extends PopupRoute<void> {
  _PanelRoute({
    required this.content,
    required this.dismissible,
    required this.scrim,
    required this.label,
    required this.duration,
    required this.sheet,
  });
  Widget content;
  bool dismissible;
  Color scrim;
  String label;
  final Duration duration;
  final bool sheet;
  @override
  Color get barrierColor => scrim;
  @override
  bool get barrierDismissible => dismissible;
  @override
  String get barrierLabel => label;
  @override
  Duration get transitionDuration => duration;
  @override
  Widget buildPage(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
  ) => PopScope(canPop: dismissible, child: content);
  @override
  Widget buildTransitions(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    final curve = animation.drive(CurveTween(curve: MotionTokens.easingEnter));
    if (sheet) {
      return SlideTransition(
        position: curve.drive(
          Tween(begin: const Offset(0, 1), end: Offset.zero),
        ),
        child: child,
      );
    }
    return FadeTransition(
      opacity: curve,
      child: ScaleTransition(
        scale: curve.drive(Tween(begin: MotionTokens.pressScale, end: 1.0)),
        child: child,
      ),
    );
  }

  void update(Widget body, bool allow, Color color, String name) {
    content = body;
    dismissible = allow;
    scrim = color;
    label = name;
    changedExternalState();
  }
}

/// Synchronizes the declarative open flag to the route that owns focus, the barrier and Back.
class _Modal extends StatefulWidget {
  const _Modal({
    required this.open,
    required this.onClose,
    required this.child,
    required this.sheet,
    this.dismissible = true,
    this.glass = false,
    this.closeLabel = 'Close',
  });
  final bool open, dismissible, sheet, glass;
  final VoidCallback onClose;
  final String closeLabel;
  final Widget child;
  @override
  State<_Modal> createState() => _ModalState();
}

class _ModalState extends State<_Modal> {
  _PanelRoute? _route;
  bool _dismissed = false;
  @override
  void didUpdateWidget(_Modal old) {
    super.didUpdateWidget(old);
    if (!old.open && widget.open) _dismissed = false;
  }

  static void _remove(_PanelRoute route) {
    final nav = route.navigator;
    if (nav == null || !route.isActive) return;
    if (route.isCurrent) {
      nav.pop();
    } else {
      nav.removeRoute(route);
    }
  }

  @override
  void dispose() {
    final route = _route;
    _route = null;
    if (route != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _remove(route));
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = AcmeTheme.of(context),
        preview = GlassPreviewOverride.of(context);
    Widget body = widget.child;
    if (preview != null) {
      body = GlassPreviewOverride(blur: preview, child: body);
    }
    final testSettings = GlassTestSettings.of(context);
    if (testSettings != null) {
      body = GlassTestSettings(allowed: testSettings, child: body);
    }
    final owner = ModalRoute.of(context);
    // All panels share the native power and accessibility signal. Reserve the layer before
    // pushing so that enabling blur while a sheet is up cannot double-filter a frame.
    final covers =
        widget.glass &&
        preview != false &&
        testSettings != false &&
        !MediaQuery.highContrastOf(context);
    final content = AcmeTheme(
      brightness: theme.brightness,
      fontFamily: theme.fontFamily,
      sizes: theme.sizes,
      child: body,
    );
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      var route = _route;
      if (!widget.open) {
        if (route != null) {
          _route = null;
          _remove(route);
        }
      } else if (route != null) {
        if (route.navigator case final navigator?) {
          GlassSheetLayers.forNavigator(navigator)
              .setSheet(route, owner, covers);
        }
        route.update(
          content,
          widget.dismissible,
          theme.colors.scrim,
          widget.closeLabel,
        );
      } else if (!_dismissed) {
        route = _PanelRoute(
          content: content,
          dismissible: widget.dismissible,
          scrim: theme.colors.scrim,
          label: widget.closeLabel,
          duration: theme.reducedMotion
              ? Duration.zero
              : widget.sheet
              ? MotionTokens.durationSlow
              : MotionTokens.durationNormal,
          sheet: widget.sheet,
        );
        _route = route;
        final presented = route;
        final navigator = Navigator.of(context);
        final layers = GlassSheetLayers.forNavigator(navigator);
        layers.setSheet(presented, owner, covers);
        presented.completed.then(
          (_) => layers.setSheet(presented, owner, false),
        );
        navigator.push(presented).then((_) {
          if (!mounted || _route != route) return;
          _route = null;
          _dismissed = true;
          widget.onClose();
        });
      }
    });
    return const SizedBox.shrink();
  }
}

class BottomSheet extends StatelessWidget {
  const BottomSheet({
    super.key,
    required this.open,
    required this.onClose,
    this.title,
    this.closeLabel = 'Close',
    required this.child,
    this.surface = Surface.solid,
    this.tall = false,
  });
  final bool open, tall;
  final String? title;
  final String closeLabel;
  final VoidCallback onClose;
  final Surface surface;
  final Widget child;
  @override
  Widget build(BuildContext context) => _Modal(
    open: open,
    onClose: onClose,
    sheet: true,
    glass: surface == Surface.glass,
    closeLabel: closeLabel,
    child: _SheetBody(title: title, surface: surface, tall: tall, child: child),
  );
}

class _SheetBody extends StatefulWidget {
  const _SheetBody({
    this.title,
    required this.child,
    required this.surface,
    required this.tall,
  });
  final String? title;
  final Widget child;
  final Surface surface;
  final bool tall;
  @override
  State<_SheetBody> createState() => _SheetBodyState();
}

class _SheetBodyState extends State<_SheetBody> {
  final _panel = GlobalKey();
  double _drag = 0;
  bool _tracking = false;
  double get _height => _panel.currentContext?.size?.height ?? 1;
  void _move(double delta) {
    final next = (_drag + delta).clamp(0.0, _height);
    if (next != _drag) {
      setState(() {
        _tracking = true;
        _drag = next;
      });
    }
  }

  void _settle([double velocity = 0]) {
    if (_drag == 0) return;
    if (_drag > _height / 4 || velocity > 1000) {
      Navigator.of(context).pop();
      return;
    }
    setState(() {
      _tracking = false;
      _drag = 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    final t = AcmeTheme.of(context),
        c = t.colors,
        radius = BorderRadius.circular(RadiusTokens.xl);
    final body = Column(
      mainAxisSize: widget.tall ? MainAxisSize.max : MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Center(
          child: Container(
            margin: const EdgeInsets.only(
              top: SpaceTokens.s2,
              bottom: SpaceTokens.s3,
            ),
            width: SpaceTokens.s8 + SpaceTokens.s1,
            height: SpaceTokens.s1,
            decoration: BoxDecoration(
              color: c.sheetHandle,
              borderRadius: BorderRadius.circular(RadiusTokens.full),
            ),
          ),
        ),
        if (widget.title case final title?)
          Padding(
            padding: const EdgeInsets.fromLTRB(
              SpaceTokens.s4,
              SpaceTokens.s1,
              SpaceTokens.s4,
              SpaceTokens.s3,
            ),
            child: Semantics(
              header: true,
              namesRoute: true,
              child: Text(
                title,
                style: t.text(TypographyTokens.heading, c.textPrimary),
              ),
            ),
          ),
        Flexible(
          fit: widget.tall ? FlexFit.tight : FlexFit.loose,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(
              SpaceTokens.s4,
              0,
              SpaceTokens.s4,
              SpaceTokens.s4,
            ),
            child: widget.tall
                ? widget.child
                : SingleChildScrollView(
                    physics: const ClampingScrollPhysics(),
                    child: widget.child,
                  ),
          ),
        ),
      ],
    );
    final panel = widget.surface == Surface.glass
        ? GlassPanel(radius: radius, sheet: true, child: body)
        : DecoratedBox(
            decoration: BoxDecoration(
              color: c.sheetBackground,
              borderRadius: radius,
              boxShadow: [ShadowTokens.overlay.toBoxShadow()],
            ),
            child: body,
          );
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          SpaceTokens.s2,
          SpaceTokens.s2,
          SpaceTokens.s2,
          MediaQuery.viewInsetsOf(context).bottom + SpaceTokens.s2,
        ),
        child: Align(
          alignment: Alignment.bottomCenter,
          child: FractionallySizedBox(
            widthFactor: 1,
            heightFactor: widget.tall ? 0.9 : null,
            child: TweenAnimationBuilder<double>(
              tween: Tween(end: _drag),
              duration: _tracking || t.reducedMotion
                  ? Duration.zero
                  : MotionTokens.durationFast,
              builder: (_, dy, child) =>
                  Transform.translate(offset: Offset(0, dy), child: child),
              child: Semantics(
                scopesRoute: true,
                explicitChildNodes: true,
                onDismiss: () => Navigator.of(context).pop(),
                child: NotificationListener<ScrollNotification>(
                  onNotification: (notice) {
                    if (notice is OverscrollNotification &&
                        notice.dragDetails != null &&
                        notice.metrics.axis == Axis.vertical &&
                        notice.overscroll < 0) {
                      _move(-notice.overscroll);
                    }
                    if (notice is ScrollEndNotification) {
                      _settle(notice.dragDetails?.primaryVelocity ?? 0);
                    }
                    return false;
                  },
                  child: GestureDetector(
                    key: _panel,
                    // The sheet already exposes a semantic dismiss action. A second gesture
                    // node here would absorb the names and actions of the controls it wraps.
                    excludeFromSemantics: true,
                    behavior: HitTestBehavior.opaque,
                    onVerticalDragUpdate: (d) => _move(d.primaryDelta ?? 0),
                    onVerticalDragEnd: (d) => _settle(d.primaryVelocity ?? 0),
                    onVerticalDragCancel: _settle,
                    child: panel,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class Dialog extends StatelessWidget {
  const Dialog({
    super.key,
    required this.open,
    required this.title,
    required this.onClose,
    this.description,
    this.child,
    this.actions = const [],
    this.dismissible = true,
  });
  final bool open, dismissible;
  final String title;
  final String? description;
  final Widget? child;
  final List<Widget> actions;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    final t = AcmeTheme.of(context), c = t.colors;
    return _Modal(
      open: open,
      onClose: onClose,
      sheet: false,
      dismissible: dismissible,
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(SpaceTokens.s4),
          child: Center(
            child: ConstrainedBox(
              constraints: BoxConstraints(maxWidth: t.sizes.dialog),
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: c.dialogBackground,
                  borderRadius: BorderRadius.circular(RadiusTokens.xl),
                  border: Border.all(
                    color: c.dialogBorder,
                    width: BorderTokens.widthThin,
                  ),
                  boxShadow: [ShadowTokens.overlay.toBoxShadow()],
                ),
                child: Semantics(
                  scopesRoute: true,
                  explicitChildNodes: true,
                  role: SemanticsRole.dialog,
                  child: Padding(
                    padding: const EdgeInsets.all(SpaceTokens.s6),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      spacing: SpaceTokens.s4,
                      children: [
                        Semantics(
                          namesRoute: true,
                          header: true,
                          child: Text(
                            title,
                            style: t.text(
                              TypographyTokens.title,
                              c.dialogTitle,
                            ),
                          ),
                        ),
                        if (description != null || child != null)
                          Flexible(
                            child: SingleChildScrollView(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                spacing: SpaceTokens.s3,
                                children: [
                                  if (description case final text?)
                                    Text(
                                      text,
                                      style: t.text(
                                        TypographyTokens.body,
                                        c.dialogText,
                                      ),
                                    ),
                                  ?child,
                                ],
                              ),
                            ),
                          ),
                        if (actions.isNotEmpty)
                          Wrap(
                            alignment: WrapAlignment.end,
                            spacing: SpaceTokens.s2,
                            runSpacing: SpaceTokens.s2,
                            children: actions,
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class ToastAction {
  const ToastAction({required this.label, required this.onPressed});
  final String label;
  final VoidCallback onPressed;
}

class Toast extends StatefulWidget {
  const Toast({
    super.key,
    required this.open,
    required this.message,
    required this.onClose,
    this.action,
    this.duration = MotionTokens.durationToast,
  });
  final bool open;
  final String message;
  final VoidCallback onClose;
  final ToastAction? action;
  final Duration duration;
  @override
  State<Toast> createState() => _ToastState();
}

class _ToastState extends State<Toast> with SingleTickerProviderStateMixin {
  final _overlay = OverlayPortalController();
  late final _animation = AnimationController(vsync: this);
  Timer? _timer;
  Duration? _motion;
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final motion = AcmeTheme.of(context).reducedMotion
        ? Duration.zero
        : MotionTokens.durationNormal;
    if (_motion != motion) {
      _motion = motion;
      _animation.duration = motion;
      _schedule();
    }
  }

  @override
  void didUpdateWidget(Toast old) {
    super.didUpdateWidget(old);
    if (widget.open != old.open ||
        widget.message != old.message ||
        widget.duration != old.duration) {
      _schedule();
    }
  }

  void _schedule() {
    _timer?.cancel();
    if (widget.open && widget.duration > Duration.zero) {
      _timer = Timer(widget.duration, () => widget.onClose());
    }
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!mounted) return;
      if (widget.open) {
        _overlay.show();
        _animation.forward();
      } else if (_overlay.isShowing) {
        try {
          await _animation.reverse().orCancel;
          if (mounted && !widget.open) _overlay.hide();
        } on TickerCanceled {
          // A newly opened toast supersedes the exit animation.
        }
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _animation.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = AcmeTheme.of(context), c = t.colors;
    final body = Semantics(
      liveRegion: true,
      container: true,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: c.toastBackground,
          borderRadius: BorderRadius.circular(RadiusTokens.lg),
          boxShadow: [ShadowTokens.raised.toBoxShadow()],
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: SpaceTokens.s4,
            vertical: SpaceTokens.s3,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            spacing: SpaceTokens.s3,
            children: [
              Flexible(
                child: Text(
                  widget.message,
                  style: t.text(TypographyTokens.detail, c.toastText),
                ),
              ),
              if (widget.action case final action?)
                Semantics(
                  button: true,
                  child: Pressable(
                    onPressed: () {
                      action.onPressed();
                      widget.onClose();
                    },
                    builder: (_, _) => Center(
                      child: Text(
                        action.label,
                        style: t.text(TypographyTokens.label, c.toastAction),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
    return OverlayPortal(
      controller: _overlay,
      overlayChildBuilder: (_) => SafeArea(
        child: Align(
          alignment: Alignment.bottomCenter,
          child: Padding(
            padding: const EdgeInsets.all(SpaceTokens.s4),
            child: ConstrainedBox(
              constraints: BoxConstraints(maxWidth: t.sizes.toast),
              child: AnimatedBuilder(
                animation: _animation,
                child: body,
                builder: (_, child) {
                  final progress = MotionTokens.easingEnter.transform(
                    _animation.value,
                  );
                  return Opacity(
                    opacity: progress,
                    child: Transform.translate(
                      offset: Offset(0, (1 - progress) * SpaceTokens.s4),
                      child: child,
                    ),
                  );
                },
              ),
            ),
          ),
        ),
      ),
      child: const SizedBox.shrink(),
    );
  }
}
