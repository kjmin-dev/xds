import 'acme_ui.dart';
import 'src/preview/glass_preview.dart';
import 'src/preview/specimen.dart';

/// Section keys and one-based indices match the React Native preview.
const previewSections = <(String, String, List<String>)>[
  ('colors', 'Colors', []),
  ('text', 'Typography', ['Text']),
  ('sizes', 'Space, radius, size', []),
  ('icons', 'Icons', ['Icon']),
  ('buttons', 'Buttons', ['Button', 'IconButton', 'Spinner']),
  ('fields', 'Text fields', ['TextField', 'SearchField']),
  ('selection', 'Selection', ['Switch', 'Checkbox', 'RadioGroup']),
  (
    'controls',
    'Controls',
    [
      'SegmentedControl',
      'Slider',
      'ProgressBar',
      'Select',
      'DatePicker',
      'DateRangePicker',
    ],
  ),
  ('chips', 'Chips', ['Chip', 'ChipBar']),
  ('tabs', 'Tabs', ['Tabs']),
  ('badges', 'Badges', ['Badge', 'CountBadge']),
  ('banners', 'Banners', ['Banner']),
  ('card', 'Card', ['Card', 'Divider']),
  ('media', 'Media', ['Thumbnail', 'MediaCard']),
  ('list', 'List', ['SectionHeader', 'Avatar', 'AvatarStack', 'ListRow']),
  ('navigation', 'Navigation', ['TopBar', 'TabBar', 'BottomSheet']),
  ('menu', 'Menu', ['Menu']),
  ('dialog', 'Dialog', ['Dialog']),
  ('toast', 'Toast', ['Toast']),
  ('skeleton', 'Skeleton', ['Skeleton']),
  ('empty', 'Empty state', ['EmptyState']),
  ('accordion', 'Accordion', ['Accordion']),
  ('glass', 'Glass', []),
];

const previewOverlays = <String, String>{
  'sheet': 'BottomSheet',
  'menu': 'Menu',
  'select': 'Select',
  'datepicker': 'DatePicker',
  'daterange': 'DateRangePicker',
  'dialog': 'Dialog',
  'toast': 'Toast',
};

class DesignPreview extends StatelessWidget {
  const DesignPreview({
    super.key,
    required this.location,
    required this.onBack,
    required this.onToggleTheme,
    this.scrolls = true,
  });

  /// Off-screen renderers lay out the complete catalog as a single page.
  final bool scrolls;
  final Uri location;
  final VoidCallback onBack, onToggleTheme;

  @override
  Widget build(BuildContext context) {
    final params = location.queryParameters;
    final open = previewOverlays.entries
        .where((e) => params[e.key] == '1')
        .firstOrNull
        ?.value;
    final first = () {
      final key = params['section'];
      if (key != null) {
        final index = previewSections.indexWhere(
          (section) => section.$1 == key,
        );
        if (index >= 0) return index;
      }
      final start = int.tryParse(params['from'] ?? '');
      if (start != null) {
        return (start - 1).clamp(0, previewSections.length - 1);
      }
      if (open != null) {
        return previewSections.indexWhere((s) => s.$3.contains(open));
      }
      return 0;
    }();
    final theme = AcmeTheme.of(context);
    final onlyGlass = first == previewSections.length - 1;
    Widget section(BuildContext context, int index) {
      final (key, title, components) = previewSections[first + index];
      return Padding(
        padding: const EdgeInsets.only(bottom: SpaceTokens.s8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: SpaceTokens.s3,
          children: [
            Text(title, variant: TextVariant.title, heading: true, level: 2),
            if (key == 'colors') const _Colors(),
            if (key == 'sizes') const _Sizes(),
            if (key == 'icons')
              Wrap(
                spacing: SpaceTokens.s3,
                runSpacing: SpaceTokens.s3,
                children: [
                  for (final icon in IconName.values)
                    Icon(icon, label: icon.name),
                ],
              ),
            for (final name in components)
              ComponentSpecimen(
                name,
                key: ValueKey(name),
                initiallyOpen: name == open,
              ),
            if (key == 'glass')
              const SizedBox(height: 440, child: GlassPreview()),
          ],
        ),
      );
    }

    Widget body = onlyGlass
        ? GlassPreview(
            tier: params['glass'],
            autoscroll: params.containsKey('autoscroll'),
            sheet: params['sheet'] == '1',
          )
        : !scrolls
        ? Padding(
            padding: const EdgeInsets.all(SpaceTokens.s4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                for (var i = 0; i < previewSections.length - first; i++)
                  section(context, i),
              ],
            ),
          )
        : ListView.builder(
            padding: const EdgeInsets.all(SpaceTokens.s4),
            itemCount: previewSections.length - first,
            itemBuilder: section,
          );
    return ColoredBox(
      color: theme.colors.backgroundBase,
      child: SafeArea(
        child: Column(
          mainAxisSize: scrolls ? MainAxisSize.max : MainAxisSize.min,
          children: [
            TopBar(
              title: 'Design system',
              onBack: onBack,
              trailing: IconButton(
                label: theme.brightness == Brightness.dark
                    ? 'Switch to light'
                    : 'Switch to dark',
                icon: IconName.sunMoon,
                variant: ButtonVariant.ghost,
                onPressed: onToggleTheme,
              ),
            ),
            if (scrolls) Expanded(child: body) else body,
          ],
        ),
      ),
    );
  }
}

