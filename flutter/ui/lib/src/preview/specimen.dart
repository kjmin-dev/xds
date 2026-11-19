import 'dart:convert';

import '../../acme_ui.dart';

/// The preview and its golden tests use the same offline picture on every host.
final specimenPicture = MemoryImage(
  base64Decode(
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAn0lEQVR42mNITvuYkfY+N/1tUfrrsoyX1RnPGzKetmY+7sp82J91f3LW3RlZt+dm31yUfX15ztU1OVcYSFK9IecSA0mqt+ZeYCBJ9a7ccwwkqd6fd4aBJNVH8k4xkKT6ZN4JBpJUn80/xkCS6kv5RxhIUn294BADSarvFBxgIEn1w4J9DCSpfla4h4Ek1a8KdzGQpPp90Q4GklR/KdoGANKd6y5LxwwKAAAAAElFTkSuQmCC',
  ),
);

/// One contract component in its available sizes, variants and states.
class ComponentSpecimen extends StatefulWidget {
  const ComponentSpecimen(this.name, {super.key, this.initiallyOpen = false});
  final String name;
  final bool initiallyOpen;

  @override
  State<ComponentSpecimen> createState() => _ComponentSpecimenState();
}

class _ComponentSpecimenState extends State<ComponentSpecimen> {
  String field = '';
  bool enabled = true;
  String selection = 'home';
  double volume = 40;
  Set<String> expanded = {'tokens'};
  DateRange? leave;
  DateTime? due = DateTime(2026, 3, 10);
  DateRange? stay = DateRange(
    start: DateTime(2026, 3, 10),
    end: DateTime(2026, 3, 14),
  );
  late bool open = widget.initiallyOpen;
  bool dismissed = false;

  static const choices = [
    ChoiceOption('home', 'Home'),
    ChoiceOption('search', 'Search'),
    ChoiceOption('profile', 'Profile'),
  ];

  void toggle(bool value) => setState(() => enabled = value);
  void choose(String value) => setState(() => selection = value);
  void edit(String value) => setState(() => field = value);
  void show() => setState(() => open = true);
  void close() => setState(() => open = false);
  void toggleSample() => toggle(!enabled);

