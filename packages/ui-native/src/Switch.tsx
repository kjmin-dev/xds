import { motion, radius, space } from "@acme/tokens";
import { Animated, Pressable, StyleSheet } from "react-native";
import { useSpring } from "./motion.ts";
import { Text } from "./Text.tsx";
import { control, useColors } from "./theme.ts";

const INSET = space["0_5"];
const THUMB = control.switchHeight - INSET * 2;
const TRAVEL = control.switchWidth - control.switchHeight;

export type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Shown beside the switch. Pressing it toggles too. */
  label?: string;
  /** Names the switch for a screen reader when there is no visible label. */
  accessibilityLabel?: string;
  disabled?: boolean;
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
}: SwitchProps) {
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
      accessibilityRole="switch"
      accessibilityLabel={label ?? accessibilityLabel}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      hitSlop={slop}
      onPress={() => onChange(!checked)}
      style={styles.row}
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
                    outputRange: [0, TRAVEL],
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

const styles = StyleSheet.create({
  row: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: space[2],
  },
  track: {
    width: control.switchWidth,
    height: control.switchHeight,
    padding: INSET,
    borderRadius: radius.full,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: radius.full,
  },
});
