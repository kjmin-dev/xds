import { space } from "@acme/tokens";
import { useRef, useState } from "react";
import {
  AccessibilityInfo,
  FlatList,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { TallSheet, useListDrags } from "./BottomSheet.tsx";
import { Button } from "./Button.tsx";
import {
  cellSize,
  DateField,
  gridHeight,
  headingHeight,
  MonthGrid,
  MonthHeading,
  useCalendarNames,
  useCalendarOpen,
  useSheetWidth,
  WeekdayRow,
} from "./Calendar.tsx";
import { type IsoDate, type IsoMonth, monthOf, monthWeeks, openingDay } from "./datePicker.ts";
import {
  type DateRange,
  dayMarks,
  formatRange,
  monthsBetween,
  type RangeDraft,
  rangeDayChoice,
  rangeDayName,
  rangeSummary,
  shownRange,
} from "./dateRange.ts";
import { Text } from "./Text.tsx";
import { useColors } from "./theme.ts";

export type { DateRange };

export type DateRangePickerProps = {
  /** Always visible, like a TextField's. It is also the title of the calendar's sheet. */
  label: string;
  /** The chosen range, both days as `YYYY-MM-DD`. Leave it out while none is chosen. */
  value?: DateRange | undefined;
  /** Called with the range once its end is chosen, never with a start alone. */
  onChange: (value: DateRange) => void;
  /** The first day that can be chosen. Days before it are shown and cannot be chosen. */
  min?: IsoDate | undefined;
  /** The last day that can be chosen. */
  max?: IsoDate | undefined;
  /**
   * The fewest days the end can be after the start, the nights of a stay: 1 for one night at
   * least. With 0, the default, the start can be the end too.
   */
  minLength?: number;
  /** The most days the end can be after the start. No limit unless it is given. */
  maxLength?: number | undefined;
  /** Shown in the field while nothing is chosen. */
  placeholder?: string;
  /** Help shown under the field. Replaced by `error` while there is one. */
  description?: string;
  /** What is wrong and how to fix it. Clear it when the value changes. */
  error?: string | undefined;
  disabled?: boolean;
  /** Names the first day, over the months and for a screen reader: "Check-in". */
  startLabel?: string;
  /** Names the last day: "Check-out". */
  endLabel?: string;
  /**
   * Taken so that a screen written for the other clients compiles, and not shown: the sheet's
   * months scroll, and have no buttons.
   */
  previousLabel?: string;
  /** Not shown, as `previousLabel` is not. */
  nextLabel?: string;
  /** Names the button at the bottom of the sheet that closes it. */
  doneLabel?: string;
  /** Starts with the calendar open, for a preview or a screenshot. */
  defaultOpen?: boolean;
};

/**
 * A field for choosing a range of days, a start and an end, as for a stay or a trip. Closed, it
 * looks like a DatePicker and shows both days. Pressed, it opens a bottom sheet titled with the
 * label that takes most of the screen: the two ends named at the top, the months from `min` to
 * `max` scrolling down (a year before and two after without them), opened on the start's month
 * or on today's, and Done at the bottom.
 *
 * The first day pressed starts the range and the second ends it if the length allows, which calls
 * `onChange` once; the sheet stays, showing the range, so that it can be changed. A day before
 * the start starts again from there, a press over a whole range starts a new one, and the days
 * the length does not allow as the end cannot be pressed while it is chosen. Done, a drag down, a
 * tap outside or Back close the sheet and drop a start without an end.
 */
export function DateRangePicker({
  label,
  value,
  onChange,
  min,
  max,
  minLength = 0,
  maxLength,
  placeholder,
  description,
  error,
  disabled = false,
  startLabel = "Start",
  endLabel = "End",
  doneLabel = "Done",
  defaultOpen = false,
}: DateRangePickerProps) {
  const calendar = useCalendarOpen(defaultOpen && !disabled);

  return (
    <View style={styles.field}>
      <DateField
        label={label}
        shown={value === undefined ? undefined : formatRange(value)}
        placeholder={placeholder}
        description={description}
        error={error}
        disabled={disabled}
        open={calendar.open}
        onOpen={calendar.show}
      />
      <TallSheet open={calendar.open} onClose={calendar.hide} title={label}>
        <RangeCalendar
          // Each opening starts again from the chosen range, without a start left over.
          key={calendar.openings}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          minLength={minLength}
          maxLength={maxLength}
          today={calendar.today}
          labels={{ start: startLabel, end: endLabel }}
        />
        <Button variant="primary" label={doneLabel} fullWidth onPress={calendar.hide} />
      </TallSheet>
    </View>
  );
}

/**
 * The two ends, the weekday initials and the months under them. It holds what the calendar shows
 * chosen while it is open: a start alone until its end is pressed, the range given to it
 * otherwise.
 */
function RangeCalendar({
  value,
  onChange,
  min,
  max,
  minLength,
  maxLength,
  today,
  labels,
}: {
  value: DateRange | undefined;
  onChange: (value: DateRange) => void;
  min: IsoDate | undefined;
  max: IsoDate | undefined;
  minLength: number;
  maxLength: number | undefined;
  today: IsoDate;
  labels: { start: string; end: string };
}) {
  const colors = useColors();
  const names = useCalendarNames();
  const { fontScale } = useWindowDimensions();
  const [draft, setDraft] = useState<RangeDraft | null>(null);
  const shown = shownRange(value, draft);
  const [width, measure] = useSheetWidth();
  const cell = cellSize(width);
  // Fixed as the sheet opens: the list does not move under the finger while a range is chosen.
  const [{ months, opening }] = useState(() => {
    const opening = monthOf(openingDay({ value: value?.start, min, max }, today));
    return { months: monthsBetween(min, max, opening), opening };
  });
  const [start, end] = rangeSummary(shown, labels, names.medium);

  const press = (day: IsoDate) => {
    const choice = rangeDayChoice(shown, day, minLength, maxLength);
    if (choice === "none") return;
    const next: RangeDraft = choice === "start" ? [day] : [shown[0] ?? day, day];
    if (choice === "end") onChange({ start: next[0] ?? day, end: day });
    setDraft(choice === "start" ? next : null);
    // VoiceOver has no live regions: it is told the ends as they change.
    if (Platform.OS === "ios")
      AccessibilityInfo.announceForAccessibility(
        rangeSummary(next, labels, names.medium).join(", "),
      );
  };

  // Every month's height is known beforehand, so that the list can open on the start's month.
  const heading = headingHeight(fontScale);
  const heights = months.map(
    (month) => SECTION_SPACE + heading + gridHeight(monthWeeks(month, names.firstDay).length),
  );
  const offsets = heights.map((_, index) =>
    heights.slice(0, index).reduce((sum, height) => sum + height, 0),
  );
  const list = useRef({ viewport: 0, content: 0 }).current;
  const keep = useListDrags(() => list.content > list.viewport + 1);

  return (
    <View style={styles.calendar} onLayout={(event) => measure(event.nativeEvent.layout.width)}>
      <View
        // One announcement for both ends, when either changes.
        accessible
        aria-live="polite"
        aria-label={`${start}, ${end}`}
        style={styles.summary}
      >
        <Text
          variant="footnote"
          tone="inherit"
          numberOfLines={1}
          style={[styles.start, { color: colors.datePickerWeekday }]}
        >
          {start}
        </Text>
        <Text
          variant="footnote"
          tone="inherit"
          numberOfLines={1}
          style={{ color: colors.datePickerWeekday }}
        >
          {end}
        </Text>
      </View>
      <View style={[styles.months, { width: cell * 7 }]}>
        <WeekdayRow initials={names.initials} cell={cell} />
        <FlatList<IsoMonth>
          data={months}
          keyExtractor={(month) => month}
          // The days drawn depend on what is chosen, which the months themselves do not show.
          extraData={shown.join()}
          initialScrollIndex={Math.max(0, months.indexOf(opening))}
          getItemLayout={(_, index) => ({
            length: heights[index] ?? 0,
            offset: offsets[index] ?? 0,
            index,
          })}
          initialNumToRender={2}
          windowSize={5}
          style={styles.list}
          onLayout={(event) => {
            list.viewport = event.nativeEvent.layout.height;
          }}
          onContentSizeChange={(_, height) => {
            list.content = height;
          }}
          renderItem={({ item: month }) => (
            <View {...keep} style={styles.section}>
              <MonthHeading title={names.month(month)} />
              <MonthGrid
                month={month}
                cell={cell}
                names={names}
                today={today}
                min={min}
                max={max}
                marks={(day) => dayMarks(day, shown, undefined, names.firstDay)}
                choosable={(day) => rangeDayChoice(shown, day, minLength, maxLength) !== "none"}
                dayName={(marks, name) => rangeDayName(marks, name, labels.start, labels.end)}
                onPress={press}
              />
            </View>
          )}
        />
      </View>
    </View>
  );
}

/** The space a month's section keeps above its heading, between it and the days, and below. */
const SECTION_SPACE = space[2] + space[2] + space[4];

const styles = StyleSheet.create({
  field: {
    alignSelf: "stretch",
    gap: space[1],
  },
  calendar: {
    flex: 1,
    gap: space[2],
  },
  summary: {
    flexDirection: "row",
    gap: space[3],
  },
  start: {
    flex: 1,
  },
  months: {
    flex: 1,
    alignSelf: "center",
  },
  list: {
    flex: 1,
  },
  section: {
    gap: space[2],
    paddingTop: space[2],
    paddingBottom: space[4],
  },
});
