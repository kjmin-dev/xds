import { border, radius, shadow, space } from "@acme/tokens";
import type { ReactNode } from "react";
import { Pressable, type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { Text } from "./Text.tsx";
import { useColors } from "./theme.ts";

export type CardProps = {
  title?: string;
  description?: string;
  /** A picture or a video at the top of the card. It runs to the card's edges. */
  media?: ReactNode;
  /** No padding and no gaps: for a card that holds a list, whose rows run edge to edge. */
  flush?: boolean;
  /**
   * The card that is the current choice. It is outlined heavier, in the accent color, and the
   * card stays the size it was. A pressable card also says so to a screen reader.
   */
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
} & (
  | {
      /** Controls across from the title. */
      actions?: ReactNode;
      onPress?: never;
    }
  | {
      /**
       * Makes the whole card one button. It takes no `actions` then: a button does not hold
       * other buttons.
       */
      onPress: () => void;
      actions?: never;
    }
);

/**
 * A surface that groups related content. A hairline outline and a trace of shadow lift it off
 * the page; in dark mode, where shadows barely show, the lighter fill does that. `title` is a
 * heading; `actions` sit across from it.
 */
export function Card({
  title,
  description,
  media,
  actions,
  flush = false,
  selected,
  onPress,
  style,
  children,
}: CardProps) {
  const colors = useColors();
  const header =
    title || actions ? (
      <View style={styles.header}>
        <View style={styles.titles}>
          {title && (
            <Text variant="heading" heading>
              {title}
            </Text>
          )}
          {description && (
            <Text variant="detail" tone="secondary">
              {description}
            </Text>
          )}
        </View>
        {actions}
      </View>
    ) : null;
  const content = (
    <>
      {/* The clips are on inner views: on iOS a view that clips its content cannot also cast
          a shadow. A flush card clips its rows, and the picture with them, to all four corners;
          a padded one has only the picture to clip, to the top two. */}
      {flush ? (
        <View style={styles.clip}>
          {media}
          {header}
          {children}
        </View>
      ) : (
        <>
          {media && <View style={styles.media}>{media}</View>}
          <View style={styles.padded}>
            {header}
            {children}
          </View>
        </>
      )}
      {/* Drawn over the hairline and the edge of the content, not in place of the hairline:
          a wider border would push the content in and make the card larger. */}
      {selected && (
        <View
          pointerEvents="none"
          style={[styles.outline, { borderColor: colors.cardBorderSelected }]}
        />
      )}
    </>
  );
  const frame = [
    styles.card,
    {
      backgroundColor: colors.backgroundSurface,
      borderColor: selected ? colors.cardBorderSelected : colors.borderDefault,
    },
  ];
  if (!onPress) return <View style={[frame, style]}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      {...(selected === undefined ? {} : { accessibilityState: { selected } })}
      onPress={onPress}
      style={({ pressed }) => [
        frame,
        pressed && { backgroundColor: colors.cardBackgroundPressed },
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

/** A line between groups of content. */
export function Divider() {
  const colors = useColors();
  return <View style={[styles.divider, { backgroundColor: colors.borderDefault }]} />;
}

const INNER_RADIUS = radius.lg - border.width.thin;

const styles = StyleSheet.create({
  card: {
    alignSelf: "stretch",
    borderWidth: border.width.thin,
    borderRadius: radius.lg,
    // The token color carries the alpha.
    shadowColor: shadow.subtle.color,
    shadowOffset: { width: shadow.subtle.offsetX, height: shadow.subtle.offsetY },
    shadowRadius: shadow.subtle.blur,
    shadowOpacity: 1,
  },
  padded: {
    gap: space[4],
    padding: space[4],
  },
  clip: {
    overflow: "hidden",
    borderRadius: INNER_RADIUS,
  },
  media: {
    overflow: "hidden",
    borderTopStartRadius: INNER_RADIUS,
    borderTopEndRadius: INNER_RADIUS,
  },
  // Absolute offsets are measured from inside the hairline, so stepping out by its width
  // lays the outline on the card's own edge.
  outline: {
    position: "absolute",
    top: -border.width.thin,
    bottom: -border.width.thin,
    start: -border.width.thin,
    end: -border.width.thin,
    borderWidth: border.width.thick,
    borderRadius: radius.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: space[3],
  },
  titles: {
    flex: 1,
    gap: space["0_5"],
  },
  divider: {
    alignSelf: "stretch",
    height: border.width.thin,
  },
});
