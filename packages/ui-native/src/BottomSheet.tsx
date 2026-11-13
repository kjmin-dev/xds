import { motion, radius, shadow, space } from "@acme/tokens";
import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReducedMotion } from "./motion.ts";
import { Text } from "./Text.tsx";
import { useColors } from "./theme.ts";

export type BottomSheetProps = {
  open: boolean;
  /** Called when the person dismisses the sheet: a tap outside, a drag down, the back button. */
  onClose: () => void;
  title?: string;
  /** What a screen reader says for the area outside the sheet. */
  closeLabel?: string;
  children: ReactNode;
};

/**
 * A panel that slides up over the screen for a short task or a set of choices, and leaves the
 * screen behind it in place. It floats: a margin separates it from the screen edges, and all
 * four corners are rounded.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  closeLabel = "Close",
  children,
}: BottomSheetProps) {
  const colors = useColors();
  const reduced = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  // 0 is fully open, 1 fully off screen. The modal stays mounted until the way out has played.
  const progress = useRef(new Animated.Value(1)).current;
  const [mounted, setMounted] = useState(open);
  const [height, setHeight] = useState(windowHeight);

  useEffect(() => {
    if (open) setMounted(true);
    const [x1, y1, x2, y2] = open ? motion.easing.enter : motion.easing.exit;
    Animated.timing(progress, {
      toValue: open ? 0 : 1,
      // With less motion asked for, the sheet appears in place instead of sliding.
      duration: reduced ? 0 : motion.duration.slow,
      easing: Easing.bezier(x1, y1, x2, y2),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !open) setMounted(false);
    });
  }, [open, progress, reduced]);

  const drag = useRef(new Animated.Value(0)).current;
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 4,
      onPanResponderMove: (_, gesture) => drag.setValue(Math.max(0, gesture.dy)),
      onPanResponderRelease: (_, gesture) => {
        // A quarter of the way down, or a quick flick, is a decision to close.
        const close = gesture.dy > heightRef.current / 4 || gesture.vy > 1;
        Animated.timing(drag, {
          toValue: 0,
          duration: motion.duration.fast,
          useNativeDriver: true,
        }).start();
        if (close) onCloseRef.current();
      },
    }),
  ).current;
  // The responder is created once, so it reads what changes through refs.
  const heightRef = useRef(height);
  heightRef.current = height;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  if (!mounted) return null;
  return (
    <Modal transparent statusBarTranslucent animationType="none" onRequestClose={onClose}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: colors.scrim,
            opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View
        accessibilityViewIsModal
        onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
        style={[
          styles.sheet,
          {
            bottom: Math.max(insets.bottom, space[2]),
            backgroundColor: colors.sheetBackground,
            shadowColor: shadow.overlay.color,
            transform: [
              {
                translateY: Animated.add(
                  // Far enough to clear the margin below it as well.
                  progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, height + insets.bottom + space[4]],
                  }),
                  drag,
                ),
              },
            ],
          },
        ]}
      >
        <View {...pan.panHandlers} style={styles.grip}>
          <View style={[styles.handle, { backgroundColor: colors.sheetHandle }]} />
        </View>
        <View style={styles.content}>
          {title && (
            <Text variant="heading" heading>
              {title}
            </Text>
          )}
          {children}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: space[2],
    right: space[2],
    borderRadius: radius.xl,
    shadowOffset: { width: shadow.overlay.offsetX, height: shadow.overlay.offsetY },
    shadowRadius: shadow.overlay.blur,
    shadowOpacity: 1,
    elevation: 16,
  },
  // Taller than the handle it holds, so there is something to grab.
  grip: {
    alignItems: "center",
    paddingTop: space[2],
    paddingBottom: space[3],
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: radius.full,
  },
  content: {
    gap: space[4],
    paddingHorizontal: space[4],
    paddingBottom: space[4],
  },
});
