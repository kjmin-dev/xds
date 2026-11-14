import { radius, space } from "@acme/tokens";
import { StyleSheet, View } from "react-native";
import { Icon, type IconName } from "./Icon.tsx";
import { Text } from "./Text.tsx";
import { type Colors, control, useColors } from "./theme.ts";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger" | "overlay";

function look(colors: Colors, tone: BadgeTone): { background: string; text: string } {
  switch (tone) {
    case "neutral":
      return { background: colors.badgeNeutralBackground, text: colors.badgeNeutralText };
    case "accent":
      return { background: colors.badgeAccentBackground, text: colors.badgeAccentText };
    case "success":
      return { background: colors.badgeSuccessBackground, text: colors.badgeSuccessText };
    case "warning":
      return { background: colors.badgeWarningBackground, text: colors.badgeWarningText };
    case "danger":
      return { background: colors.badgeDangerBackground, text: colors.badgeDangerText };
    case "overlay":
      return { background: colors.badgeOverlayBackground, text: colors.badgeOverlayText };
  }
}

/**
 * A short status or category. The words carry the meaning; the color only reinforces it. `dot`
 * adds a small mark for live states such as "connected", and `icon` a picture of what the
 * words say. The `overlay` tone is for a badge that sits on a picture.
 */
export function Badge({
  tone = "neutral",
  dot = false,
  icon,
  label,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  /** Drawn before the label, after the dot when there is one. */
  icon?: IconName;
  label: string;
}) {
  const { background, text } = look(useColors(), tone);
  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      {dot && <View style={[styles.dot, { backgroundColor: text }]} />}
      {icon && <Icon name={icon} size="xs" color={text} />}
      <Text variant="footnote" tone="inherit" numberOfLines={1} style={{ color: text }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: space["1_5"],
    minHeight: control.badge,
    paddingHorizontal: space["2_5"],
    borderRadius: radius.full,
  },
  dot: {
    width: space["1_5"],
    height: space["1_5"],
    borderRadius: radius.full,
  },
});
