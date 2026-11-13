import { space } from "@acme/tokens";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "./Text.tsx";
import { control, useColors } from "./theme.ts";

export type ListRowProps = {
  title: string;
  description?: string;
  /** In front of the title: an avatar or an icon. */
  leading?: ReactNode;
  /** At the far end: a value, a badge or a switch. */
  trailing?: ReactNode;
  /** Draws a chevron at the far end, for a row that leads to another screen. */
  chevron?: boolean;
  /** Makes the whole row pressable. */
  onPress?: () => void;
  disabled?: boolean;
};

/** One line of a list or a settings screen. Separate rows with a Divider. */
export function ListRow({
  title,
  description,
  leading,
  trailing,
  chevron = false,
  onPress,
  disabled = false,
}: ListRowProps) {
  const colors = useColors();
  const content = (
    <>
      {leading}
      <View style={styles.text}>
        <Text tone={disabled ? "secondary" : "primary"}>{title}</Text>
        {description && (
          <Text variant="detail" tone="secondary">
            {description}
          </Text>
        )}
      </View>
      {trailing}
      {chevron && <View style={[styles.chevron, { borderColor: colors.textTertiary }]} />}
    </>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: colors.listRowBackgroundPressed },
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    minHeight: control.listRow,
    paddingHorizontal: space[4],
    paddingVertical: space[2],
  },
  text: {
    flex: 1,
    gap: space["0_5"],
  },
  // Two sides of a square, turned to point right.
  chevron: {
    width: 8,
    height: 8,
    marginEnd: space["0_5"],
    borderTopWidth: 2,
    borderRightWidth: 2,
    transform: [{ rotate: "45deg" }],
  },
});
