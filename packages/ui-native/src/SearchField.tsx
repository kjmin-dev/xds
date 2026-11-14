import { border, radius, space, typography } from "@acme/tokens";
import { type ComponentRef, useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Icon } from "./Icon.tsx";
import { CONTROL_HEIGHT, control, useColors } from "./theme.ts";

export type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  /** Called when the person presses the keyboard's search key. */
  onSubmit?: () => void;
  /** Names the field for a screen reader. It is not shown: the magnifier says what this is. */
  label: string;
  placeholder?: string;
  disabled?: boolean;
  /** What a screen reader says for the button that empties the field. */
  clearLabel?: string;
};

/**
 * A text field for a query: TextField's box as a pill, with a magnifier in front and, while
 * there is a value, a button at the end that empties it.
 *
 * It draws the box itself. TextField always shows its label and has square corners, and a
 * search field has neither.
 */
export function SearchField({
  value,
  onChange,
  onSubmit,
  label,
  placeholder,
  disabled = false,
  clearLabel = "Clear",
}: SearchFieldProps) {
  const colors = useColors();
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const [focused, setFocused] = useState(false);
  // As in TextField: focus thickens the outline as well as recoloring it, and the padding
  // shrinks by the same amount, so nothing inside moves.
  const outline = focused ? border.width.thick : border.width.thin;
  const edge = space[3] - (outline - border.width.thin);
  const inner = CONTROL_HEIGHT.md - 2 * outline;
  const clearable = value !== "" && !disabled;

  return (
    <View
      style={[
        styles.box,
        {
          borderWidth: outline,
          borderColor: focused ? colors.fieldBorderFocus : colors.fieldBorder,
          backgroundColor: disabled ? colors.backgroundDisabled : colors.fieldBackground,
          paddingStart: edge,
          // The clear button brings its own padding, so a touch at the very end lands on it.
          paddingEnd: clearable ? 0 : edge,
        },
      ]}
    >
      <Icon name="search" size="sm" color={colors.fieldPlaceholder} />
      <TextInput
        ref={input}
        accessibilityLabel={label}
        editable={!disabled}
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...(onSubmit ? { onSubmitEditing: onSubmit } : {})}
        inputMode="search"
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={placeholder}
        placeholderTextColor={colors.fieldPlaceholder}
        style={[
          styles.input,
          { minHeight: inner, color: disabled ? colors.textDisabled : colors.fieldText },
        ]}
      />
      {clearable && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={clearLabel}
          // The outline is not part of the button; the press area takes it back.
          hitSlop={{ top: outline, bottom: outline, right: outline, left: outline }}
          onPress={() => {
            onChange("");
            // The person is still searching: the keyboard stays.
            input.current?.focus();
          }}
          style={[styles.clear, { height: inner, paddingEnd: edge }]}
        >
          {({ pressed }) => (
            <Icon
              name="circle-x"
              size="sm"
              color={pressed ? colors.fieldText : colors.fieldPlaceholder}
            />
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.full,
  },
  input: {
    flex: 1,
    paddingHorizontal: space[2],
    // No line height: iOS centers single-line input text on its own, and a line height
    // pushes it off center.
    fontSize: typography.body.fontSize,
  },
  // As wide as the smallest target, with the icon at the end of it, as far from the outline as
  // the magnifier is at the other end.
  clear: {
    width: control.targetMin,
    alignItems: "flex-end",
    justifyContent: "center",
  },
});
