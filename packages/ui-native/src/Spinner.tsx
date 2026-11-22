import { ActivityIndicator, Platform, type StyleProp, type ViewStyle } from "react-native";
import { useDefaults } from "./defaults.ts";
import { useColors, useControl } from "./theme.ts";

export type SpinnerSize = "sm" | "md" | "lg";

/**
 * Says that something is in progress and how long is unknown. With `label` it is announced;
 * without one it is decoration next to text that already says what is happening. It is the
 * platform's own spinner, at the size of the `size.spinner-*` tokens; iOS draws its spinner in
 * two sizes only, so there `md` and `lg` are the large one.
 */
export function Spinner({
  size: given,
  label,
  style,
}: {
  size?: SpinnerSize;
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  const control = useControl();
  const defaults = useDefaults("Spinner");
  const size = given ?? defaults.size ?? "md";
  const side = { sm: control.spinnerSm, md: control.spinnerMd, lg: control.spinnerLg }[size];
  return (
    <ActivityIndicator
      size={Platform.OS === "ios" ? (size === "sm" ? "small" : "large") : side}
      color={colors.textSecondary}
      style={style}
      // ActivityIndicator hands its props to the native view as they are, and the native view
      // reads no `aria-*` prop.
      {...(label
        ? { accessibilityLabel: label }
        : { accessible: false, importantForAccessibility: "no" as const })}
    />
  );
}
