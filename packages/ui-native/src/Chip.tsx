import { Pressable, type StyleProp, StyleSheet, Text, type ViewStyle } from "react-native";
import { Icon, type IconName } from "./Icon.tsx";
import { themed, useColors, useControl, useTheme } from "./theme.ts";

export type ChipProps = {
  label: string;
  /** Whether the chip's filter is on. The chip holds no state: the app decides. */
  selected?: boolean;
  onPress?: () => void;
  /** An icon before the label. A check mark takes its place while the chip is selected. */
  iconStart?: IconName;
  disabled?: boolean;
  /** Put on the component's root view, after its own style. */
  style?: StyleProp<ViewStyle>;
};

/**
 * A choice that filters what is shown. Unlike a Badge it is pressed. A selected chip is
 * outlined and carries a check mark, so the state does not depend on the tint. Several chips
 * go in a ChipBar.
 */
export function Chip({
  label,
  selected = false,
  onPress,
  iconStart,
  disabled = false,
  style,
}: ChipProps) {
  const styles = useStyles();
  const { typography } = useTheme();
  const control = useControl();
  // The chip is lower than the smallest target, so its press area reaches above and below it.
  const slop = Math.max(0, (control.targetMin - control.chip) / 2);
  const colors = useColors();
  const fill = disabled
    ? colors.chipDisabledBackground
    : selected
      ? colors.chipSelectedBackground
      : colors.chipBackground;
  const pressedFill = selected
    ? colors.chipSelectedBackgroundPressed
    : colors.chipBackgroundPressed;
  const text = disabled
    ? colors.chipDisabledText
    : selected
      ? colors.chipSelectedText
      : colors.chipText;
  const icon = selected ? "check" : iconStart;
  return (
    <Pressable
      role="button"
      aria-selected={selected}
      aria-disabled={disabled}
      disabled={disabled}
      hitSlop={{ top: slop, bottom: slop }}
      {...(onPress ? { onPress } : {})}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: pressed ? pressedFill : fill,
          borderColor: selected && !disabled ? colors.chipSelectedBorder : "transparent",
        },
        style,
      ]}
    >
      {icon && <Icon name={icon} size="sm" color={text} />}
      <Text numberOfLines={1} style={[typography.label, { color: text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const useStyles = themed(({ border, radius, space, size }) => {
  const control = size.touch;
  return StyleSheet.create({
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: space["1_5"],
      height: control.chip,
      // Present on every chip, and transparent until selected, so selecting does not resize it.
      // The padding gives up the room the outline takes.
      borderWidth: border.width.thin,
      paddingHorizontal: space[3] - border.width.thin,
      borderRadius: radius.full,
    },
  });
});
