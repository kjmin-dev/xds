import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReducedMotion } from "./motion.ts";
// The text of the component's own parts takes nothing from an app's `Defaults`.
import { PartText as Text } from "./Text.tsx";
import { themed, useColors, useTheme } from "./theme.ts";

export type DialogProps = {
  /** The dialog does not close itself: this decides. */
  open: boolean;
  /** Called when the person dismisses the dialog: a tap outside it, the back button. */
  onClose: () => void;
  title: string;
  description?: string;
  /** Content under the description. It scrolls when the dialog is taller than the screen. */
  children?: ReactNode;
  /** Buttons in a row at the end edge, the main action last. */
  actions?: ReactNode;
  /**
   * Whether a tap outside or the back button may close the dialog. Turn it off for a question
   * that must be answered with one of the `actions`.
   */
  dismissible?: boolean;
  /** Put on the dialog's panel, after its own look. How it fades and grows stays its own. */
  style?: StyleProp<ViewStyle>;
};

/**
 * A window that interrupts the screen for a confirmation or a short task. For a set of choices
 * or a longer task that leaves the screen in place, use a BottomSheet.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  actions,
  dismissible = true,
  style,
}: DialogProps) {
  const styles = useStyles();
  const { motion, space } = useTheme();
  const colors = useColors();
  const reduced = useReducedMotion();
  const insets = useSafeAreaInsets();
  // 0 is hidden, 1 shown. The modal stays mounted until the way out has played.
  const progress = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) setMounted(true);
    const [x1, y1, x2, y2] = open ? motion.easing.enter : motion.easing.exit;
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      // With less motion asked for, the dialog just appears.
      duration: reduced ? 0 : motion.duration.normal,
      easing: Easing.bezier(x1, y1, x2, y2),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !open) setMounted(false);
    });
  }, [motion, open, progress, reduced]);

  const dismiss = () => {
    if (dismissible) onClose();
  };

  if (!mounted) return null;
  return (
    <Modal transparent statusBarTranslucent animationType="none" onRequestClose={dismiss}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim, opacity: progress }]}
      >
        {/* Not a button to a screen reader, which has its own gesture for leaving a dialog. */}
        <Pressable
          accessible={false}
          importantForAccessibility="no"
          onPress={dismiss}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <View
        style={[
          styles.screen,
          {
            paddingTop: insets.top + space[4],
            paddingBottom: insets.bottom + space[4],
            paddingStart: insets.left + space[4],
            paddingEnd: insets.right + space[4],
          },
        ]}
      >
        <Animated.View
          role="dialog"
          aria-modal
          // React Native 0.88 turns `aria-modal` into VoiceOver's modal flag on a Pressable only,
          // not on a View, and has no ARIA prop for a hint.
          accessibilityViewIsModal
          aria-label={title}
          {...(description ? { accessibilityHint: description } : {})}
          onAccessibilityEscape={dismiss}
          style={[
            styles.dialog,
            {
              backgroundColor: colors.dialogBackground,
              borderColor: colors.dialogBorder,
            },
            style,
            {
              opacity: progress,
              transform: [
                {
                  // It grows the last few percent into place: as far as a press shrinks a button.
                  scale: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [motion.pressScale, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Text variant="title" tone="inherit" heading style={{ color: colors.dialogTitle }}>
            {title}
          </Text>
          {(description || children) && (
            <ScrollView style={styles.body} contentContainerStyle={styles.parts}>
              {description && (
                <Text tone="inherit" style={{ color: colors.dialogText }}>
                  {description}
                </Text>
              )}
              {children}
            </ScrollView>
          )}
          {actions && <View style={styles.actions}>{actions}</View>}
        </Animated.View>
      </View>
    </Modal>
  );
}

const useStyles = themed(({ border, radius, shadow, space, size }) => {
  const control = size.touch;
  return StyleSheet.create({
    // Only the dialog takes touches here; the rest fall through to the scrim behind.
    screen: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "box-none",
    },
    dialog: {
      width: "100%",
      maxWidth: control.dialog,
      maxHeight: "100%",
      gap: space[4],
      padding: space[6],
      borderWidth: border.width.thin,
      borderRadius: radius.lg,
      // The token color carries the alpha.
      shadowColor: shadow.overlay.color,
      shadowOffset: { width: shadow.overlay.offsetX, height: shadow.overlay.offsetY },
      shadowRadius: shadow.overlay.blur,
      shadowOpacity: 1,
      elevation: 16,
    },
    // Gives way first when the dialog would be taller than the screen: the title and the actions
    // stay in sight and the body scrolls between them.
    body: {
      flexGrow: 0,
      flexShrink: 1,
    },
    parts: {
      gap: space[4],
    },
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "flex-end",
      gap: space[2],
    },
  });
});
