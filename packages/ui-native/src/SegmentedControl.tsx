import { border, radius, shadow, space, typography } from "@acme/tokens";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CONTROL_HEIGHT, useColors } from "./theme.ts";

const INSET = space["0_5"];

export type SegmentedControlProps<Value extends string> = {
  options: readonly { value: Value; label: string }[];
  value: Value;
  onChange: (value: Value) => void;
  /** Says what is being chosen, for a screen reader. */
  accessibilityLabel: string;
  /** Stretches to the width of its container. */
  fullWidth?: boolean;
};

/**
 * A choice between a few views or modes, all visible at once. The selected segment is outlined
 * as well as filled, so the choice does not depend on telling two greys apart.
 */
export function SegmentedControl<Value extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  fullWidth = false,
}: SegmentedControlProps<Value>) {
  const colors = useColors();
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.track,
        { backgroundColor: colors.segmentedTrack },
        fullWidth ? styles.fullWidth : styles.hug,
      ]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[
              styles.segment,
              fullWidth && styles.grow,
              selected && [
                styles.selected,
                {
                  backgroundColor: colors.segmentedSelectedBackground,
                  borderColor: colors.segmentedSelectedBorder,
                },
              ],
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                typography.label,
                { color: selected ? colors.segmentedSelectedText : colors.segmentedText },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    height: CONTROL_HEIGHT.md,
    padding: INSET,
    borderRadius: radius.md,
  },
  hug: { alignSelf: "flex-start" },
  fullWidth: { alignSelf: "stretch" },
  segment: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space[4],
    // Present on every segment, and transparent until selected, so selecting does not move text.
    borderWidth: border.width.thin,
    borderColor: "transparent",
    borderRadius: radius.md - INSET,
  },
  // Raised: a faint shadow under the hairline sets the selected segment apart from the track.
  selected: {
    shadowColor: shadow.subtle.color,
    shadowOffset: { width: shadow.subtle.offsetX, height: shadow.subtle.offsetY },
    shadowRadius: shadow.subtle.blur,
    shadowOpacity: 1,
    elevation: 1,
  },
  grow: { flex: 1 },
});