  Widget column(List<Widget> children) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    spacing: SpaceTokens.s3,
    children: children,
  );
  Widget wrap(List<Widget> children) => Wrap(
    spacing: SpaceTokens.s2,
    runSpacing: SpaceTokens.s2,
    crossAxisAlignment: WrapCrossAlignment.center,
    children: children,
  );

  @override
  Widget build(BuildContext context) {
    final ty = AcmeTheme.of(context);
    switch (widget.name) {
      case 'Text':
        return column([
          for (final role in TextVariant.values) Text(role.name, variant: role),
          wrap([
            for (final tone in TextTone.values) Text(tone.name, tone: tone),
          ]),
        ]);
      case 'Icon':
        return column([
          wrap([
            for (final size in IconSize.values)
              Icon(IconName.star, size: size, label: size.name),
          ]),
          wrap([
            for (final filled in [false, true])
              Icon(IconName.heart, filled: filled),
          ]),
        ]);
      case 'Button':
        return column([
          for (final variant in ButtonVariant.values)
            wrap([
              for (final size in ControlSize.values)
                Button(
                  label: variant.name,
                  size: size,
                  variant: variant,
                  onPressed: toggleSample,
                ),
            ]),
          wrap([
            Button(label: 'Disabled', disabled: true, onPressed: toggleSample),
            Button(label: 'Saving', loading: true, onPressed: toggleSample),
            Button(
              label: 'Saved',
              iconStart: IconName.bookmark,
              selected: enabled,
              onPressed: toggleSample,
            ),
          ]),
          Button(
            label: 'Continue',
            fullWidth: true,
            iconEnd: IconName.arrowRight,
            onPressed: toggleSample,
          ),
        ]);
      case 'IconButton':
        return column([
          for (final variant in ButtonVariant.values)
            wrap([
              for (final size in ControlSize.values)
                IconButton(
                  label: '${variant.name} ${size.name}',
                  icon: IconName.star,
                  size: size,
                  variant: variant,
                  onPressed: toggleSample,
                ),
            ]),
          wrap([
            IconButton(
              label: 'Saved',
              icon: IconName.bookmark,
              selected: enabled,
              onPressed: toggleSample,
            ),
            IconButton(
              label: 'Saving',
              icon: IconName.bookmark,
              loading: true,
              onPressed: toggleSample,
            ),
            IconButton(
              label: 'Disabled',
              icon: IconName.bookmark,
              disabled: true,
              onPressed: toggleSample,
            ),
          ]),
        ]);
      case 'TextField':
        return column([
          TextField(
            label: 'Name',
            value: field,
            placeholder: 'Full name',
            description: 'Shown on your profile.',
            onChanged: edit,
          ),
          TextField(
            label: 'Notes',
            value: field,
            multiline: true,
            rows: 2,
            maxLength: 80,
            onChanged: edit,
          ),
          TextField(
            label: 'Email',
            value: 'incomplete',
            error: 'Enter a valid address.',
            onChanged: edit,
          ),
          TextField(
            label: 'Workspace',
            value: 'Acme',
            disabled: true,
            onChanged: edit,
          ),
        ]);
      case 'SearchField':
        return column([
          SearchField(
            label: 'Search files',
            value: field,
            placeholder: 'Search files',
            clearLabel: 'Clear search',
            onChanged: edit,
          ),
          SearchField(
            label: 'Unavailable search',
            value: 'Archived',
            disabled: true,
            onChanged: edit,
          ),
        ]);
      case 'Switch':
        return column([
          Switch(label: 'Notifications', checked: enabled, onChanged: toggle),
          Switch(
            label: 'Offline',
            checked: !enabled,
            onChanged: (value) => toggle(!value),
          ),
          Switch(
            label: 'Managed',
            checked: true,
            disabled: true,
            onChanged: toggle,
          ),
        ]);
      case 'Checkbox':
        return column([
          Checkbox(
            label: 'Remember this device',
            checked: enabled,
            onChanged: toggle,
          ),
          Checkbox(
            label: 'Sync settings',
            checked: !enabled,
            onChanged: (value) => toggle(!value),
          ),
          Checkbox(
            label: 'Required',
            checked: true,
            disabled: true,
            onChanged: toggle,
          ),
        ]);
      case 'RadioGroup':
        return column([
          RadioGroup(
            label: 'Start page',
            options: choices,
            value: selection,
            onChanged: choose,
          ),
          RadioGroup(
            label: 'Managed preference',
            options: choices,
            value: selection,
            onChanged: choose,
            disabled: true,
          ),
        ]);
      case 'SegmentedControl':
        return column([
          SegmentedControl(
            options: choices,
            value: selection,
            onChanged: choose,
          ),
          SegmentedControl(
            options: choices,
            value: selection,
            onChanged: choose,
            fullWidth: true,
          ),
        ]);
      case 'Slider':
        return column([
          Slider(
            label: 'Volume',
            value: volume,
            min: 0,
            max: 100,
            step: 5,
            showValue: true,
            onChanged: (v) => setState(() => volume = v),
          ),
          Slider(
            label: 'Managed volume',
            value: 60,
            min: 0,
            max: 100,
            step: 5,
            disabled: true,
            onChanged: (_) {},
          ),
        ]);
      case 'ProgressBar':
        return column([
          ProgressBar(value: 0, label: 'Queued'),
          ProgressBar(value: 0.4, label: 'Uploading'),
          ProgressBar(value: 1, label: 'Complete'),
        ]);
      case 'Select':
        return column([
          Select<String>(
            label: 'Folder',
            options: const [
              SelectOption(
                value: 'home',
                label: 'Inbox',
                description: 'Received recently',
              ),
              SelectOption(value: 'search', label: 'Drafts'),
            ],
            value: selection,
            onChanged: choose,
            defaultOpen: widget.initiallyOpen,
          ),
          Select<String>(
            label: 'Archive',
            options: const [SelectOption(value: 'home', label: 'Inbox')],
            value: selection,
            onChanged: choose,
            disabled: true,
          ),
        ]);
      case 'DatePicker':
        return column([
          DatePicker(
            label: 'Due date',
            value: due,
            min: DateTime(2026, 3, 5),
            max: DateTime(2026, 4, 20),
            onChanged: (v) => setState(() => due = v),
            defaultOpen: widget.initiallyOpen,
          ),
          DatePicker(
            label: 'Reminder',
            placeholder: 'Choose a date',
            disabled: true,
            onChanged: (_) {},
          ),
        ]);
      case 'DateRangePicker':
        return column([
          DateRangePicker(
            label: 'Stay',
            value: stay,
            min: DateTime(2026, 3, 5),
            max: DateTime(2026, 4, 20),
            onChanged: (v) => setState(() => stay = v),
            defaultOpen: widget.initiallyOpen,
          ),
          DateRangePicker(
            label: 'Leave',
            value: leave,
            placeholder: 'Choose dates',
            description: 'Choose between two and seven days.',
            minLength: 2,
            maxLength: 7,
            onChanged: (v) => setState(() => leave = v),
          ),
        ]);
      case 'Chip':
        return wrap([
          Chip(
            label: 'Favorites',
            iconStart: IconName.star,
            selected: enabled,
            onPressed: toggleSample,
          ),
          Chip(label: 'Recent', selected: !enabled, onPressed: toggleSample),
          Chip(label: 'Archived', disabled: true, onPressed: toggleSample),
        ]);
      case 'ChipBar':
        return ChipBar(
          label: 'Collections',
          children: [
            for (final item in ['home', 'search', 'profile', 'archive'])
              Chip(
                label: item,
                selected: item == selection,
                onPressed: () => choose(item),
              ),
          ],
        );
      case 'Tabs':
        return column([
          Tabs(
            items: choices,
            value: selection,
            label: 'Sections',
            onChanged: choose,
          ),
          Tabs(
            items: choices,
            value: selection,
            label: 'Destinations',
            fullWidth: true,
            onChanged: choose,
          ),
        ]);
      case 'Badge':
        return wrap([
          for (final tone in BadgeTone.values)
            Badge(label: tone.name, tone: tone),
          Badge(label: 'Active', dot: true),
          Badge(label: 'Saved', icon: IconName.check),
        ]);
      case 'CountBadge':
        return wrap([
          CountBadge(count: 3),
          CountBadge(count: 128, max: 99, label: 'Unread notifications'),
          CountBadge(count: 2, child: Icon(IconName.bell)),
        ]);
      case 'Banner':
        return column([
          for (final tone in BannerTone.values)
            if (tone != BannerTone.info || !dismissed)
              Banner(
                message: 'Project settings updated.',
                title: tone.name,
                tone: tone,
                onDismiss: tone == BannerTone.info
                    ? () => setState(() => dismissed = true)
                    : null,
              ),
        ]);
      case 'Card':
        return column([
          Card(
            title: 'Project files',
            description: 'Available offline.',
            child: Text('Last synced just now.'),
          ),
          Card(
            title: 'Pinned project',
            selected: enabled,
            onPressed: toggleSample,
            child: Text('Press to change selection.'),
          ),
          Card(
            flush: true,
            media: Thumbnail(
              alt: 'Blue and violet gradient',
              src: specimenPicture,
            ),
            title: 'Reference',
          ),
        ]);
      case 'Divider':
        return column([Text('Inbox'), Divider(), Text('Archive')]);
      case 'Spinner':
        return wrap([
          for (final size in ControlSize.values)
            Spinner(size: size, label: 'Loading'),
        ]);
      case 'Avatar':
        return wrap([
          for (final size in AvatarSize.values)
            Avatar(name: 'Ada Lovelace', size: size),
          Avatar(name: 'Project', src: specimenPicture),
        ]);
      case 'AvatarStack':
        return column([
          for (final size in AvatarSize.values)
            AvatarStack(
              people: [
                AvatarPerson('Ada Lovelace'),
                AvatarPerson('Grace Hopper'),
                AvatarPerson('Alan Turing'),
                AvatarPerson('Katherine Johnson'),
              ],
              size: size,
              max: 3,
              label: 'Project members',
            ),
        ]);
      case 'ListRow':
        return column([
          ListRow(
            title: 'Downloads',
            description: 'Saved on this device',
            leading: Icon(IconName.download),
            chevron: true,
            onPressed: toggleSample,
          ),
          ListRow(
            title: 'Recent',
            leading: Icon(IconName.clock),
            selected: enabled,
            compact: true,
            onPressed: toggleSample,
          ),
          ListRow(title: 'Archived', disabled: true, onPressed: toggleSample),
        ]);
      case 'Thumbnail':
        return wrap([
          for (final ratio in ThumbnailRatio.values)
            SizedBox(
              width: ty.sizes.avatarXl * 2,
              child: Thumbnail(
                ratio: ratio,
                src: specimenPicture,
                alt: 'Blue and violet gradient',
                badge: '3:24',
                progress: .4,
              ),
            ),
          SizedBox(
            width: ty.sizes.avatarXl * 2,
            child: Thumbnail(alt: 'No picture'),
          ),
        ]);
      case 'MediaCard':
        return column([
          for (final layout in MediaLayout.values)
            MediaCard(
              layout: layout,
              title: 'Building a design system',
              meta: const ['Design', '4 min'],
              src: specimenPicture,
              alt: 'Blue gradient',
              onPressed: toggleSample,
              action: IconButton(
                label: 'Save',
                icon: IconName.bookmark,
                onPressed: toggleSample,
              ),
            ),
        ]);
      case 'SectionHeader':
        return SectionHeader(
          title: 'Recent files',
          description: 'Files opened this week.',
          icon: IconName.clock,
          action: Button(
            label: 'View all',
            size: ControlSize.sm,
            onPressed: toggleSample,
          ),
        );
      case 'EmptyState':
        return EmptyState(
          icon: IconName.search,
          title: 'No results',
          description: 'Try a different search.',
          action: Button(label: 'Clear search', onPressed: toggleSample),
        );
      case 'Accordion':
        return column([
          for (final multiple in [false, true])
            Accordion(
              items: [
                AccordionItem(
                  'tokens',
                  'Where do the colors come from?',
                  content: Text('The design tokens.'),
                ),
                AccordionItem(
                  'themes',
                  'How do themes work?',
                  content: Text(
                    'Every theme supplies an accent and a neutral ramp.',
                  ),
                ),
              ],
              expanded: expanded,
              onChanged: (items) => setState(() => expanded = items),
              multiple: multiple,
            ),
        ]);
      case 'TopBar':
        return TopBar(
          title: 'Settings',
          onBack: toggleSample,
          trailing: Button(
            label: 'Edit',
            variant: ButtonVariant.ghost,
            size: ControlSize.sm,
            onPressed: toggleSample,
          ),
        );
      case 'TabBar':
        return TabBar<String>(
          items: previewTabs,
          value: selection,
          onChanged: choose,
        );
      case 'BottomSheet':
        return column([
          Button(label: 'Open a bottom sheet', onPressed: show),
          BottomSheet(
            open: open,
            onClose: close,
            title: 'Share report',
            child: column([
              Text(
                'Anyone with the link can read it.',
                tone: TextTone.secondary,
              ),
              Button(
                label: 'Copy link',
                variant: ButtonVariant.primary,
                onPressed: close,
              ),
              Button(label: 'Cancel', onPressed: close),
            ]),
          ),
        ]);
      case 'Menu':
        return Menu(
          label: 'Report',
          defaultOpen: widget.initiallyOpen,
          trigger: (show) => Button(
            label: 'Actions',
            iconEnd: IconName.chevronDown,
            onPressed: show,
          ),
          items: [
            MenuItem(
              label: 'Rename',
              icon: IconName.pencil,
              onSelected: toggleSample,
            ),
            MenuItem(
              label: 'Duplicate',
              icon: IconName.copy,
              onSelected: toggleSample,
            ),
            MenuItem.separator(),
            MenuItem(label: 'Delete', danger: true, onSelected: toggleSample),
          ],
        );
      case 'Dialog':
        return column([
          Button(label: 'Open dialog', onPressed: show),
          Dialog(
            open: open,
            onClose: close,
            title: 'Delete report?',
            description: 'The report and its comments will be removed.',
            actions: [
              Button(label: 'Cancel', onPressed: close),
              Button(
                label: 'Delete',
                variant: ButtonVariant.danger,
                onPressed: close,
              ),
            ],
          ),
        ]);
      case 'Toast':
        return column([
          Button(label: 'Show toast', onPressed: show),
          Toast(
            open: open,
            onClose: close,
            message: 'Report saved.',
            duration: widget.initiallyOpen
                ? Duration.zero
                : const Duration(seconds: 4),
          ),
        ]);
      case 'Skeleton':
        return column([
          for (final shape in SkeletonShape.values)
            Align(
              alignment: AlignmentDirectional.centerStart,
              child: Skeleton(
                shape: shape,
                width: shape == SkeletonShape.circle
                    ? ty.sizes.avatarMd
                    : ty.sizes.avatarXl * 2,
                height: shape == SkeletonShape.text
                    ? SpaceTokens.s3
                    : ty.sizes.avatarMd,
              ),
            ),
        ]);
      default:
        throw ArgumentError.value(widget.name, 'name', 'Unknown component');
    }
  }
}

const previewTabs = [
  TabBarItem(value: 'home', label: 'Home', icon: IconName.house),
  TabBarItem(value: 'search', label: 'Search', icon: IconName.search),
  TabBarItem(value: 'profile', label: 'Profile', icon: IconName.user),
];
