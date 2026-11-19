import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/widgets.dart' hide Icon;
import 'package:intl/date_symbol_data_local.dart';
import 'package:intl/intl.dart';

import 'button.dart';
import 'icon.dart';
import 'menus.dart';
import 'modals.dart';
import 'pressable.dart';
import 'theme.dart';
import 'tokens/tokens.g.dart';

/// Dates are civil days. UTC midnights keep the number of nights independent of DST.
DateTime _day(DateTime date) => DateTime.utc(date.year, date.month, date.day);
int _month(DateTime d) => d.year * 12 + d.month - 1;
DateTime _first(int month) => DateTime.utc(month ~/ 12, month % 12 + 1);
String _key(DateTime day) =>
    '${day.year.toString().padLeft(4, '0')}-${day.month.toString().padLeft(2, '0')}-${day.day.toString().padLeft(2, '0')}';

class DateRange {
  const DateRange({required this.start, required this.end});
  final DateTime start, end;
  @override
  bool operator ==(Object other) =>
      other is DateRange &&
      _day(start) == _day(other.start) &&
      _day(end) == _day(other.end);
  @override
  int get hashCode => Object.hash(_day(start), _day(end));
}

class _DateNames {
  _DateNames(this.locale);
  final String locale;
  static final Map<String, _DateNames> _cache = {};
  static bool _initialized = false;
  static _DateNames of(BuildContext context) {
    if (!_initialized) {
      // The local-data implementation installs the tables synchronously, including in standalone hosts.
      unawaited(initializeDateFormatting());
      _initialized = true;
    }
    final name = Intl.canonicalizedLocale(
      Localizations.localeOf(context).toString(),
    );
    return _cache.putIfAbsent(name, () => _DateNames(name));
  }

  late final medium = DateFormat.yMMMd(locale);
  late final full = DateFormat.yMMMMEEEEd(locale);
  late final month = DateFormat.yMMMM(locale);
  late final number = DateFormat.d(locale);
  late final firstWeekday = medium.dateSymbols.FIRSTDAYOFWEEK + 1;
  late final initials = List.generate(
    7,
    (i) => medium.dateSymbols.NARROWWEEKDAYS[(firstWeekday + i) % 7],
  );
}

class DatePicker extends StatefulWidget {
  const DatePicker({
    super.key,
    required this.label,
    this.value,
    required this.onChanged,
    this.min,
    this.max,
    this.placeholder,
    this.description,
    this.error,
    this.disabled = false,
    this.previousLabel = 'Previous month',
    this.nextLabel = 'Next month',
    this.defaultOpen = false,
  });
  final String label, previousLabel, nextLabel;
  final String? placeholder, description, error;
  final DateTime? value, min, max;
  final ValueChanged<DateTime> onChanged;
  final bool disabled, defaultOpen;
  @override
  State<DatePicker> createState() => _DatePickerState();
}

class _DatePickerState extends State<DatePicker> {
  late bool _open = widget.defaultOpen && !widget.disabled;
  int _opening() => _month(widget.value ?? DateTime.now()).clamp(
    widget.min == null ? 0 : _month(widget.min!),
    widget.max == null ? 119999 : _month(widget.max!),
  );
  late int _shown = _opening();
  @override
  void didUpdateWidget(DatePicker old) {
    super.didUpdateWidget(old);
    if (widget.disabled) _open = false;
  }

