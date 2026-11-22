// What DatePicker and DateRangePicker share: the field that opens the calendar, and the parts of
// the calendar drawn from the `date-picker` tokens (a month's heading, the weekday initials, the
// days of a month with their circles and a range's band).

import { useMemo, useState } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import {
  type CalendarNames,
  calendarNames,
  fieldName,
  inRange,
  type IsoDate,
  type IsoMonth,
  localDay,
  monthWeeks,
} from "./datePicker.ts";
import { type DayMarks, isSelected } from "./dateRange.ts";
import { Icon } from "./Icon.tsx";
// The text of the component's own parts takes nothing from an app's `Defaults`.
import { PartText as Text } from "./Text.tsx";
import { FieldMessage, fieldOutline } from "./TextField.tsx";
import { type Theme, themed, useColors, useControl, useTheme } from "./theme.ts";

/**
 * The names of the device's locale, read once: the locale can only change with the app
 * restarting on iOS, and Android restarts the activity.
 */
export function useCalendarNames(): CalendarNames {
  return useMemo(() => calendarNames(), []);
}

/** The side of a day's cell in a calendar `width` wide. */
export function cellSize(width: number, day: number): number {
  return Math.min(day, Math.floor(width / 7));
}

/**
 * The width the calendar has in a bottom sheet: the window less the sheet's margins and its
 * padding. The calendar measures itself as well, and this stands in until it has.
 */
export function useSheetWidth(): [width: number, measure: (width: number) => void] {
  const { space } = useTheme();
  const { width: window } = useWindowDimensions();
  const [measured, setMeasured] = useState<number>();
  return [measured ?? window - space[2] * 2 - space[4] * 2, setMeasured];
}

/**
 * Whether the calendar is open; how many times it opened, a key that starts it again from the
 * chosen day each time; and today's date, which is read as it opens rather than while drawing,
 * since a screen can stay up past midnight.
 */
export function useCalendarOpen(initiallyOpen: boolean) {
  const [open, setOpen] = useState(initiallyOpen);
  const [openings, setOpenings] = useState(0);
  const [today, setToday] = useState(() => localDay(new Date()));
  return {
    open,
    openings,
    today,
    show: () => {
      setToday(localDay(new Date()));
      setOpenings((count) => count + 1);
      setOpen(true);
    },
    hide: () => setOpen(false),
  };
}

/**
 * The label, a box like a Select's that opens the calendar, and the description or the error
 * under it.
 *
 * @param shown The chosen day or range as text, or undefined for the placeholder.
 */
export function DateField({
  label,
  shown,
  placeholder,
  description,
  error,
  disabled,
  open,
  onOpen,
}: {
  label: string;
  shown: string | undefined;
  placeholder: string | undefined;
  description: string | undefined;
  error: string | undefined;
  disabled: boolean;
  open: boolean;
  onOpen: () => void;
}) {
  const styles = useStyles();
  const colors = useColors();
  const text = shown ?? placeholder;
  // While its calendar is open the field is the one in use, and is outlined as a TextField is
  // while it has focus.
  const outline = fieldOutline(useTheme(), colors, open, error !== undefined);
  return (
    <>
      <Text variant="label" tone={disabled ? "secondary" : "primary"}>
        {label}
      </Text>
      <Pressable
        role="button"
        // The day comes first: it is what changes, and what a person listens for.
        aria-label={fieldName(label, text)}
        // React Native has no ARIA prop for a hint.
        accessibilityHint={error ?? description}
        aria-disabled={disabled}
        aria-expanded={open}
        disabled={disabled}
        onPress={onOpen}
        style={[
          styles.box,
          {
            borderWidth: outline.width,
            borderColor: outline.color,
            backgroundColor: disabled ? colors.backgroundDisabled : colors.fieldBackground,
            paddingHorizontal: outline.edge,
          },
        ]}
      >
        <Text
          tone="inherit"
          numberOfLines={1}
          style={[
            styles.value,
            {
              color:
                shown === undefined
                  ? colors.fieldPlaceholder
                  : disabled
                    ? colors.textDisabled
                    : colors.fieldText,
            },
          ]}
        >
          {text}
        </Text>
        <Icon name="calendar" size="sm" color={colors.fieldPlaceholder} />
      </Pressable>
      <FieldMessage error={error} description={description} />
    </>
  );
}

