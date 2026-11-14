import { space } from "@acme/tokens";
import type { ReactNode } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { control } from "./theme.ts";

export type ChipBarProps = {
  /** Says what the chips filter, for a screen reader. */
  label: string;
  /** The chips. Which of them are selected is the app's business: the bar holds no state. */
  children: ReactNode;
};

/** One row of chips. It scrolls sideways when the chips do not fit, and never wraps. */
export function ChipBar({ label, children }: ChipBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      role="group"
      accessibilityLabel={label}
      style={styles.bar}
      contentContainerStyle={styles.chips}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignSelf: "stretch",
    flexGrow: 0,
  },
  chips: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[2],
    // A scroll view passes on no touch that falls outside it, so the bar is as tall as the
    // smallest target and the press area of a chip stays inside it.
    minHeight: control.targetMin,
  },
});