class _Colors extends StatelessWidget {
  const _Colors();
  @override
  Widget build(BuildContext context) {
    final theme = AcmeTheme.of(context);
    const groups = {
      'background',
      'text',
      'border',
      'accent',
      'control',
      'danger',
      'status',
      'overlay',
      'glass',
    };
    return Wrap(
      spacing: SpaceTokens.s3,
      runSpacing: SpaceTokens.s3,
      children: [
        for (final (name, color) in theme.colors.entries)
          if (groups.contains(name.split('-').first))
            SizedBox(
              width: theme.sizes.avatarXl * 2,
              child: Row(
                spacing: SpaceTokens.s2,
                children: [
                  Container(
                    width: SpaceTokens.s6,
                    height: SpaceTokens.s6,
                    decoration: BoxDecoration(
                      color: color,
                      borderRadius: BorderRadius.circular(RadiusTokens.sm),
                      border: Border.all(color: theme.colors.borderDefault),
                    ),
                  ),
                  Expanded(child: Text(name, variant: TextVariant.footnote)),
                ],
              ),
            ),
      ],
    );
  }
}

class _Sizes extends StatelessWidget {
  const _Sizes();
  @override
  Widget build(BuildContext context) {
    final theme = AcmeTheme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      spacing: SpaceTokens.s3,
      children: [
        Wrap(
          spacing: SpaceTokens.s2,
          runSpacing: SpaceTokens.s2,
          children: [
            for (final size in [
              SpaceTokens.s1,
              SpaceTokens.s2,
              SpaceTokens.s3,
              SpaceTokens.s4,
              SpaceTokens.s6,
              SpaceTokens.s8,
              SpaceTokens.s12,
            ])
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    width: size,
                    height: SpaceTokens.s4,
                    child: ColoredBox(color: theme.colors.accentDefault),
                  ),
                  Text('${size.toInt()}', variant: TextVariant.footnote),
                ],
              ),
          ],
        ),
        Wrap(
          spacing: SpaceTokens.s2,
          children: [
            for (final radius in [
              RadiusTokens.sm,
              RadiusTokens.md,
              RadiusTokens.lg,
              RadiusTokens.xl,
              RadiusTokens.full,
            ])
              Container(
                width: SpaceTokens.s10,
                height: SpaceTokens.s10,
                decoration: BoxDecoration(
                  color: theme.colors.accentSubtle,
                  borderRadius: BorderRadius.circular(radius),
                ),
              ),
          ],
        ),
        Text(
          'Controls ${theme.sizes.controlSm.toInt()} / ${theme.sizes.controlMd.toInt()} / ${theme.sizes.controlLg.toInt()}',
          variant: TextVariant.detail,
        ),
      ],
    );
  }
}
