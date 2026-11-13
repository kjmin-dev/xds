import { radius, space, typography } from "@acme/tokens";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { control, useColors } from "./theme.ts";

export type CountBadgeProps = {
  /** Nothing is drawn for zero or less. */
  count: number;
  /** The largest count shown as it is. A larger one shows as this number and a plus: "99+". */
  max?: number;
  /**
   * What a screen reader says, such as "3 unread notifications". Without it the screen reader
   * says the number as it is shown.
   */
  label?: string;
  /** What is being counted on: an icon, an avatar, a button. The badge sits on its corner. */
  children?: ReactNode;
};

/**
 * A count of things that wait: unread messages, items in a cart. Around a child it sits on the
 * child's top corner, on the far side from where reading starts; alone it is laid out in line.
 */
export function CountBadge({ count, max = 99, label, children }: CountBadgeProps) {
  const colors = useColors();
  const badge = count > 0 && (
    <View
      accessible
      accessibilityRole="text"
      {...(label ? { accessibilityLabel: label } : {})}
      style={[
        styles.badge,
        { backgroundColor: colors.badgeCountBackground },
        children !== undefined && styles.corner,
      ]}
    >
      <Text
        // The pill is as tall as the token says, so the number does not grow past it.
        allowFontScaling={false}
        numberOfLines={1}
        style={[typography.footnote, { color: colors.badgeCountText }]}
      >
        {count > max ? `${max}+` : count}
      </Text>
    </View>
  );
  if (children === undefined) return badge ? <View style={styles.frame}>{badge}</View> : null;
  return (
    <View style={styles.frame}>
      {/* As large as the child and no larger: its corner is the corner the badge sits on. */}
      <View>
        {children}
        {badge}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // A row holds its content at the content's own width, which a column would stretch, and it
  // leaves the place of the whole to the container, which `alignSelf` would overrule.
  frame: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  badge: {
    alignItems: "center",
    justifyContent: "center",
    height: control.countBadge,
    minWidth: control.countBadge,
    paddingHorizontal: space[1],
    borderRadius: radius.full,
  },
  // Corner on corner, then out by a quarter of the badge's height, up and toward the end: the
  // badge laps over the corner without hiding much of the child. `end` follows the layout
  // direction.
  corner: {
    position: "absolute",
    top: -control.countBadge / 4,
    end: -control.countBadge / 4,
  },
});
