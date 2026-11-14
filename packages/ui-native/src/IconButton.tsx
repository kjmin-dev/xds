import { border, motion, shadow } from "@acme/tokens";
import { useContext, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from "react-native";
import { type ButtonVariant, look } from "./Button.tsx";
import { Icon, type IconName } from "./Icon.tsx";
import { useSpring } from "./motion.ts";
import { CONTROL_HEIGHT, type ControlSize, control, MenuOpen, useColors } from "./theme.ts";

export type IconButtonProps = {
  icon: IconName;
  /** What a screen reader says: the button shows no text, so this is its only name. */
  label: string;
  /** As Button's. An icon alone is quiet by default, so it starts as `ghost`. */
  variant?: ButtonVariant;
  size?: ControlSize;
  /**
   * Makes the button a toggle that says whether it is on. A `secondary` or `ghost` button that
   * is on is tinted and outlined, and its icon is filled; `primary` and `danger` keep their look
   * and only report the state. Leave it out for a button that is not a toggle.
   */
  selected?: boolean;
  disabled?: boolean;
  /** Shows a spinner where the icon was and ignores presses. */
  loading?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * A button that holds only an icon: a square as tall as a Button of its size, with Button's
 * colors, corner and press feedback.
 */
export function IconButton({
  icon,
  label,
  variant = "ghost",
  size = "md",
  selected,
  disabled = false,
  loading = false,
  onPress,
  style,
}: IconButtonProps) {
  const colors = useColors();
  const menuOpen = useContext(MenuOpen);
  // Only the quiet variants have a look of their own for "on": a filled button already is one.
  const on = selected === true && !disabled && (variant === "secondary" || variant === "ghost");
  const { background, pressed, text } = on
    ? {
        background: colors.buttonSelectedBackground,
        pressed: colors.buttonSelectedBackgroundPressed,
        text: colors.buttonSelectedText,
      }
    : look(colors, variant);
  // A press shrinks the button a little, on a spring: feedback that does not depend on color.
  const [held, setHeld] = useState(false);
  const scale = useSpring(held ? motion.pressScale : 1, motion.spring.fast);
  const side = CONTROL_HEIGHT[size];
  // A small button still reacts to a press anywhere in the minimum target around it.
  const slop = Math.max(0, (control.targetMin - side) / 2);
  const iconColor = disabled ? colors.buttonDisabledText : text;
  const fill = disabled
    ? variant === "ghost"
      ? "transparent"
      : colors.buttonDisabledBackground
    : background;
  // Outlined when on, so the state does not rest on the tint alone. The outline is drawn inside
  // the square, so the button is the same size on as off.
  const outline = disabled
    ? undefined
    : on
      ? colors.buttonSelectedBorder
      : variant === "secondary"
        ? colors.buttonSecondaryBorder
        : undefined;
  const raised = variant !== "ghost" && !disabled;

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{
          disabled: disabled || loading,
          busy: loading,
          ...(selected === undefined ? {} : { selected }),
          ...(menuOpen === undefined ? {} : { expanded: menuOpen }),
        }}
        disabled={disabled || loading}
        hitSlop={slop}
        onPressIn={() => setHeld(true)}
        onPressOut={() => setHeld(false)}
        {...(onPress ? { onPress } : {})}
        style={(state) => [
          styles.button,
          {
            width: side,
            height: side,
            // A circle where fingers are used. React Native wants half the side, not "full".
            borderRadius: Math.min(control.buttonRadius, side / 2),
            backgroundColor: state.pressed ? pressed : fill,
          },
          raised && styles.raised,
          outline && { borderWidth: border.width.thin, borderColor: outline },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={iconColor} />
        ) : (
          <Icon name={icon} size={size} color={iconColor} filled={on} />
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
  raised: {
    // The token color carries the alpha.
    shadowColor: shadow.subtle.color,
    shadowOffset: { width: shadow.subtle.offsetX, height: shadow.subtle.offsetY },
    shadowRadius: shadow.subtle.blur,
    shadowOpacity: 1,
  },
});