/** How tall a month's heading is, so that a list of months can know where each one starts. */
export function headingHeight(fontScale: number, typography: Theme["typography"]): number {
  return Math.ceil(typography.bodyStrong.lineHeight * fontScale);
}

/** A month's name over its days. */
export function MonthHeading({ title, live = false }: { title: string; live?: boolean }) {
  const styles = useStyles();
  const { typography } = useTheme();
  const colors = useColors();
  const { fontScale } = useWindowDimensions();
  return (
    <View
      // Said when it changes, so that a screen reader hears which month the buttons showed.
      aria-live={live ? "polite" : undefined}
      style={[styles.heading, { height: headingHeight(fontScale, typography) }]}
    >
      <Text
        variant="body-strong"
        tone="inherit"
        heading
        numberOfLines={1}
        style={[styles.headingText, { color: colors.datePickerHeading }]}
      >
        {title}
      </Text>
    </View>
  );
}

/** The initials of the days of the week over the columns, each `cell` wide. */
export function WeekdayRow({ initials, cell }: { initials: string[]; cell: number }) {
  const styles = useStyles();
  const colors = useColors();
  return (
    // Every day's name says its weekday, so a screen reader skips the initials.
    <View style={styles.weekdays} importantForAccessibility="no-hide-descendants" aria-hidden>
      {initials.map((initial, column) => (
        <Text
          // By place: two initials can be the same letter.
          key={column}
          variant="footnote"
          tone="inherit"
          numberOfLines={1}
          style={[styles.weekday, { width: cell, color: colors.datePickerWeekday }]}
        >
          {initial}
        </Text>
      ))}
    </View>
  );
}

/** How tall `MonthGrid` draws a month of `rows` weeks. */
export const gridHeight = (rows: number, day: number) => rows * day;

/**
 * The days of `month` in rows of a week, each `cell` wide, as a grid named by the month. Both
 * pickers draw their days with it: DatePicker's one month and each month of the range's list.
 *
 * @param marks How each day is drawn: chosen, an end of a range, in its band.
 * @param choosable Whether a press on a day between `min` and `max` does anything.
 * @param dayName A day's name for a screen reader, from its marks and its name in full.
 */
