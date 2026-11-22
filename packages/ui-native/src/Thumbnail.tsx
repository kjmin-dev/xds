import { useState } from "react";
import { Image, type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { Badge } from "./Badge.tsx";
import { useDefaults } from "./defaults.ts";
import { Icon } from "./Icon.tsx";
import { themed, useColors, useTheme } from "./theme.ts";

export type ThumbnailRatio = "16:9" | "1:1" | "4:3" | "9:16";

const RATIO: Record<ThumbnailRatio, number> = {
  "16:9": 16 / 9,
  "1:1": 1,
  "4:3": 4 / 3,
  "9:16": 9 / 16,
};

export type ThumbnailProps = {
  /** The address of a picture. It fills the shape, cropped to cover it. */
  src?: string | undefined;
  /** Says what the picture shows. An empty `alt` makes the picture decoration. */
  alt: string;
  /** Width to height. */
  ratio?: ThumbnailRatio | undefined;
  /** Short text on the bottom end corner, such as a duration. */
  badge?: string | undefined;
  /** How much was watched, from 0 to 1: a bar across the bottom edge. 0 draws nothing. */
  progress?: number | undefined;
  /** Put on the component's root view, after its own style. */
  style?: StyleProp<ViewStyle>;
};

/**
 * A picture in a fixed shape, for a video, an article or a product. It fills the width it is
 * given and takes its height from `ratio`. While the picture loads, when it fails and when there
 * is none, the shape is filled and marked with a picture icon.
 */
export function Thumbnail({ src, alt, ratio: givenRatio, badge, progress, style }: ThumbnailProps) {
  const defaults = useDefaults("Thumbnail");
  const ratio = givenRatio ?? defaults.ratio ?? "16:9";

  const styles = useStyles();
  const { space } = useTheme();
  const colors = useColors();
  // Kept with the address it is about, so a new `src` starts over without an effect.
  const [settled, setSettled] = useState<{ src: string; loaded: boolean }>();
  const loaded = settled?.src === src ? settled?.loaded : undefined;
  const watched = Math.min(1, Math.max(0, progress ?? 0));

  return (
    <View
      style={[
        [
          styles.thumbnail,
          { aspectRatio: RATIO[ratio], backgroundColor: colors.thumbnailBackground },
        ],
        style,
      ]}
    >
      <View
        // The picture, apart from the badge: the badge is read as text of its own, as it would
        // be beside an image on the web.
        {...(alt === ""
          ? { "aria-hidden": true }
          : { accessible: true, role: "img" as const, "aria-label": alt })}
        style={[StyleSheet.absoluteFill, styles.center]}
      >
        {loaded !== true && <Icon name="image" size="lg" color={colors.thumbnailIcon} />}
        {src !== undefined && loaded !== false && (
          <Image
            source={{ uri: src }}
            resizeMode="cover"
            accessible={false}
            onLoad={() => setSettled({ src, loaded: true })}
            onError={() => setSettled({ src, loaded: false })}
            style={StyleSheet.absoluteFill}
          />
        )}
      </View>
      {watched > 0 && (
        <View
          // How much was watched is not put in words, so it is drawn for the eye only.
          aria-hidden
          style={[styles.progress, { backgroundColor: colors.overlayBackground }]}
        >
          <View
            style={[
              styles.watched,
              { width: `${watched * 100}%`, backgroundColor: colors.overlayAccent },
            ]}
          />
        </View>
      )}
      {badge !== undefined && (
        // Above the bar when there is one, so the bar shows whole.
        <View style={[styles.badge, { bottom: space[2] + (watched > 0 ? space[1] : 0) }]}>
          <Badge tone="overlay" label={badge} />
        </View>
      )}
    </View>
  );
}

const useStyles = themed(({ radius, space }) =>
  StyleSheet.create({
    thumbnail: {
      width: "100%",
      borderRadius: radius.md,
      // Clips the picture and the bar to the round corners.
      overflow: "hidden",
    },
    center: {
      alignItems: "center",
      justifyContent: "center",
    },
    progress: {
      position: "absolute",
      start: 0,
      end: 0,
      bottom: 0,
      height: space[1],
    },
    watched: {
      height: "100%",
    },
    badge: {
      position: "absolute",
      end: space[2],
    },
  }),
);
