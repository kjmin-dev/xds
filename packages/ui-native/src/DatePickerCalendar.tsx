import { useEffect } from "react";
import type { DatePickerCalendarProps } from "./datePicker.ts";

/**
 * The calendar where there is no system calendar to show: neither iOS nor Android, which each
 * have a file of their own beside this one. That is React Native in a browser, through
 * react-native-web, where Expo UI's native views do not exist and must not be loaded. It shows
 * nothing, so the field closes again at once rather than stay marked as open.
 */
export function DatePickerCalendar({ open, onClose }: DatePickerCalendarProps) {
  useEffect(() => {
    if (open) onClose();
  }, [open, onClose]);
  return null;
}
