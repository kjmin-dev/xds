import { radius } from "@acme/tokens";
import { StyleSheet, View } from "react-native";
import { control, useColors } from "./theme.ts";

/**
 * How far along something is, from 0 to 1. For work of unknown length use a Spinner.
 * `label` says what is progressing; a screen reader reads it with the percentage.
 */
export function ProgressBar({ value, label }: { value: number; label: string }) {
  const colors = useColors();
  const fraction = Math.min(1, Math.max(0, value));
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(fraction * 100) }}
      style={[styles.track, { backgroundColor: colors.progressTrack }]}
    >
      <View
        style={[styles.fill, { width: `${fraction * 100}%`, backgroundColor: colors.progressFill }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    alignSelf: "stretch",
    height: control.progress,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radius.full,
  },
});
