import { space } from "@acme/tokens";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "./Icon.tsx";
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
  /**
   * The row that is the current choice: the open conversation, the active filter. It is tinted
   * and its title is set heavier, so the choice does not rest on the tint alone.
   */
  selected?: boolean;
  /** A lower row with smaller text, for long lists and menus. */
  compact?: boolean;
};

// A compact row is lower than the smallest target, so its press area reaches past it.
const COMPACT_SLOP = Math.max(0, (control.targetMin - control.listRowCompact) / 2);

/** One line of a list or a settings screen. Separate rows with a Divider. */
export function ListRow({
  title,
  description,
  leading,
  trailing,
  chevron = false,
  onPress,
  disabled = false,
  selected = false,
  compact = false,
}: ListRowProps) {
  const colors = useColors();
  const titleVariant = compact
    ? selected
      ? "label"
      : "detail"
    : selected
      ? "body-strong"
      : "body";
  const layout = [styles.row, compact && styles.compact];
  const content = (
    <>
      {leading}
      <View
        // Without a press the row is not one element to a screen reader, so the words carry
        // the state.
        {...(selected && !onPress ? { accessible: true, accessibilityState: { selected } } : {})}
        style={styles.text}
      >
        <Text variant={titleVariant} tone={disabled ? "secondary" : "primary"}>
          {title}
        </Text>
        {description && (
          <Text variant={compact ? "footnote" : "detail"} tone="secondary">
            {description}
          </Text>
        )}
      </View>
      {trailing}
      {chevron && <Icon name="chevron-right" size="sm" color={colors.textTertiary} directional />}
    </>
  );
  if (!onPress) {
    return (
      <View style={[layout, selected && { backgroundColor: colors.listRowBackgroundSelected }]}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      {...(compact ? { hitSlop: { top: COMPACT_SLOP, bottom: COMPACT_SLOP } } : {})}
      onPress={onPress}
      style={({ pressed }) => [
        layout,
        selected
          ? {
              backgroundColor: pressed
                ? colors.listRowBackgroundSelectedHover
                : colors.listRowBackgroundSelected,
            }
          : pressed && { backgroundColor: colors.listRowBackgroundPressed },
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
  compact: {
    minHeight: control.listRowCompact,
    paddingVertical: space[1],
  },
  text: {
    flex: 1,
    gap: space["0_5"],
  },
});
