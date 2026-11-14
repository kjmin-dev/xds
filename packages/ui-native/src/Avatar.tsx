import { radius, typography } from "@acme/tokens";
import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { initials } from "./initials.ts";
import { control, useColors } from "./theme.ts";

export const AVATAR_SIZE = {
  sm: control.avatarSm,
  md: control.avatarMd,
  lg: control.avatarLg,
  xl: control.avatarXl,
} as const;

export const AVATAR_TEXT = {
  sm: typography.footnote,
  md: typography.label,
  lg: typography.bodyStrong,
  xl: typography.title,
} as const;

export type AvatarSize = keyof typeof AVATAR_SIZE;

/**
 * Stands for a person or a team by a picture, or by their initials while the picture loads,
 * when it fails, and when there is none. A screen reader hears the full name either way.
 * The small size has room for one letter.
 */
export function Avatar({
  name,
  src,
  size = "md",
}: {
  name: string;
  /** The address of a picture. It fills the circle, cropped to cover it. */
  src?: string | undefined;
  size?: AvatarSize;
}) {
  const colors = useColors();
  // Kept with the address it is about, so a new `src` starts over without an effect.
  const [settled, setSettled] = useState<{ src: string; loaded: boolean }>();
  const loaded = settled?.src === src ? settled?.loaded : undefined;
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={name}
      style={[
        styles.avatar,
        {
          width: AVATAR_SIZE[size],
          height: AVATAR_SIZE[size],
          backgroundColor: colors.avatarBackground,
        },
      ]}
    >
      {/* Gone once the picture shows: a picture with transparent parts would let them through. */}
      {loaded !== true && (
        <Text
          // Initials do not grow with the system text size: the circle around them does not either.
          allowFontScaling={false}
          style={[AVATAR_TEXT[size], { color: colors.avatarText }]}
        >
          {initials(name, size === "sm" ? 1 : 2)}
        </Text>
      )}
      {src !== undefined && loaded !== false && (
        <Image
          source={{ uri: src }}
          resizeMode="cover"
          // The name is on the circle; the picture adds nothing to it.
          accessible={false}
          onLoad={() => setSettled({ src, loaded: true })}
          onError={() => setSettled({ src, loaded: false })}
          style={StyleSheet.absoluteFill}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    // Crops the picture to the circle.
    overflow: "hidden",
  },
});
