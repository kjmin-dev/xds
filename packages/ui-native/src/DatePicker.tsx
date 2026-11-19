import { space } from "@acme/tokens";
import { useState } from "react";
import { AccessibilityInfo, I18nManager, Platform, StyleSheet, View } from "react-native";
import { BottomSheet } from "./BottomSheet.tsx";
import {
  cellSize,
  DateField,
  MonthGrid,
  MonthHeading,
  useCalendarNames,
  useCalendarOpen,
  useSheetWidth,
  WeekdayRow,
} from "./Calendar.tsx";
import {
  addMonths,
  hasMonthAfter,
  hasMonthBefore,
  type IsoDate,
  monthOf,
  openingDay,
} from "./datePicker.ts";
import { CHOSEN, UNMARKED } from "./dateRange.ts";
import { IconButton } from "./IconButton.tsx";

export type { IsoDate };

export type DatePickerProps = {
  /** Always visible, like a TextField's. It is also the title of the calendar's sheet. */
  label: string;
  /** The chosen day, as `YYYY-MM-DD`. Leave it out while none is chosen. */
  value?: IsoDate | undefined;
  /** Called with the day the person chooses. The calendar closes itself. */
  onChange: (value: IsoDate) => void;
  /** The first day that can be chosen. Days before it are shown and cannot be chosen. */
  min?: IsoDate | undefined;
  /** The last day that can be chosen. */
  max?: IsoDate | undefined;
  /** Shown in the field while no day is chosen. */
  placeholder?: string;
  /** Help shown under the field. Replaced by `error` while there is one. */
  description?: string;
  /** What is wrong and how to fix it. Clear it when the value changes. */
  error?: string | undefined;
  disabled?: boolean;
  /** Names the button that shows the month before, for a screen reader. */
  previousLabel?: string;
  /** Names the button that shows the month after. */
  nextLabel?: string;
  /** Starts with the calendar open, for a preview or a screenshot. */
  defaultOpen?: boolean;
};

/**
 * A field for choosing one day. Closed, it looks like a Select, with the day in the locale's
 * medium form. Pressed, it opens a calendar of one month in a bottom sheet titled with the label,
 * on the chosen day, or on today while none is, held between `min` and `max`. Days outside them
 * are dimmed and cannot be chosen; today has a ring and the chosen day a filled circle.
 *
 * Pressing a day chooses it and closes the sheet; a tap outside, a drag down or Back closes it
 * without choosing. The names of the months and the days and the first day of the week are the
 * device locale's.
 */
export function DatePicker({
  label,
  value,
  onChange,
  min,
  max,
  placeholder,
  description,
  error,
  disabled = false,
  previousLabel = "Previous month",
  nextLabel = "Next month",
  defaultOpen = false,
}: DatePickerProps) {
  const names = useCalendarNames();
  const calendar = useCalendarOpen(defaultOpen && !disabled);

  return (
    <View style={styles.field}>
      <DateField
        label={label}
        shown={value === undefined ? undefined : names.medium(value)}
        placeholder={placeholder}
        description={description}
        error={error}
        disabled={disabled}
        open={calendar.open}
        onOpen={calendar.show}
      />
      <BottomSheet open={calendar.open} onClose={calendar.hide} title={label}>
        <Month
          key={calendar.openings}
          value={value}
          min={min}
          max={max}
          today={calendar.today}
          previousLabel={previousLabel}
          nextLabel={nextLabel}
          onChoose={(day) => {
            onChange(day);
            calendar.hide();
          }}
        />
      </BottomSheet>
    </View>
  );
}

/** One month, between buttons that show the months before and after it. */
function Month({
  value,
  min,
  max,
  today,
  previousLabel,
  nextLabel,
  onChoose,
}: {
  value: IsoDate | undefined;
  min: IsoDate | undefined;
  max: IsoDate | undefined;
  today: IsoDate;
  previousLabel: string;
  nextLabel: string;
  onChoose: (day: IsoDate) => void;
}) {
  const names = useCalendarNames();
  const [month, setMonth] = useState(() => monthOf(openingDay({ value, min, max }, today)));
  const [width, measure] = useSheetWidth();
  const cell = cellSize(width);
  const page = (count: number) => {
    const shown = addMonths(month, count);
    setMonth(shown);
    // VoiceOver has no live regions: it is told the month the button showed.
    if (Platform.OS === "ios") AccessibilityInfo.announceForAccessibility(names.month(shown));
  };
  // The chevrons point the way the months run, which is mirrored right to left.
  const [back, on] = I18nManager.isRTL
    ? (["chevron-right", "chevron-left"] as const)
    : (["chevron-left", "chevron-right"] as const);

  return (
    <View style={styles.calendar} onLayout={(event) => measure(event.nativeEvent.layout.width)}>
      <View style={[styles.month, { width: cell * 7 }]}>
        {/* As the other clients lay it out: the month between the buttons that change it. */}
        <View style={styles.header}>
          <IconButton
            icon={back}
            label={previousLabel}
            size="sm"
            disabled={!hasMonthBefore(month, min)}
            onPress={() => page(-1)}
          />
          <View style={styles.title}>
            <MonthHeading title={names.month(month)} live />
          </View>
          <IconButton
            icon={on}
            label={nextLabel}
            size="sm"
            disabled={!hasMonthAfter(month, max)}
            onPress={() => page(1)}
          />
        </View>
        <View>
          <WeekdayRow initials={names.initials} cell={cell} />
          <MonthGrid
            month={month}
            cell={cell}
            names={names}
            today={today}
            min={min}
            max={max}
            marks={(day) => (day === value ? CHOSEN : UNMARKED)}
            onPress={onChoose}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    alignSelf: "stretch",
    gap: space[1],
  },
  calendar: {
    alignItems: "center",
  },
  month: {
    gap: space[2],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    flex: 1,
  },
});
