import { Animated, Pressable, type StyleProp, StyleSheet, type ViewStyle } from "react-native";
import { useSpring } from "./motion.ts";
// The text of the component's own parts takes nothing from an app's `Defaults`.
import { PartText as Text } from "./Text.tsx";
import { themed, useColors, useControl, useTheme } from "./theme.ts";

export type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Shown beside the switch. Pressing it toggles too. */
  label?: string;
  /** Names the switch for a screen reader when there is no visible label. */
  accessibilityLabel?: string;
  disabled?: boolean;
  /** Put on the component's root view, after its own style. */
  style?: StyleProp<ViewStyle>;
};

/**
 * Turns a setting on or off, and takes effect at once. For a choice that is applied later,
 * with a form, use a Checkbox.
 */
export function Switch({
  checked,
  onChange,
  label,
  accessibilityLabel,
  disabled = false,
  style,
}: SwitchProps) {
  const styles = useStyles();
  const { motion } = useTheme();
  const control = useControl();
  const colors = useColors();
  // The thumb settles on a spring, or jumps when the person asked for less motion.
  const position = useSpring(checked ? 1 : 0, motion.spring.fast);

  const track = disabled
    ? colors.switchDisabledTrack
    : checked
      ? colors.switchTrackOn
      : colors.switchTrack;
  // The track is shorter than the smallest target, so the press area reaches past it.
  const slop = Math.max(0, (control.targetMin - control.switchHeight) / 2);

  return (
    <Pressable
      role="switch"
      aria-label={label ?? accessibilityLabel}
      aria-checked={checked}
      aria-disabled={disabled}
      disabled={disabled}
      hitSlop={slop}
      onPress={() => onChange(!checked)}
      style={[styles.row, style]}
    >
      <Animated.View style={[styles.track, { backgroundColor: track }]}>
        <Animated.View
          style={[
            styles.thumb,
            {
              backgroundColor: disabled ? colors.switchDisabledThumb : colors.switchThumb,
              transform: [
                {
                  translateX: position.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, control.switchWidth - control.switchHeight],
                  }),
                },
              ],
            },
          ]}
        />
      </Animated.View>
      {label && <Text tone={disabled ? "secondary" : "primary"}>{label}</Text>}
    </Pressable>
  );
}

const useStyles = themed(({ radius, space, size }) => {
  const control = size.touch;
  // The gap between the thumb and the edge of the track.
  const inset = space["0_5"];
  const thumb = control.switchHeight - inset * 2;
  return StyleSheet.create({
    row: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: space[2],
    },
    track: {
      width: control.switchWidth,
      height: control.switchHeight,
      padding: inset,
      borderRadius: radius.full,
    },
    thumb: {
      width: thumb,
      height: thumb,
      borderRadius: radius.full,
    },
  });
});
