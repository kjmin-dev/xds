import { motion, radius, typography } from "@acme/tokens";
import { useEffect, useRef } from "react";
import { Animated, type DimensionValue, Easing, StyleSheet, View } from "react-native";
import { useReducedMotion } from "./motion.ts";
import { control, useColors } from "./theme.ts";

export type SkeletonProps = {
  /** Points or a percentage. A line of text is as wide as its container without it. */
  width?: DimensionValue;
} & (
  | {
      /**
       * `text` is one line of body text, `circle` an avatar: as wide as it is tall, the size of
       * a medium avatar unless `width` or `height` says otherwise.
       */
      shape?: "text" | "circle";
      height?: DimensionValue;
    }
  | {
      /** A block: a picture, a card. It has no size of its own, so it needs a height. */
      shape: "rect";
      height: DimensionValue;
    }
);

/**
 * Holds the place of content that is loading. It is hidden from screen readers: the screen
 * that shows skeletons says that it is loading.
 */
export function Skeleton({ shape = "text", width, height }: SkeletonProps) {
  const colors = useColors();
  const reduced = useReducedMotion();
  // How much of the highlight shows over the fill: 0 none, 1 all of it.
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // With less motion asked for, the skeleton keeps still.
    if (reduced) {
      pulse.setValue(0);
      return;
    }
    const [x1, y1, x2, y2] = motion.easing.standard;
    const half = {
      duration: motion.duration.pulse / 2,
      easing: Easing.bezier(x1, y1, x2, y2),
      useNativeDriver: true,
    };
    const beat = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, ...half }),
        Animated.timing(pulse, { toValue: 0, ...half }),
      ]),
    );
    beat.start();
    return () => beat.stop();
  }, [pulse, reduced]);

  const box =
    shape === "circle"
      ? // One length and a ratio, so a circle given a percentage is still round.
        width !== undefined
        ? { width, aspectRatio: 1, borderRadius: radius.full }
        : { height: height ?? control.avatarMd, aspectRatio: 1, borderRadius: radius.full }
      : shape === "rect"
        ? { width: width ?? "100%", height, borderRadius: radius.md }
        : {
            width: width ?? "100%",
            height: height ?? typography.body.fontSize,
            borderRadius: radius.sm,
          };

  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.skeleton, box, { backgroundColor: colors.skeletonBackground }]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.skeletonHighlight, opacity: pulse },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Clips the highlight to the shape's corners.
  skeleton: {
    overflow: "hidden",
  },
});
