import { Pressable, type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
// The text of the component's own parts takes nothing from an app's `Defaults`.
import { PartText as Text } from "./Text.tsx";
import { themed, useColors, useControl, useTheme } from "./theme.ts";

export type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Shown beside the box. Pressing it toggles too. */
  label?: string;
  /** Names the checkbox for a screen reader when there is no visible label. */
  accessibilityLabel?: string;
  disabled?: boolean;
  /** Put on the component's root view, after its own style. */
  style?: StyleProp<ViewStyle>;
};

/** A choice that is applied later, with the form it belongs to. */
export function Checkbox({
  checked,
  onChange,
  label,
  accessibilityLabel,
  disabled = false,
  style,
}: CheckboxProps) {
  const styles = useStyles();
  const { border } = useTheme();
  const control = useControl();
  const colors = useColors();
  const fill = disabled
    ? colors.checkboxDisabledBackground
    : checked
      ? colors.checkboxBackgroundChecked
      : "transparent";
  const mark = disabled ? colors.checkboxDisabledMark : colors.checkboxMark;
  const slop = Math.max(0, (control.targetMin - control.checkbox) / 2);

  return (
    <Pressable
      role="checkbox"
      aria-label={label ?? accessibilityLabel}
      aria-checked={checked}
      aria-disabled={disabled}
      disabled={disabled}
      hitSlop={slop}
      onPress={() => onChange(!checked)}
      style={[styles.row, style]}
    >
      <View
        style={[
          styles.box,
          {
            backgroundColor: fill,
            // The outline is what makes an empty box visible; a filled one does not need it.
            borderWidth: checked || disabled ? 0 : border.width.thick,
            borderColor: colors.checkboxBorder,
          },
        ]}
      >
        {checked && <View style={[styles.mark, { borderColor: mark }]} />}
      </View>
      {label && <Text tone={disabled ? "secondary" : "primary"}>{label}</Text>}
    </Pressable>
  );
}

const useStyles = themed(({ radius, space, size }) => {
  const control = size.touch;
  return StyleSheet.create({
    row: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: space[2],
    },
    box: {
      width: control.checkbox,
      height: control.checkbox,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.sm,
    },
    // A check mark is two sides of a rectangle, turned 45 degrees.
    mark: {
      width: control.checkbox * 0.3,
      height: control.checkbox * 0.55,
      marginTop: -control.checkbox * 0.1,
      borderRightWidth: 2,
      borderBottomWidth: 2,
      transform: [{ rotate: "45deg" }],
    },
  });
});
