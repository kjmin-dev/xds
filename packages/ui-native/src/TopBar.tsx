import type { ReactNode } from "react";
import { Pressable, type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { GlassMaterial, type Surface } from "./Glass";
import { Icon } from "./Icon.tsx";
// The text of the component's own parts takes nothing from an app's `Defaults`.
import { PartText as Text } from "./Text.tsx";
import { themed, useColors, useControl } from "./theme.ts";

export type TopBarProps = {
  surface?: Surface;
  title: string;
  /** Shows a back button. Leave it out on a screen that is not reached from another. */
  onBack?: () => void;
  /** What a screen reader says for the back button. */
  backLabel?: string;
  /** An action at the far end, such as a ghost button. */
  trailing?: ReactNode;
  /** Put on the component's root view, after its own style. */
  style?: StyleProp<ViewStyle>;
};

/**
 * The bar at the top of a screen: where you are, and the way back. It has the page's
 * background and no edge of its own, so content scrolls up to it without a line in between.
 * It does not cover the status bar; put it inside the safe area.
 */
export function TopBar({
  title,
  onBack,
  backLabel = "Back",
  trailing,
  surface = "solid",
  style,
}: TopBarProps) {
  const styles = useStyles();
  const control = useControl();
  const colors = useColors();
  const content = (
    <>
      {onBack && (
        <Pressable
          role="button"
          aria-label={backLabel}
          onPress={onBack}
          // The circle is smaller than the smallest target, so the press area reaches past it.
          hitSlop={(control.targetMin - control.controlSm) / 2}
          style={[styles.back, { backgroundColor: colors.topBarActionBackground }]}
        >
          <Icon name="chevron-left" size="md" color={colors.topBarAction} directional />
        </Pressable>
      )}
      <Text
        variant="heading"
        tone="inherit"
        heading
        numberOfLines={1}
        style={[
          styles.title,
          { color: surface === "glass" ? colors.glassForeground : colors.topBarText },
        ]}
      >
        {title}
      </Text>
      {trailing}
    </>
  );
  return surface === "glass" ? (
    <GlassMaterial corners={0} style={[styles.bar, style]}>
      {content}
    </GlassMaterial>
  ) : (
    <View style={[styles.bar, { backgroundColor: colors.topBarBackground }, style]}>{content}</View>
  );
}

const useStyles = themed(({ radius, space, size }) => {
  const control = size.touch;
  return StyleSheet.create({
    bar: {
      alignSelf: "stretch",
      flexDirection: "row",
      alignItems: "center",
      gap: space[3],
      height: control.bar,
      paddingHorizontal: space[4],
    },
    back: {
      width: control.controlSm,
      height: control.controlSm,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.full,
    },
    title: { flex: 1 },
  });
});
