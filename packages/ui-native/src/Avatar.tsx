import { radius, typography } from "@acme/tokens";
import { StyleSheet, Text, View } from "react-native";
import { initials } from "./initials.ts";
import { useColors } from "./theme.ts";

const SIZE = { sm: 24, md: 32, lg: 40 } as const;
const TEXT = { sm: typography.footnote, md: typography.label, lg: typography.bodyStrong } as const;

export type AvatarSize = keyof typeof SIZE;

/**
 * Stands for a person or a team by their initials. A screen reader hears the full name.
 * The small size has room for one letter.
 */
export function Avatar({ name, size = "md" }: { name: string; size?: AvatarSize }) {
  const colors = useColors();
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={name}
      style={[
        styles.avatar,
        { width: SIZE[size], height: SIZE[size], backgroundColor: colors.avatarBackground },
      ]}
    >
      <Text
        // Initials do not grow with the system text size: the circle around them does not either.
        allowFontScaling={false}
        style={[TEXT[size], { color: colors.avatarText }]}
      >
        {initials(name, size === "sm" ? 1 : 2)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
  },
});
