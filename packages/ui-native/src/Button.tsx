import { border, motion, shadow, space, typography } from "@acme/tokens";
import { useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { Icon, type IconName, type IconSize } from "./Icon.tsx";
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

const ICON: Record<ControlSize, IconSize> = { sm: "sm", md: "sm", lg: "md" };
const ICON_WIDTH: Record<ControlSize, number> = {
  sm: control.iconSm,
  md: control.iconSm,
  lg: control.iconMd,
};

export type ButtonProps = {
  /**
   * `primary` is the one action a screen is for; use it once per screen. `secondary` is any
   * other action, `ghost` an action that should stay out of the way, `danger` one that destroys.
   */
  variant?: ButtonVariant;
  size?: ControlSize;
  disabled?: boolean;
  /**
   * Shows a spinner and ignores presses. The label stays and the spinner stands where
   * `iconStart` was, so the button keeps its width.
   */
  loading?: boolean;
  /**
   * Stretches to the width of its container, whatever the container's alignment. Without it the
   * button follows the container: as wide as its label in a row, as wide as the column in a
   * column that does not align its items.
   */
  fullWidth?: boolean;
  /** An icon before the label. */
  iconStart?: IconName;
  /** An icon after the label. */
  iconEnd?: IconName;
  /**
   * Makes the button a toggle that says whether it is on. A `secondary` or `ghost` button that
   * is on is tinted and outlined, and its `iconStart` is filled; `primary` and `danger` keep
   * their look and only report the state. Leave it out for a button that is not a toggle.
   */
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
} & (
  | {
      /** The visible label. It is also what a screen reader says. */
      label: string;
      accessibilityLabel?: never;
    }
  | {
      label?: never;
      /** Names a button that holds only an icon, in place of the label it does not show. */
      accessibilityLabel: string;
    }
);

export function Button({
  variant = "secondary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  iconStart,
  iconEnd,
  selected,
  onPress,
  label,
  accessibilityLabel,
  style,
}: ButtonProps) {
  const colors = useColors();
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
  const height = CONTROL_HEIGHT[size];
  // A small button still reacts to a press anywhere in the minimum target around it.
  const slop = Math.max(0, (control.targetMin - height) / 2);
  const labelColor = disabled ? colors.buttonDisabledText : text;
  const fill = disabled
    ? variant === "ghost"
      ? "transparent"
      : colors.buttonDisabledBackground
    : background;
  // Outlined when on, so the state does not rest on the tint alone; a secondary button is
  // outlined anyway, so it sits quietly beside a primary one.
  const outline = disabled
    ? undefined
    : on
      ? colors.buttonSelectedBorder
      : variant === "secondary"
        ? colors.buttonSecondaryBorder
        : undefined;
  // A ghost button has no outline until it is on. The padding gives up the room the outline
  // takes, so the button is as wide on as off.
  const padding = PADDING[size] - (outline && variant === "ghost" ? border.width.thin : 0);

  // Filled buttons carry the same trace of shadow as the outlined one, so none looks flatter.
  const raised = variant !== "ghost" && !disabled;

  return (
    <Animated.View style={[fullWidth && styles.fullWidth, style, { transform: [{ scale }] }]}>
      <Pressable
        accessibilityRole="button"
        {...(accessibilityLabel ? { accessibilityLabel } : {})}
        accessibilityState={{
          disabled: disabled || loading,
          busy: loading,
          ...(selected === undefined ? {} : { selected }),
        }}
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
            paddingHorizontal: padding,
            // A capsule where fingers are used. React Native wants half the height, not "full".
            borderRadius: Math.min(control.buttonRadius, height / 2),
            backgroundColor: state.pressed ? pressed : fill,
          },
          raised && styles.raised,
          outline && { borderWidth: border.width.thin, borderColor: outline },
        ]}
      >
        {loading ? (
          iconStart ? (
            // The platform's small spinner is a little wider than a small icon. Centered in
            // the icon's room it spills into the gap, and the label does not move.
            <View style={[styles.spinner, { width: ICON_WIDTH[size] }]}>
              <ActivityIndicator size="small" color={labelColor} />
            </View>
          ) : (
            <ActivityIndicator size="small" color={labelColor} />
          )
        ) : (
          iconStart && <Icon name={iconStart} size={ICON[size]} color={labelColor} filled={on} />
        )}
        {label !== undefined && (
          <Text
            numberOfLines={1}
            style={[
              size === "lg" ? typography.bodyStrong : typography.label,
              { color: labelColor },
            ]}
          >
            {label}
          </Text>
        )}
        {iconEnd && <Icon name={iconEnd} size={ICON[size]} color={labelColor} />}
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
  spinner: {
    alignItems: "center",
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
