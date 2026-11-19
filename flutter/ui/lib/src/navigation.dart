import 'dart:ui' show SemanticsRole;

import 'package:flutter/widgets.dart' hide Icon;

import 'glass.dart';
import 'icon.dart';
import 'pressable.dart';
import 'theme.dart';
import 'tokens/tokens.g.dart';

class TopBar extends StatelessWidget {
  const TopBar({
    super.key,
    required this.title,
    this.onBack,
    this.backLabel = 'Back',
    this.trailing,
    this.surface = Surface.solid,
  });
  final String title, backLabel;
  final VoidCallback? onBack;
  final Widget? trailing;
  final Surface surface;
  @override
  Widget build(BuildContext context) {
    final t = AcmeTheme.of(context), c = t.colors, s = t.sizes;
    final bar = SizedBox(
      height: s.bar,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: SpaceTokens.s4),
        child: Row(
          spacing: SpaceTokens.s3,
          children: [
            if (onBack != null)
              Semantics(
                button: true,
                label: backLabel,
                child: Pressable(
                  onPressed: onBack,
                  radius: BorderRadius.circular(RadiusTokens.full),
                  builder: (_, _) => Center(
                    child: Container(
                      width: s.controlSm,
                      height: s.controlSm,
                      decoration: BoxDecoration(
                        color: c.topBarActionBackground,
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Icon(
                          IconName.chevronLeft,
                          color: c.topBarAction,
                          directional: true,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            Expanded(
              child: Semantics(
                header: true,
                child: Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: t.text(
                    TypographyTokens.heading,
                    surface == Surface.glass ? c.glassForeground : c.topBarText,
                  ),
                ),
              ),
            ),
            ?trailing,
          ],
        ),
      ),
    );
    return surface == Surface.glass
        ? GlassPanel(radius: BorderRadius.zero, child: bar)
        : ColoredBox(color: c.topBarBackground, child: bar);
  }
}

class TabBarItem<T> {
  const TabBarItem({
    required this.value,
    required this.label,
    required this.icon,
  });
  final T value;
  final String label;
  final IconName icon;
}

class TabBar<T> extends StatelessWidget {
  const TabBar({
    super.key,
    required this.items,
    required this.value,
    required this.onChanged,
    this.surface = Surface.solid,
  });
  final List<TabBarItem<T>> items;
  final T value;
  final ValueChanged<T> onChanged;
  final Surface surface;
  @override
  Widget build(BuildContext context) {
    final t = AcmeTheme.of(context), c = t.colors;
    final radius = BorderRadius.circular(RadiusTokens.full);
    final bar = SizedBox(
      height: t.sizes.bar + SpaceTokens.s1 * 2,
      child: Padding(
        padding: const EdgeInsets.all(SpaceTokens.s1),
        child: Row(
          children: [
            for (final item in items)
              Expanded(
                child: Builder(
                  builder: (context) {
                    final selected = item.value == value;
                    final color = selected
                        ? c.tabBarTextSelected
                        : surface == Surface.glass
                        ? c.glassForeground
                        : c.tabBarText;
                    return Semantics(
                      container: true,
                      excludeSemantics: true,
                      role: SemanticsRole.tab,
                      onTap: () => onChanged(item.value),
                      selected: selected,
                      label: item.label,
                      child: Pressable(
                        onPressed: () => onChanged(item.value),
                        radius: radius,
                        builder: (_, _) => DecoratedBox(
                          decoration: BoxDecoration(
                            color: selected ? c.tabBarSelectedBackground : null,
                            borderRadius: radius,
                          ),
                          child: Center(
                            child: ExcludeSemantics(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    item.icon,
                                    color: color,
                                    size: IconSize.lg,
                                  ),
                                  const SizedBox(height: SpaceTokens.s0_5),
                                  Text(
                                    item.label,
                                    style: t.text(
                                      TypographyTokens.footnote,
                                      color,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
    return Semantics(
      container: true,
      role: items.isEmpty ? null : SemanticsRole.tabBar,
      explicitChildNodes: true,
      child: surface == Surface.glass
          ? GlassPanel(radius: radius, child: bar)
          : DecoratedBox(
              decoration: BoxDecoration(
                color: c.tabBarBackground,
                borderRadius: radius,
                border: Border.all(
                  color: c.tabBarBorder,
                  width: BorderTokens.widthThin,
                ),
                boxShadow: [ShadowTokens.raised.toBoxShadow()],
              ),
              child: bar,
            ),
    );
  }
}
