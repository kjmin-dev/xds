import { radius, space } from "@acme/tokens";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { BottomSheet } from "./BottomSheet.tsx";
import { Icon } from "./Icon.tsx";
import { MenuList, MenuRow } from "./Menu.tsx";
import { Text } from "./Text.tsx";
import { FieldMessage, fieldOutline } from "./TextField.tsx";
import { CONTROL_HEIGHT, useColors } from "./theme.ts";

export type SelectOption<Value extends string> = {
  value: Value;
  label: string;
  /** A line under the label in the list. */
  description?: string;
};

export type SelectProps<Value extends string> = {
  /** Always visible, as on a TextField. It is also the title of the sheet the options are in. */
  label: string;
  options: readonly SelectOption<Value>[];
  /** The chosen option, or none. */
  value?: Value | undefined;
  /** Called with the option the person chooses. The list closes itself. */
  onChange: (value: Value) => void;
  /** Shown in the box while nothing is chosen. */
  placeholder?: string;
  /** Help shown under the field. Replaced by `error` while there is one. */
  description?: string;
  /** What is wrong and how to fix it. Clear it when the value changes. */
  error?: string | undefined;
  disabled?: boolean;
  /** Starts with the list open, for a preview or a screenshot. */
  defaultOpen?: boolean;
};

// TalkBack says that a drop-down list opens from the field. iOS has no such trait: VoiceOver
// says it is a button, and whether it is expanded.
const ROLE = Platform.OS === "android" ? "dropdownlist" : "button";

/**
 * A field for choosing one option from a list too long to show at once. Closed it looks like a
 * TextField; pressed, its options open as the rows of a bottom sheet titled with the label, the
 * chosen one marked with a check. Choosing one calls `onChange` and closes the sheet; a tap
 * outside, a drag down or the back button closes it without choosing.
 */
export function Select<Value extends string>({
  label,
  options,
  value,
  onChange,
  placeholder,
  description,
  error,
  disabled = false,
  defaultOpen = false,
}: SelectProps<Value>) {
  const colors = useColors();
  const [open, setOpen] = useState(defaultOpen && !disabled);
  const chosen = options.find((option) => option.value === value);
  const shown = chosen?.label ?? placeholder;
  // While its list is open the field is the one in use, and is outlined as a TextField is
  // while it has focus.
  const outline = fieldOutline(colors, open, error !== undefined);

  return (
    <View style={styles.field}>
      <Text variant="label" tone={disabled ? "secondary" : "primary"}>
        {label}
      </Text>
      <Pressable
        accessibilityRole={ROLE}
        accessibilityLabel={label}
        {...(shown === undefined ? {} : { accessibilityValue: { text: shown } })}
        accessibilityHint={error ?? description}
        accessibilityState={{ disabled, expanded: open }}
        disabled={disabled}
        onPress={() => setOpen(true)}
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
              color: chosen
                ? disabled
                  ? colors.textDisabled
                  : colors.fieldText
                : colors.fieldPlaceholder,
            },
          ]}
        >
          {shown}
        </Text>
        <Icon name="chevrons-up-down" size="sm" color={colors.fieldPlaceholder} />
      </Pressable>
      <FieldMessage error={error} description={description} />
      <BottomSheet open={open} onClose={() => setOpen(false)} title={label}>
        <MenuList role="list" label={label}>
          {options.map((option) => (
            <MenuRow
              key={option.value}
              role="button"
              label={option.label}
              description={option.description}
              selected={option.value === value}
              onPress={() => {
                onChange(option.value);
                setOpen(false);
              }}
            />
          ))}
        </MenuList>
      </BottomSheet>
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
