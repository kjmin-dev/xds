import { DatePickerDialog, Host } from "@expo/ui/jetpack-compose";
import { StyleSheet } from "react-native";
import {
  androidInitialDay,
  type DatePickerCalendarProps,
  selectableDays,
  utcDay,
  utcMidnight,
} from "./datePicker.ts";
import { useColors, useScheme } from "./theme.ts";

/**
 * Android: Material 3's date dialog, which the system draws over the screen. It takes its
 * colors from the `date-picker` tokens; its shapes, type, title and buttons are Material's, in
 * the device's language.
 */
export function DatePickerCalendar({
  open,
  value,
  min,
  max,
  today,
  onChange,
  onClose,
}: DatePickerCalendarProps) {
  const colors = useColors();
  const scheme = useScheme();
  // The dialog is open for as long as its view is mounted.
  if (!open) return null;
  const initial = androidInitialDay({ value, min, max }, today);

  return (
    <Host colorScheme={scheme} style={styles.host}>
      <DatePickerDialog
        initialDate={initial === undefined ? null : utcMidnight(initial)}
        selectableDates={selectableDays(min, max)}
        // No typing a date in: no other client has it.
        showVariantToggle={false}
        // The OK and Cancel buttons.
        color={colors.datePickerTodayText}
        elementColors={{
          containerColor: colors.datePickerBackground,
          titleContentColor: colors.datePickerWeekday,
          headlineContentColor: colors.datePickerHeading,
          weekdayContentColor: colors.datePickerWeekday,
          subheadContentColor: colors.datePickerHeading,
          navigationContentColor: colors.datePickerHeading,
          dayContentColor: colors.datePickerDayText,
          disabledDayContentColor: colors.datePickerDisabledText,
          selectedDayContentColor: colors.datePickerSelectedText,
          selectedDayContainerColor: colors.datePickerSelectedBackground,
          todayContentColor: colors.datePickerTodayText,
          todayDateBorderColor: colors.datePickerTodayBorder,
          // The list of years behind the month's name.
          yearContentColor: colors.datePickerDayText,
          disabledYearContentColor: colors.datePickerDisabledText,
          currentYearContentColor: colors.datePickerTodayText,
          selectedYearContentColor: colors.datePickerSelectedText,
          selectedYearContainerColor: colors.datePickerSelectedBackground,
          dividerColor: colors.borderDefault,
        }}
        onDateSelected={(date) => {
          onChange(utcDay(date));
          onClose();
        }}
        onDismissRequest={onClose}
      />
    </Host>
  );
}

const styles = StyleSheet.create({
  // The dialog is a window of its own. Its host is out of the field's layout, which would
  // otherwise leave a gap for it.
  host: {
    position: "absolute",
    width: 0,
    height: 0,
  },
});
