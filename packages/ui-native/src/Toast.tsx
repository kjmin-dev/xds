import { motion, radius, shadow, space, typography } from "@acme/tokens";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReducedMotion } from "./motion.ts";
import { Text } from "./Text.tsx";
import { control, useColors } from "./theme.ts";

export type ToastProps = {
  /** The toast does not close itself: this decides. */
  open: boolean;
  /** Called when the time is up, and after the action was chosen. */
  onClose: () => void;
  message: string;
  /** One thing to do about the message, such as undoing it. */
  action?: { label: string; onPress: () => void };
  /** How long the toast stays, in milliseconds. 0 keeps it until `open` is false. */
  duration?: number;
};

/**
 * A short message about what just happened, which leaves on its own. It is drawn at the bottom
 * of its parent, inside the safe area: put it last in the view that fills the screen, outside
 * any SafeAreaView, which would add the same margins a second time.
 */
export function Toast({
  open,
  onClose,
  message,
  action,
  duration = motion.duration.toast,
}: ToastProps) {
  const colors = useColors();
  const reduced = useReducedMotion();
  const insets = useSafeAreaInsets();
  // 0 is hidden, 1 shown. The toast stays mounted until the way out has played.
  const progress = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(open);
  // The timer runs from when the toast opens, whatever the handler is by the time it ends.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (open) setMounted(true);
    const [x1, y1, x2, y2] = open ? motion.easing.enter : motion.easing.exit;
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      // With less motion asked for, the toast just appears.
      duration: reduced ? 0 : motion.duration.normal,
      easing: Easing.bezier(x1, y1, x2, y2),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !open) setMounted(false);
    });
  }, [open, progress, reduced]);

  useEffect(() => {
    if (!open || duration <= 0) return;
    const timer = setTimeout(() => onCloseRef.current(), duration);
    return () => clearTimeout(timer);
  }, [open, duration]);

  useEffect(() => {
    // Android reads the live region below by itself; iOS has to be told.
    if (open && Platform.OS === "ios") AccessibilityInfo.announceForAccessibility(message);
  }, [open, message]);

  if (!mounted) return null;
  return (
    <Animated.View
      style={[
        styles.layer,
        {
          bottom: insets.bottom + space[4],
          start: insets.left + space[4],
          end: insets.right + space[4],
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [space[4], 0] }),
            },
          ],
        },
      ]}
    >
      <Animated.View
        role="status"
        accessibilityLiveRegion="polite"
        style={[styles.toast, { backgroundColor: colors.toastBackground }]}
      >
        <Text variant="detail" tone="inherit" style={[styles.message, { color: colors.toastText }]}>
          {message}
        </Text>
        {action && (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              action.onPress();
              onClose();
            }}
            style={styles.action}
          >
            <Text variant="label" tone="inherit" style={{ color: colors.toastAction }}>
              {action.label}
            </Text>
          </Pressable>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Spans the width so that the toast can be centered in it, and lets touches beside the toast
  // through to the screen.
  layer: {
    position: "absolute",
    alignItems: "center",
    pointerEvents: "box-none",
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    maxWidth: control.toast,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    borderRadius: radius.md,
    // The token color carries the alpha.
    shadowColor: shadow.raised.color,
    shadowOffset: { width: shadow.raised.offsetX, height: shadow.raised.offsetY },
    shadowRadius: shadow.raised.blur,
    shadowOpacity: 1,
    elevation: 6,
  },
  message: {
    flexShrink: 1,
  },
  // As large as the smallest target. The margins take back what that adds, so the toast is as
  // tall as its message needs and the label ends where the padding does.
  action: {
    minWidth: control.targetMin,
    minHeight: control.targetMin,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space[2],
    marginVertical: -(control.targetMin - typography.detail.lineHeight) / 2,
    marginEnd: -space[2],
  },
});
