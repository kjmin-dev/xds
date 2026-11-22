import { Pressable, type StyleProp, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { themed, useColors, useTheme } from "./theme.ts";

export type SegmentedControlProps<Value extends string> = {
  options: readonly { value: Value; label: string }[];
  value: Value;
  onChange: (value: Value) => void;
  /** Says what is being chosen, for a screen reader. */
  accessibilityLabel: string;
  /** Stretches to the width of its container. */
  fullWidth?: boolean;
  /** Put on the component's root view, after its own style. */
  style?: StyleProp<ViewStyle>;
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
  style,
}: SegmentedControlProps<Value>) {
  const styles = useStyles();
  const { typography } = useTheme();
  const colors = useColors();
  return (
    <View
      role="tablist"
      aria-label={accessibilityLabel}
      style={[
        [
          styles.track,
          { backgroundColor: colors.segmentedTrack },
          fullWidth ? styles.fullWidth : styles.hug,
        ],
        style,
      ]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            role="tab"
            aria-selected={selected}
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

const useStyles = themed(({ border, radius, shadow, size, space }) =>
  StyleSheet.create({
    track: {
      flexDirection: "row",
      height: size.touch.controlMd,
      padding: space["0_5"],
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
      borderRadius: radius.md - space["0_5"],
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
  }),
);
