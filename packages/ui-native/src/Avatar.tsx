import { useState } from "react";
import { Image, type StyleProp, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useDefaults } from "./defaults.ts";
import { initials } from "./initials.ts";
import { type Control, type Theme, themed, useColors, useControl, useTheme } from "./theme.ts";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

/** The diameter of an avatar of a size. AvatarStack draws its circles with the same ones. */
export function avatarSize(control: Control, size: AvatarSize): number {
  switch (size) {
    case "sm":
      return control.avatarSm;
    case "md":
      return control.avatarMd;
    case "lg":
      return control.avatarLg;
    case "xl":
      return control.avatarXl;
  }
}

/** The type role of the initials, and of anything else written in a circle of that size. */
export function avatarText(typography: Theme["typography"], size: AvatarSize) {
  switch (size) {
    case "sm":
      return typography.footnote;
    case "md":
      return typography.label;
    case "lg":
      return typography.bodyStrong;
    case "xl":
      return typography.title;
  }
}

/**
 * Stands for a person or a team by a picture, or by their initials while the picture loads,
 * when it fails, and when there is none. A screen reader hears the full name either way.
 * The small size has room for one letter.
 */
export function Avatar({
  name,
  src,
  size: givenSize,
  style,
}: {
  name: string;
  /** The address of a picture. It fills the circle, cropped to cover it. */
  src?: string | undefined;
  size?: AvatarSize;
  /** Put on the component's root view, after its own style. */
  style?: StyleProp<ViewStyle>;
}) {
  const defaults = useDefaults("Avatar");
  const size = givenSize ?? defaults.size ?? "md";

  const styles = useStyles();
  const colors = useColors();
  const control = useControl();
  const { typography } = useTheme();
  const diameter = avatarSize(control, size);
  // Kept with the address it is about, so a new `src` starts over without an effect.
  const [settled, setSettled] = useState<{ src: string; loaded: boolean }>();
  const loaded = settled?.src === src ? settled?.loaded : undefined;
  return (
    <View
      accessible
      role="img"
      aria-label={name}
      style={[
        [
          styles.avatar,
          {
            width: diameter,
            height: diameter,
            backgroundColor: colors.avatarBackground,
          },
        ],
        style,
      ]}
    >
      {/* Gone once the picture shows: a picture with transparent parts would let them through. */}
      {loaded !== true && (
        <Text
          // Initials do not grow with the system text size: the circle around them does not either.
          allowFontScaling={false}
          style={[avatarText(typography, size), { color: colors.avatarText }]}
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

const useStyles = themed(({ radius }) =>
  StyleSheet.create({
    avatar: {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.full,
      // Crops the picture to the circle.
      overflow: "hidden",
    },
  }),
);
