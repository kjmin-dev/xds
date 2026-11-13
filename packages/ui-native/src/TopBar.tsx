import { radius, space } from "@acme/tokens";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "./Text.tsx";
import { CONTROL_HEIGHT, control, useColors } from "./theme.ts";

export type TopBarProps = {
  title: string;
  /** Shows a back button. Leave it out on a screen that is not reached from another. */
  onBack?: () => void;
  /** What a screen reader says for the back button. */
  backLabel?: string;
  /** An action at the far end, such as a ghost button. */
  trailing?: ReactNode;
};

/**
 * The bar at the top of a screen: where you are, and the way back. It has the page's
 * background and no edge of its own, so content scrolls up to it without a line in between.
 * It does not cover the status bar; put it inside the safe area.
 */
export function TopBar({ title, onBack, backLabel = "Back", trailing }: TopBarProps) {
  const colors = useColors();
  return (
    <View style={[styles.bar, { backgroundColor: colors.topBarBackground }]}>
      {onBack && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={backLabel}
          onPress={onBack}
          // The circle is smaller than the smallest target, so the press area reaches past it.
          hitSlop={(control.targetMin - CONTROL_HEIGHT.sm) / 2}
          style={[styles.back, { backgroundColor: colors.topBarActionBackground }]}
        >
          <View style={[styles.chevron, { borderColor: colors.topBarAction }]} />
        </Pressable>
      )}
      <Text
        variant="heading"
        tone="inherit"
        heading
        numberOfLines={1}
        style={[styles.title, { color: colors.topBarText }]}
      >
        {title}
      </Text>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    height: control.bar,
    paddingHorizontal: space[4],
  },
  back: {
    width: CONTROL_HEIGHT.sm,
    height: CONTROL_HEIGHT.sm,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
  },
  // Two sides of a square, turned to point left.
  chevron: {
    width: 10,
    height: 10,
    marginLeft: 4,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: "45deg" }],
  },
  title: { flex: 1 },
});