export function MonthGrid({
  month,
  cell,
  names,
  today,
  min,
  max,
  marks,
  choosable = () => true,
  dayName = (_, name) => name,
  onPress,
}: {
  month: IsoMonth;
  cell: number;
  names: CalendarNames;
  today: IsoDate;
  min: IsoDate | undefined;
  max: IsoDate | undefined;
  marks: (day: IsoDate) => DayMarks;
  choosable?: (day: IsoDate) => boolean;
  dayName?: (marks: DayMarks, name: string) => string;
  onPress: (day: IsoDate) => void;
}) {
  const styles = useStyles();
  const dayHeight = useControl().calendarDay;
  const weeks = monthWeeks(month, names.firstDay);
  return (
    <View role="grid" aria-label={names.month(month)}>
      {weeks.map((week) => (
        <View key={week.find((day) => day !== null)} role="row" style={styles.week}>
          {week.map((day, column) => {
            // An empty cell has only its place to tell it apart.
            if (day === null)
              return <View key={column} style={{ width: cell, height: dayHeight }} />;
            const dayMarks = marks(day);
            const reachable = inRange(day, min, max);
            return (
              <Day
                key={day}
                day={day}
                name={dayName(dayMarks, names.day(day))}
                width={cell}
                marks={dayMarks}
                today={day === today}
                reachable={reachable}
                choosable={reachable && choosable(day)}
                onPress={() => onPress(day)}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

/**
 * A day of the calendar: its number on a circle that marks it chosen or today, over its piece of
 * a range's band.
 *
 * @param reachable False for a day outside `min` and `max`, which is shown and cannot be chosen.
 * @param choosable False also for a day a range's length does not allow as its end.
 */
function Day({
  day,
  name,
  width,
  marks,
  today,
  reachable,
  choosable,
  onPress,
}: {
  day: IsoDate;
  name: string;
  width: number;
  marks: DayMarks;
  today: boolean;
  reachable: boolean;
  choosable: boolean;
  onPress: () => void;
}) {
  const styles = useStyles();
  const { border, space } = useTheme();
  // A day's square, unless seven of them are wider than the room.
  const DAY = useControl().calendarDay;
  const colors = useColors();
  // A range's start stays a filled circle while it waits for its end, though pressing it again
  // does nothing when the range has to be longer.
  const end = (marks.start || marks.end) && reachable;
  const inBand = marks.band !== undefined && !end && choosable;
  const side = Math.min(width, DAY);
  const circle = side - space["0_5"] * 2;
  const text = end
    ? colors.datePickerSelectedText
    : !choosable
      ? colors.datePickerDisabledText
      : today
        ? colors.datePickerTodayText
        : inBand
          ? colors.datePickerRangeText
          : colors.datePickerDayText;
  return (
    <Pressable
      role="button"
      aria-label={name}
      aria-selected={isSelected(marks)}
      aria-disabled={!choosable}
      disabled={!choosable}
      onPress={onPress}
      style={[styles.day, { width, height: DAY }]}
    >
      {({ pressed }) => {
        const fill = end
          ? pressed
            ? colors.datePickerSelectedBackgroundPressed
            : colors.datePickerSelectedBackground
          : !pressed
            ? undefined
            : inBand
              ? colors.datePickerRangeBackgroundPressed
              : colors.datePickerDayBackgroundPressed;
        return (
          <>
            {marks.band && (
              <View
                style={[
                  styles.band,
                  bandShape(marks.band, side),
                  {
                    top: (DAY - side) / 2,
                    height: side,
                    backgroundColor: colors.datePickerRangeBackground,
                  },
                ]}
              />
            )}
            <View
              // Android draws a view that takes a fill after it was drawn without one as a square,
              // losing its corners; a new view for the fill keeps it a circle. It takes no
              // touches (styles.circle), so a press goes on while the view under it is replaced.
              key={fill === undefined ? "clear" : "filled"}
              style={[
                styles.circle,
                {
                  width: circle,
                  height: circle,
                  backgroundColor: fill,
                },
                today &&
                  !end && {
                    borderWidth: border.width.thin,
                    borderColor: colors.datePickerTodayBorder,
                  },
              ]}
            >
              <Text
                // Today is bolder as well as ringed, so that it is not told by color alone.
                variant={today ? "body-strong" : "body"}
                tone="inherit"
                style={{ color: text }}
              >
                {Number(day.slice(8))}
              </Text>
            </View>
          </>
        );
      }}
    </Pressable>
  );
}

/**
 * Where a day's piece of the band lies: from its middle where an end's circle covers it, or from
 * its edge, rounded where a week's row ends it. Start and end follow the layout's direction.
 */
function bandShape(band: NonNullable<DayMarks["band"]>, side: number) {
  const round = side / 2;
  return {
    start: band.leading === "middle" ? "50%" : 0,
    end: band.trailing === "middle" ? "50%" : 0,
    borderTopStartRadius: band.leading === "round" ? round : 0,
    borderBottomStartRadius: band.leading === "round" ? round : 0,
    borderTopEndRadius: band.trailing === "round" ? round : 0,
    borderBottomEndRadius: band.trailing === "round" ? round : 0,
  } as const;
}

const useStyles = themed(({ radius, size, space }) =>
  StyleSheet.create({
    // The outline is drawn inside this height, so the box is as tall as a TextField's whatever
    // its state.
    box: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[2],
      minHeight: size.touch.controlMd,
      borderRadius: radius.md,
    },
    value: {
      flex: 1,
    },
    heading: {
      justifyContent: "center",
    },
    headingText: {
      textAlign: "center",
    },
    weekdays: {
      flexDirection: "row",
    },
    weekday: {
      paddingVertical: space[1],
      textAlign: "center",
    },
    week: {
      flexDirection: "row",
    },
    day: {
      alignItems: "center",
      justifyContent: "center",
    },
    band: {
      position: "absolute",
      pointerEvents: "none",
    },
    circle: {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.full,
      // The day's Pressable is what is touched, whatever its circle is.
      pointerEvents: "none",
    },
  }),
);
