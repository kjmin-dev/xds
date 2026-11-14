import { radius, space } from "@acme/tokens";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "./Text.tsx";
import { useColors } from "./theme.ts";
import { Thumbnail, type ThumbnailRatio } from "./Thumbnail.tsx";

export type MediaCardProps = {
  /** `vertical`: the thumbnail on top, the text under it. `horizontal`: the thumbnail at the start. */
  layout?: "vertical" | "horizontal";
  /** The thumbnail's picture, as for Thumbnail. */
  src?: string | undefined;
  /**
   * Says what the picture shows. Empty by default: the title already says what the card is, so
   * the picture is decoration.
   */
  alt?: string;
  ratio?: ThumbnailRatio | undefined;
  /** Short text on the thumbnail's corner, such as a duration. */
  badge?: string | undefined;
  /** How much was watched, from 0 to 1. */
  progress?: number | undefined;
  /** At most two lines, then cut short. */
  title: string;
  /** Short details, one line each, such as a channel name and "3 days ago". */
  meta?: readonly string[];
  /** Before the text, in the vertical layout only: an Avatar, say. */
  leading?: ReactNode;
  /**
   * At the end of the text, such as an IconButton or a Menu trigger. It stays a control of its
   * own: pressing it does not press the card.
   */
  action?: ReactNode;
  /** Makes the whole card one button, named by its title and then its details. */
  onPress?: () => void;
};

const HIDDEN = {
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants" as const,
};

/**
 * A thumbnail with its title and details: a video in a feed, an article in a list. A pressable
 * card has no surface at rest; a press tints it.
 */
export function MediaCard({
  layout = "vertical",
  src,
  alt = "",
  ratio,
  badge,
  progress,
  title,
  meta = [],
  leading,
  action,
  onPress,
}: MediaCardProps) {
  const colors = useColors();
  const horizontal = layout === "horizontal";
  const name = [title, ...meta].join(", ");
  // On a pressable card everything but the action is drawn over the card's button: touches
  // pass through it to the button, and the button alone speaks for it.
  const under = onPress !== undefined;
  const hidden = under ? HIDDEN : {};
  const through = under && styles.through;
  const none = under && styles.none;

  const content = (
    <View style={[horizontal ? styles.horizontal : styles.vertical, through]}>
      <View {...hidden} style={[horizontal && styles.side, none]}>
        <Thumbnail src={src} alt={alt} ratio={ratio} badge={badge} progress={progress} />
      </View>
      <View style={[styles.row, horizontal && styles.grow, through]}>
        {!horizontal && leading && (
          <View {...hidden} style={none}>
            {leading}
          </View>
        )}
        <View
          // Without a button to speak for the card, the text does, as one element.
          {...(under ? HIDDEN : { accessible: true, accessibilityLabel: name })}
          style={[styles.text, none]}
        >
          <Text variant="body-strong" numberOfLines={2}>
            {title}
          </Text>
          {meta.map((line, index) => (
            // Lines have no identity of their own, and two can read the same.
            <Text key={index} variant="detail" tone="secondary" numberOfLines={1}>
              {line}
            </Text>
          ))}
        </View>
        {action}
      </View>
    </View>
  );

  if (!onPress) return content;
  return (
    <View style={styles.card}>
      {/* The button lies under the content rather than around it: a screen reader takes what
          is inside a button as its name, and the action would be lost in it. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={name}
        onPress={onPress}
        style={({ pressed }) => [
          StyleSheet.absoluteFill,
          styles.surface,
          pressed && { backgroundColor: colors.cardBackgroundPressed },
        ]}
      />
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: "stretch",
    padding: space[2],
  },
  surface: {
    borderRadius: radius.lg,
  },
  // The view takes no touches itself, but what is in it may: the action.
  through: {
    pointerEvents: "box-none",
  },
  none: {
    pointerEvents: "none",
  },
  vertical: {
    alignSelf: "stretch",
    gap: space[3],
  },
  horizontal: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space[3],
  },
  side: {
    width: "40%",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space[3],
  },
  grow: {
    flex: 1,
  },
  text: {
    flex: 1,
    gap: space["0_5"],
  },
});