  @override
  Widget build(BuildContext context) {
    final names = _DateNames.of(context), t = AcmeTheme.of(context);
    final min = widget.min == null ? 0 : _month(widget.min!),
        max = widget.max == null ? 119999 : _month(widget.max!);
    final shown = _shown.clamp(min, max);
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ChoiceField(
          label: widget.label,
          value: widget.value == null
              ? null
              : names.medium.format(widget.value!),
          placeholder: widget.placeholder,
          description: widget.description,
          error: widget.error,
          disabled: widget.disabled,
          open: _open,
          icon: IconName.calendar,
          onPressed: () => setState(() {
            _shown = _opening();
            _open = true;
          }),
        ),
        BottomSheet(
          open: _open,
          title: widget.label,
          onClose: () => setState(() => _open = false),
          child: Center(
            child: ConstrainedBox(
              constraints: BoxConstraints(maxWidth: t.sizes.calendarDay * 7),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      _MonthButton(
                        label: widget.previousLabel,
                        earlier: true,
                        onPressed: shown > min
                            ? () => setState(() => _shown = shown - 1)
                            : null,
                      ),
                      Expanded(
                        child: Semantics(
                          header: true,
                          liveRegion: true,
                          child: Text(
                            names.month.format(_first(shown)),
                            textAlign: TextAlign.center,
                            style: t.text(
                              TypographyTokens.bodyStrong,
                              t.colors.datePickerHeading,
                            ),
                          ),
                        ),
                      ),
                      _MonthButton(
                        label: widget.nextLabel,
                        earlier: false,
                        onPressed: shown < max
                            ? () => setState(() => _shown = shown + 1)
                            : null,
                      ),
                    ],
                  ),
                  _Weekdays(names: names),
                  _MonthGrid(
                    month: shown,
                    names: names,
                    min: widget.min,
                    max: widget.max,
                    start: widget.value,
                    end: widget.value,
                    choose: (date) {
                      setState(() => _open = false);
                      widget.onChanged(date);
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _MonthButton extends StatelessWidget {
  const _MonthButton({
    required this.label,
    required this.earlier,
    required this.onPressed,
  });
  final String label;
  final bool earlier;
  final VoidCallback? onPressed;
  @override
  Widget build(BuildContext context) {
    final t = AcmeTheme.of(context),
        radius = BorderRadius.circular(t.sizes.buttonRadius);
    return Semantics(
      label: label,
      button: true,
      enabled: onPressed != null,
      child: Pressable(
        onPressed: onPressed,
        radius: radius,
        builder: (pressed, hover) => Container(
          width: t.sizes.controlSm,
          height: t.sizes.controlSm,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            borderRadius: radius,
            color: pressed
                ? t.colors.buttonGhostBackgroundPressed
                : hover
                ? t.colors.buttonGhostBackgroundHover
                : null,
          ),
          child: Icon(
            earlier ? IconName.chevronLeft : IconName.chevronRight,
            size: IconSize.sm,
            directional: true,
            color: onPressed == null
                ? t.colors.textDisabled
                : t.colors.buttonGhostText,
          ),
        ),
      ),
    );
  }
}

class DateRangePicker extends StatefulWidget {
  const DateRangePicker({
    super.key,
    required this.label,
    this.value,
    required this.onChanged,
    this.min,
    this.max,
    this.minLength = 0,
    this.maxLength,
    this.placeholder,
    this.description,
    this.error,
    this.disabled = false,
    this.startLabel = 'Start',
    this.endLabel = 'End',
    this.doneLabel = 'Done',
    this.previousLabel = 'Previous month',
    this.nextLabel = 'Next month',
    this.defaultOpen = false,
  }) : assert(minLength >= 0),
       assert(maxLength == null || maxLength >= minLength);
  final String label, startLabel, endLabel, doneLabel, previousLabel, nextLabel;
  final String? placeholder, description, error;
  final DateTime? min, max;
  final DateRange? value;
  final ValueChanged<DateRange> onChanged;
  final int minLength;
  final int? maxLength;
  final bool disabled, defaultOpen;
  @override
  State<DateRangePicker> createState() => _DateRangePickerState();
}

class _DateRangePickerState extends State<DateRangePicker> {
  late bool _open = widget.defaultOpen && !widget.disabled;
  DateTime? _pending;
  late int _opening = _openingMonth();
  int _openingMonth() => _month(widget.value?.start ?? DateTime.now()).clamp(
    widget.min == null ? 0 : _month(widget.min!),
    widget.max == null ? 119999 : _month(widget.max!),
  );
  @override
  void didUpdateWidget(DateRangePicker old) {
    super.didUpdateWidget(old);
    if (widget.disabled) {
      _pending = null;
      _open = false;
    }
  }

  void _close() => setState(() {
    _pending = null;
    _open = false;
  });
  bool _canChoose(DateTime day) {
    final start = _pending;
    if (start == null || day.isBefore(start)) return true;
    final nights = day.difference(start).inDays;
    return nights >= widget.minLength &&
        (widget.maxLength == null || nights <= widget.maxLength!);
  }

  void _choose(DateTime date) {
    final start = _pending;
    if (start == null || date.isBefore(start)) {
      setState(() => _pending = date);
      return;
    }
    if (!_canChoose(date)) return;
    setState(() => _pending = null);
    widget.onChanged(DateRange(start: start, end: date));
  }

  @override
  Widget build(BuildContext context) {
    final names = _DateNames.of(context), t = AcmeTheme.of(context);
    final value = widget.value;
    final shown = value == null
        ? null
        : _day(value.start) == _day(value.end)
        ? names.medium.format(value.start)
        : '${names.medium.format(value.start)} – ${names.medium.format(value.end)}';
    final start = _pending ?? value?.start,
        end = _pending == null ? value?.end : null;
    final first = widget.min == null
        ? math.max(0, _opening - 12)
        : _month(widget.min!);
    final last = widget.max == null
        ? math.min(119999, _opening + 24)
        : _month(widget.max!);
    final center = _opening.clamp(first, last);
    const centerKey = ValueKey('opening-month');
    Widget month(int index) => Padding(
      padding: const EdgeInsets.only(bottom: SpaceTokens.s3),
      child: Column(
        children: [
          Semantics(
            header: true,
            child: Padding(
              padding: const EdgeInsets.all(SpaceTokens.s2),
              child: Text(
                names.month.format(_first(index)),
                style: t.text(
                  TypographyTokens.bodyStrong,
                  t.colors.datePickerHeading,
                ),
              ),
            ),
          ),
          _MonthGrid(
            month: index,
            names: names,
            min: widget.min,
            max: widget.max,
            start: start,
            end: end,
            startLabel: widget.startLabel,
            endLabel: widget.endLabel,
            allowed: _canChoose,
            choose: _choose,
          ),
        ],
      ),
    );
    Widget endpoint(String label, DateTime? day) => Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: t.text(TypographyTokens.footnote, t.colors.textSecondary),
          ),
          Text(
            day == null ? '—' : names.medium.format(day),
            style: t.text(TypographyTokens.bodyStrong, t.colors.textPrimary),
          ),
        ],
      ),
    );
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ChoiceField(
          label: widget.label,
          value: shown,
          placeholder: widget.placeholder,
          description: widget.description,
          error: widget.error,
          disabled: widget.disabled,
          open: _open,
          icon: IconName.calendar,
          onPressed: () => setState(() {
            _opening = _openingMonth();
            _pending = null;
            _open = true;
          }),
        ),
        BottomSheet(
          open: _open,
          tall: true,
          title: widget.label,
          onClose: _close,
          child: Column(
            spacing: SpaceTokens.s2,
            children: [
              Row(
                children: [
                  endpoint(widget.startLabel, start),
                  endpoint(widget.endLabel, end),
                ],
              ),
              Expanded(
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    maxWidth: t.sizes.calendarDay * 7,
                  ),
                  child: Column(
                    children: [
                      _Weekdays(names: names),
                      // A centered pair of slivers opens at the chosen month without building or measuring the preceding years.
                      Expanded(
                        child: CustomScrollView(
                          center: centerKey,
                          physics: const ClampingScrollPhysics(),
                          slivers: [
                            SliverList.builder(
                              itemCount: center - first,
                              itemBuilder: (_, i) => month(center - i - 1),
                            ),
                            SliverList.builder(
                              key: centerKey,
                              itemCount: last - center + 1,
                              itemBuilder: (_, i) => month(center + i),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Button(
                label: widget.doneLabel,
                onPressed: _close,
                variant: ButtonVariant.primary,
                fullWidth: true,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _Weekdays extends StatelessWidget {
  const _Weekdays({required this.names});
  final _DateNames names;
  @override
  Widget build(BuildContext context) {
    final t = AcmeTheme.of(context);
    return ExcludeSemantics(
      child: Row(
        children: [
          for (final name in names.initials)
            Expanded(
              child: Center(
                child: Text(
                  name,
                  style: t.text(
                    TypographyTokens.footnote,
                    t.colors.datePickerWeekday,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _MonthGrid extends StatelessWidget {
  const _MonthGrid({
    required this.month,
    required this.names,
    required this.choose,
    this.start,
    this.end,
    this.min,
    this.max,
    this.allowed,
    this.startLabel,
    this.endLabel,
  });
  final int month;
  final _DateNames names;
  final DateTime? start, end, min, max;
  final String? startLabel, endLabel;
  final ValueChanged<DateTime> choose;
  final bool Function(DateTime day)? allowed;
  @override
  Widget build(BuildContext context) {
    final t = AcmeTheme.of(context), c = t.colors;
    final first = _first(month),
        count = DateTime.utc(first.year, first.month + 1, 0).day;
    final offset = (first.weekday - names.firstWeekday) % 7,
        rows = (offset + count + 6) ~/ 7;
    final a = start == null ? null : _day(start!),
        b = end == null ? null : _day(end!),
        lo = min == null ? null : _day(min!),
        hi = max == null ? null : _day(max!);
    final today = _day(DateTime.now());
    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: names.month.format(first),
      child: LayoutBuilder(
        builder: (context, box) {
          final cell = math.min(t.sizes.calendarDay, box.maxWidth / 7);
          Widget dayCell(int row, int col) {
            final number = row * 7 + col - offset + 1;
            if (number < 1 || number > count) {
              return SizedBox(width: cell, height: t.sizes.calendarDay);
            }
            final day = DateTime.utc(first.year, first.month, number);
            final isStart = day == a,
                isEnd = day == b,
                edge = isStart || isEnd,
                between =
                    a != null &&
                    b != null &&
                    !day.isBefore(a) &&
                    !day.isAfter(b);
            final band =
                between &&
                a != b &&
                !(isStart && col == 6) &&
                !(isEnd && col == 0);
            final enabled =
                (lo == null || !day.isBefore(lo)) &&
                (hi == null || !day.isAfter(hi)) &&
                (allowed?.call(day) ?? true);
            final color = edge
                ? c.datePickerSelectedText
                : !enabled
                ? c.datePickerDisabledText
                : day == today
                ? c.datePickerTodayText
                : between
                ? c.datePickerRangeText
                : c.datePickerDayText;
            final full = [
              if (isStart && startLabel != null) startLabel!,
              if (isEnd && endLabel != null) endLabel!,
              names.full.format(day),
            ].join(', ');
            final corner = Radius.circular(RadiusTokens.full);
            return SizedBox(
              width: cell,
              height: t.sizes.calendarDay,
              child: Semantics(
                key: ValueKey(_key(day)),
                label: full,
                button: true,
                selected: edge || between,
                enabled: enabled,
                child: Pressable(
                  minTarget: false,
                  onPressed: enabled ? () => choose(day) : null,
                  radius: BorderRadius.circular(RadiusTokens.full),
                  builder: (pressed, hover) => Stack(
                    alignment: Alignment.center,
                    children: [
                      if (band)
                        PositionedDirectional(
                          start: isStart ? cell / 2 : 0,
                          end: isEnd ? cell / 2 : 0,
                          height: cell,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              color: c.datePickerRangeBackground,
                              borderRadius: BorderRadiusDirectional.horizontal(
                                start: col == 0 ? corner : Radius.zero,
                                end: col == 6 ? corner : Radius.zero,
                              ),
                            ),
                          ),
                        ),
                      Container(
                        width: cell,
                        height: cell,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: edge
                              ? (pressed
                                    ? c.datePickerSelectedBackgroundPressed
                                    : hover
                                    ? c.datePickerSelectedBackgroundHover
                                    : c.datePickerSelectedBackground)
                              : pressed
                              ? (between
                                    ? c.datePickerRangeBackgroundPressed
                                    : c.datePickerDayBackgroundPressed)
                              : hover
                              ? (between
                                    ? c.datePickerRangeBackgroundHover
                                    : c.datePickerDayBackgroundHover)
                              : null,
                          border: day == today && !edge
                              ? Border.all(
                                  width: BorderTokens.widthThin,
                                  color: c.datePickerTodayBorder,
                                )
                              : null,
                        ),
                        child: ExcludeSemantics(
                          child: Text(
                            names.number.format(day),
                            style: t.text(
                              edge
                                  ? TypographyTokens.bodyStrong
                                  : TypographyTokens.body,
                              color,
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

          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              for (var row = 0; row < rows; row++)
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    for (var col = 0; col < 7; col++) dayCell(row, col),
                  ],
                ),
            ],
          );
        },
      ),
    );
  }
}
