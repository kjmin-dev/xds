import { ActivityIndicator } from "react-native";
import { useColors } from "./theme.ts";

/**
 * Says that something is in progress and how long is unknown. With `label` it is announced;
 * without one it is decoration next to text that already says what is happening.
 */
export function Spinner({ size = "md", label }: { size?: "sm" | "md"; label?: string }) {
  const colors = useColors();
  return (
    <ActivityIndicator
      size={size === "sm" ? "small" : "large"}
      color={colors.textSecondary}
      // ActivityIndicator hands its props to the native view as they are, and the native view
      // reads no `aria-*` prop.
      {...(label
        ? { accessibilityLabel: label }
        : { accessible: false, importantForAccessibility: "no" as const })}
    />
  );
}
