import { radius, space } from "@acme/tokens";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { fieldName, formatDay, type IsoDate, localDay } from "./datePicker.ts";
// No extension, so that Metro takes DatePickerCalendar.ios.tsx or DatePickerCalendar.android.tsx
// for the platform it bundles. A bundler for the web takes DatePickerCalendar.tsx, which loads
// no native view.
import { DatePickerCalendar } from "./DatePickerCalendar";
import { Icon } from "./Icon.tsx";
import { Text } from "./Text.tsx";
import { FieldMessage, fieldOutline } from "./TextField.tsx";
import { CONTROL_HEIGHT, useColors } from "./theme.ts";

export type { IsoDate };

export type DatePickerProps = {
  /** Always visible, like a TextField's. On iOS it is also the title of the sheet. */
  label: string;
  /** The chosen day, as `YYYY-MM-DD`. Leave it out while none is chosen. */
  value?: IsoDate | undefined;
  /** Called with the day the person chooses. */
  onChange: (value: IsoDate) => void;
  /** The first day that can be chosen. */
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
  /**
   * The button under the calendar that closes the sheet on iOS, where a day is chosen as soon
   * as it is pressed. Android's dialog has its own buttons, in the system's language.
   */
  doneLabel?: string;
  /**
   * Taken so that a screen written for the other clients compiles, and ignored: the system's
   * calendar names its own buttons to the months before and after, in the device's language.
   */
  previousLabel?: string;
  /** Ignored, as `previousLabel` is. */
  nextLabel?: string;
  /** Starts with the calendar open, for a preview or a screenshot. */
  defaultOpen?: boolean;
};

/**
 * A field for choosing one day. Closed, it looks like a Select, with the day in the locale's
 * medium form. Pressed, it shows the system's calendar through Expo UI, which every other
 * component leaves alone: Material 3's date dialog on Android, in the `date-picker` colors, and
 * the iOS calendar in a bottom sheet titled with the label, tinted with the accent. The calendar
 * follows the device's language, region and calendar, so the names of the months, the first
 * day of the week and the buttons to other months are the system's.
 *
 * On Android, OK chooses the day and closes the dialog, and Cancel, Back or a tap outside
 * closes it without choosing. On iOS a press on a day chooses it at once and the sheet stays
 * for another; Done, a drag down or a tap outside closes it. A drag that starts on the calendar
 * stays the calendar's, so the sheet is dragged by its handle, its title or the space around.
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
  doneLabel = "Done",
  defaultOpen = false,
}: DatePickerProps) {
  const colors = useColors();
  const [open, setOpen] = useState(defaultOpen && !disabled);
  // Read when the calendar opens rather than while drawing: a screen can stay up past midnight.
  const [today, setToday] = useState(() => localDay(new Date()));
  const shown = value === undefined ? placeholder : formatDay(value);
  // While its calendar is open the field is the one in use, and is outlined as a TextField is
  // while it has focus.
  const outline = fieldOutline(colors, open, error !== undefined);

  return (
    <View style={styles.field}>
      <Text variant="label" tone={disabled ? "secondary" : "primary"}>
        {label}
      </Text>
      <Pressable
        role="button"
        // The day comes first: it is what changes, and what a person listens for.
        aria-label={fieldName(label, shown)}
        // React Native has no ARIA prop for a hint.
        accessibilityHint={error ?? description}
        aria-disabled={disabled}
        aria-expanded={open}
        disabled={disabled}
        onPress={() => {
          setToday(localDay(new Date()));
          setOpen(true);
        }}
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
                value === undefined
                  ? colors.fieldPlaceholder
                  : disabled
                    ? colors.textDisabled
                    : colors.fieldText,
            },
          ]}
        >
          {shown}
        </Text>
        <Icon name="calendar" size="sm" color={colors.fieldPlaceholder} />
      </Pressable>
      <FieldMessage error={error} description={description} />
      <DatePickerCalendar
        open={open}
        label={label}
        value={value}
        min={min}
        max={max}
        today={today}
        doneLabel={doneLabel}
        onChange={onChange}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    alignSelf: "stretch",
    gap: space[1],
  },
  // The outline is drawn inside this height, so the box is as tall as a TextField's whatever
  // its state.
  box: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[2],
    minHeight: CONTROL_HEIGHT.md,
    borderRadius: radius.md,
  },
  value: {
    flex: 1,
  },
});
