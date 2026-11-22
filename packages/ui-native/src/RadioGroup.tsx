import {
  Pressable,
  type StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from "react-native";
// The text of the component's own parts takes nothing from an app's `Defaults`.
import { PartText as Text } from "./Text.tsx";
import { FieldMessage } from "./TextField.tsx";
import { themed, useColors, useControl, useTheme } from "./theme.ts";

export type RadioOption<Value extends string> = {
  value: Value;
  label: string;
  /** A line under the label that says more about the option. */
  description?: string;
};

export type RadioGroupProps<Value extends string> = {
  /** The legend: always visible, above the options, and the group's name for a screen reader. */
  label: string;
  options: readonly RadioOption<Value>[];
  /** The chosen option, or none. */
  value?: Value | undefined;
  onChange: (value: Value) => void;
  /** Turns off the whole group. */
  disabled?: boolean;
  /** What is wrong and how to fix it, under the options. Clear it when the value changes. */
  error?: string | undefined;
  /** Put on the component's root view, after its own style. */
  style?: StyleProp<ViewStyle>;
};

/**
 * One choice among a few, applied later with the form it belongs to, like a Checkbox. For a
 * choice of two to four that takes effect at once, a SegmentedControl is the usual pick. The
 * whole row of an option is pressable, and the chosen one has a dot, not only a color.
 */
export function RadioGroup<Value extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
  error,
  style,
}: RadioGroupProps<Value>) {
  const styles = useStyles();
  const { border, typography } = useTheme();
  const control = useControl();
  const colors = useColors();
  const { fontScale } = useWindowDimensions();
  // The circle sits on the label's first line, which grows with the system's text size.
  const lead = Math.max(0, (typography.body.lineHeight * fontScale - control.radio) / 2);
  const labelColor = disabled ? colors.textDisabled : colors.textPrimary;
  const descriptionColor = disabled ? colors.textDisabled : colors.textSecondary;

  return (
    <View role="radiogroup" aria-label={label} style={[styles.group, style]}>
      <Text variant="label" tone={disabled ? "secondary" : "primary"}>
        {label}
      </Text>
      <View style={styles.options}>
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <Pressable
              key={option.value}
              role="radio"
              aria-label={
                option.description ? `${option.label}, ${option.description}` : option.label
              }
              aria-checked={checked}
              aria-disabled={disabled}
              disabled={disabled}
              onPress={() => {
                if (!checked) onChange(option.value);
              }}
              style={styles.option}
            >
              <View style={styles.row}>
                <View
                  style={[
                    styles.circle,
                    {
                      marginTop: lead,
                      backgroundColor: disabled ? colors.radioDisabledBackground : "transparent",
                      // As on a Checkbox, the fill is what shows a disabled circle. The outline
                      // is drawn inside the circle, so a thicker one does not resize it.
                      borderWidth: disabled ? 0 : checked ? border.width.thick : border.width.thin,
                      borderColor: checked ? colors.radioBorderChecked : colors.radioBorder,
                    },
                  ]}
                >
                  {checked && (
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: disabled ? colors.radioDisabledDot : colors.radioDot },
                      ]}
                    />
                  )}
                </View>
                <View style={styles.text}>
                  <Text tone="inherit" style={{ color: labelColor }}>
                    {option.label}
                  </Text>
                  {option.description && (
                    <Text variant="detail" tone="inherit" style={{ color: descriptionColor }}>
                      {option.description}
                    </Text>
                  )}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
      <FieldMessage error={error} />
    </View>
  );
}

const useStyles = themed(({ radius, space, size }) => {
  const control = size.touch;
  return StyleSheet.create({
    group: {
      alignSelf: "stretch",
      gap: space[1],
    },
    options: {
      gap: space[2],
    },
    // The whole row is the press area, at least as tall as the smallest target, with what it
    // shows centered in that height.
    option: {
      minHeight: control.targetMin,
      justifyContent: "center",
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: space[2],
    },
    circle: {
      width: control.radio,
      height: control.radio,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.full,
    },
    dot: {
      width: control.radio / 2,
      height: control.radio / 2,
      borderRadius: radius.full,
    },
    text: {
      flex: 1,
      gap: space["0_5"],
    },
  });
});
