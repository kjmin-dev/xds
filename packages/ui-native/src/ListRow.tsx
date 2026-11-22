import type { ReactNode } from "react";
import { Pressable, type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { Icon } from "./Icon.tsx";
// The text of the component's own parts takes nothing from an app's `Defaults`.
import { PartText as Text } from "./Text.tsx";
import { themed, useColors, useControl } from "./theme.ts";

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
  /** Put on the component's root view, after its own style. */
  style?: StyleProp<ViewStyle>;
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
  selected = false,
  compact = false,
  style,
}: ListRowProps) {
  const styles = useStyles();
  const control = useControl();
  // A compact row is lower than the smallest target, so its press area reaches past it.
  const compactSlop = Math.max(0, (control.targetMin - control.listRowCompact) / 2);
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
        {...(selected && !onPress ? { accessible: true, "aria-selected": selected } : {})}
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
      <View
        style={[layout, selected && { backgroundColor: colors.listRowBackgroundSelected }, style]}
      >
        {content}
      </View>
    );
  }
  return (
    <Pressable
      role="button"
      aria-disabled={disabled}
      aria-selected={selected}
      disabled={disabled}
      {...(compact ? { hitSlop: { top: compactSlop, bottom: compactSlop } } : {})}
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
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

const useStyles = themed(({ space, size }) => {
  const control = size.touch;
  return StyleSheet.create({
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
});
