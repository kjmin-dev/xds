import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { themed, useColors } from "./theme.ts";

/**
 * How far along something is, from 0 to 1. For work of unknown length use a Spinner.
 * `label` says what is progressing; a screen reader reads it with the percentage.
 */
export function ProgressBar({
  value,
  label,
  style,
}: {
  value: number;
  label: string /** Put on the component's root view, after its own style. */;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles();
  const colors = useColors();
  const fraction = Math.min(1, Math.max(0, value));
  return (
    <View
      accessible
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(fraction * 100)}
      style={[[styles.track, { backgroundColor: colors.progressTrack }], style]}
    >
      <View
        style={[styles.fill, { width: `${fraction * 100}%`, backgroundColor: colors.progressFill }]}
      />
    </View>
  );
}

const useStyles = themed(({ radius, size }) => {
  const control = size.touch;
  return StyleSheet.create({
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
});
