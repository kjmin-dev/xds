import 'package:flutter/widgets.dart' as w;

import 'icon.dart';
import 'pressable.dart';
import 'text.dart';
import 'theme.dart';
import 'tokens/tokens.g.dart';

class SectionHeader extends w.StatelessWidget {
  const SectionHeader({
    super.key,
    required this.title,
    this.description,
    this.icon,
    this.action,
    this.level = 2,
  });
  final String title;
  final String? description;
  final IconName? icon;
  final w.Widget? action;
  final int level;
  @override
  w.Widget build(w.BuildContext context) => w.Column(
    mainAxisSize: w.MainAxisSize.min,
    crossAxisAlignment: w.CrossAxisAlignment.start,
    spacing: SpaceTokens.s1,
    children: [
      w.Row(
        spacing: SpaceTokens.s2,
        children: [
          if (icon case final icon?) Icon(icon),
          w.Expanded(
            child: Text(title, variant: TextVariant.heading, level: level),
          ),
          ?action,
        ],
      ),
      if (description case final description?)
        Text(
          description,
          variant: TextVariant.detail,
          tone: TextTone.secondary,
        ),
    ],
  );
}

class EmptyState extends w.StatelessWidget {
  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.description,
    this.action,
  });
  final IconName icon;
  final String title;
  final String? description;
  final w.Widget? action;
  @override
  w.Widget build(w.BuildContext context) => w.Center(
    child: w.Padding(
      padding: const w.EdgeInsets.all(SpaceTokens.s6),
      child: w.Column(
        mainAxisSize: w.MainAxisSize.min,
        spacing: SpaceTokens.s2,
        children: [
          Icon(
            icon,
            size: IconSize.xl,
            color: AcmeTheme.of(context).colors.emptyStateIcon,
          ),
          Text(title, variant: TextVariant.heading, align: w.TextAlign.center),
          if (description case final description?)
            Text(
              description,
              tone: TextTone.secondary,
              align: w.TextAlign.center,
            ),
          ?action,
        ],
      ),
    ),
  );
}

class AccordionItem<T> {
  const AccordionItem(
    this.value,
    this.title, {
    required this.content,
    this.description,
  });
  final T value;
  final String title;
  final String? description;
  final w.Widget content;
}

class Accordion<T> extends w.StatelessWidget {
  const Accordion({
    super.key,
    required this.items,
    required this.expanded,
    required this.onChanged,
    this.multiple = false,
  });
  final List<AccordionItem<T>> items;
  final Set<T> expanded;
  final w.ValueChanged<Set<T>> onChanged;
  final bool multiple;
  @override
  w.Widget build(w.BuildContext context) {
    final theme = AcmeTheme.of(context), c = theme.colors;
    final duration = theme.reducedMotion
        ? Duration.zero
        : MotionTokens.durationNormal;
    final line = w.Container(
      height: BorderTokens.widthThin,
      color: c.accordionBorder,
    );
    return w.Column(
      mainAxisSize: w.MainAxisSize.min,
      crossAxisAlignment: w.CrossAxisAlignment.stretch,
      children: [
        line,
        for (final item in items) ...[
          w.Semantics(
            button: true,
            expanded: expanded.contains(item.value),
            child: Pressable(
              onPressed: () {
                final next = multiple ? Set<T>.of(expanded) : <T>{};
                if (expanded.contains(item.value)) {
                  next.remove(item.value);
                } else {
                  next.add(item.value);
                }
                onChanged(next);
              },
              minTarget: false,
              builder: (pressed, hover) => w.Container(
                constraints: w.BoxConstraints(minHeight: theme.sizes.targetMin),
                padding: const w.EdgeInsets.symmetric(
                  vertical: SpaceTokens.s3,
                  horizontal: SpaceTokens.s2,
                ),
                color: pressed
                    ? c.accordionHeaderBackgroundPressed
                    : hover
                    ? c.accordionHeaderBackgroundHover
                    : null,
                child: w.Row(
                  spacing: SpaceTokens.s2,
                  children: [
                    w.Expanded(
                      child: w.Column(
                        mainAxisSize: w.MainAxisSize.min,
                        crossAxisAlignment: w.CrossAxisAlignment.start,
                        children: [
                          Text(item.title, variant: TextVariant.bodyStrong),
                          if (item.description case final d?)
                            Text(
                              d,
                              variant: TextVariant.detail,
                              tone: TextTone.secondary,
                            ),
                        ],
                      ),
                    ),
                    w.AnimatedRotation(
                      turns: expanded.contains(item.value) ? 0.5 : 0,
                      duration: duration,
                      child: Icon(IconName.chevronDown, color: c.accordionIcon),
                    ),
                  ],
                ),
              ),
            ),
          ),
          w.AnimatedSize(
            duration: duration,
            alignment: w.Alignment.topCenter,
            child: expanded.contains(item.value)
                ? w.Padding(
                    padding: const w.EdgeInsets.all(SpaceTokens.s3),
                    child: w.DefaultTextStyle.merge(
                      style: w.TextStyle(color: c.textSecondary),
                      child: item.content,
                    ),
                  )
                : const w.SizedBox.shrink(),
          ),
          line,
        ],
      ],
    );
  }
}
