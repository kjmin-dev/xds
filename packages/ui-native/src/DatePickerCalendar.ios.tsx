import { DatePicker as SystemDatePicker, Host } from "@expo/ui/swift-ui";
import { datePickerStyle, tint } from "@expo/ui/swift-ui/modifiers";
import { BottomSheet } from "./BottomSheet.tsx";
import { Button } from "./Button.tsx";
import {
  type DatePickerCalendarProps,
  localDay,
  localNoon,
  localRange,
  openingDay,
} from "./datePicker.ts";
import { useColors, useScheme } from "./theme.ts";

/**
 * iOS: the system's calendar (SwiftUI's graphical DatePicker, which is UIKit's inline one) in
 * our bottom sheet. The sheet, its title and the Done button are drawn from the tokens; of the
 * calendar only the tint is ours.
 */
export function DatePickerCalendar({
  open,
  label,
  value,
  min,
  max,
  today,
  doneLabel,
  onChange,
  onClose,
}: DatePickerCalendarProps) {
  const colors = useColors();
  const scheme = useScheme();
  // The system's calendar always has a day chosen. While none is, it shows the day it opens on.
  const shown = openingDay({ value, min, max }, today);

  return (
    <BottomSheet open={open} onClose={onClose} title={label}>
      {/* As tall as the calendar, which changes with the number of weeks in the month. */}
      <Host matchContents={{ vertical: true }} colorScheme={scheme}>
        <SystemDatePicker
          // Not drawn in this style: it names the calendar for VoiceOver.
          title={label}
          selection={localNoon(shown)}
          range={localRange(min, max)}
          displayedComponents={["date"]}
          onDateChange={(date) => onChange(localDay(date))}
          modifiers={[datePickerStyle("graphical"), tint(colors.datePickerSelectedBackground)]}
        />
      </Host>
      <Button
        variant="primary"
        label={doneLabel}
        fullWidth
        onPress={() => {
          // The calendar reports a change, and a press on the day it already marks is none.
          // So Done takes that day when nothing was chosen before.
          if (value === undefined) onChange(shown);
          onClose();
        }}
      />
    </BottomSheet>
  );
}
