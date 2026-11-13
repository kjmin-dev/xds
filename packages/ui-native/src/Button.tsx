import { border, motion, shadow, space, typography } from "@acme/tokens";
import { useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  type ViewStyle,
} from "react-native";
import { useSpring } from "./motion.ts";
import { CONTROL_HEIGHT, type Colors, type ControlSize, control, useColors } from "./theme.ts";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type Look = { background: string; pressed: string; text: string };

function look(colors: Colors, variant: ButtonVariant): Look {
  switch (variant) {
    case "primary":
      return {
        background: colors.buttonPrimaryBackground,
        pressed: colors.buttonPrimaryBackgroundPressed,
        text: colors.buttonPrimaryText,
      };
    case "secondary":
      return {
        background: colors.buttonSecondaryBackground,
        pressed: colors.buttonSecondaryBackgroundPressed,
        text: colors.buttonSecondaryText,
      };
    case "ghost":
      return {
        background: "transparent",
        pressed: colors.buttonGhostBackgroundPressed,
        text: colors.buttonGhostText,
      };
    case "danger":
      return {
        background: colors.buttonDangerBackground,
        pressed: colors.buttonDangerBackgroundPressed,
        text: colors.buttonDangerText,
      };
  }
}

const PADDING: Record<ControlSize, number> = { sm: space[3], md: space[4], lg: space[6] };

export type ButtonProps = {
  /**
   * `primary` is the one action a screen is for; use it once per screen. `secondary` is any
   * other action, `ghost` an action that should stay out of the way, `danger` one that destroys.
   */
  variant?: ButtonVariant;
  size?: ControlSize;
  disabled?: boolean;
  /** Shows a spinner and ignores presses. The label stays, so the button keeps its width. */
  loading?: boolean;
  /**
   * Stretches to the width of its container, whatever the container's alignment. Without it the
   * button follows the container: as wide as its label in a row, as wide as the column in a
   * column that does not align its items.
   */
  fullWidth?: boolean;
  onPress?: () => void;
  /** The visible label. It is also what a screen reader says. */
  label: string;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  variant = "secondary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  onPress,
  label,
  style,
}: ButtonProps) {
  const colors = useColors();
  const { background, pressed, text } = look(colors, variant);
  // A press shrinks the button a little, on a spring: feedback that does not depend on color.
  const [held, setHeld] = useState(false);
  const scale = useSpring(held ? motion.pressScale : 1, motion.spring.fast);
  const height = CONTROL_HEIGHT[size];
  // A small button still reacts to a press anywhere in the minimum target around it.
  const slop = Math.max(0, (control.targetMin - height) / 2);
  const labelColor = disabled ? colors.buttonDisabledText : text;
  const fill = disabled
    ? variant === "ghost"
      ? "transparent"
      : colors.buttonDisabledBackground
    : background;

  // Filled buttons carry the same trace of shadow as the outlined one, so none looks flatter.
  const raised = variant !== "ghost" && !disabled;

  return (
    <Animated.View style={[fullWidth && styles.fullWidth, style, { transform: [{ scale }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        disabled={disabled || loading}
        hitSlop={slop}
        onPressIn={() => setHeld(true)}
        onPressOut={() => setHeld(false)}
        {...(onPress ? { onPress } : {})}
        style={(state) => [
          styles.button,
          {
            height,
            minWidth: Math.max(height, control.targetMin),
            paddingHorizontal: PADDING[size],
            // A capsule where fingers are used. React Native wants half the height, not "full".
            borderRadius: Math.min(control.buttonRadius, height / 2),
            backgroundColor: state.pressed ? pressed : fill,
          },
          raised && styles.raised,
          // Outlined, so it sits quietly beside a primary button.
          variant === "secondary" &&
            !disabled && {
              borderWidth: border.width.thin,
              borderColor: colors.buttonSecondaryBorder,
            },
        ]}
      >
        {loading && <ActivityIndicator size="small" color={labelColor} />}
        <Text
          numberOfLines={1}
          style={[size === "lg" ? typography.bodyStrong : typography.label, { color: labelColor }]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space[2],
  },
  raised: {
    // The token color carries the alpha.
    shadowColor: shadow.subtle.color,
    shadowOffset: { width: shadow.subtle.offsetX, height: shadow.subtle.offsetY },
    shadowRadius: shadow.subtle.blur,
    shadowOpacity: 1,
  },
  fullWidth: { alignSelf: "stretch" },
});
