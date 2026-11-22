// The documentation's live examples use the opaque material. The device captures show the blur.
import type { ReactNode } from "react";
import { View } from "react-native";
import type { MaterialProps } from "./Glass.tsx";
import { useColors, useTheme } from "./theme.ts";

export const GlassBackdrop = View;
export const GlassScene = ({ children }: { children: ReactNode }) => children;
export function GlassMaterial({ corners, sheet: _sheet, style, ...props }: MaterialProps) {
  const { border } = useTheme();
  const colors = useColors();
  return (
    <View
      {...props}
      style={[
        style,
        {
          borderRadius: corners,
          borderColor: colors.glassBorder,
          borderWidth: border.width.thin,
          backgroundColor: colors.glassFallback,
        },
      ]}
    />
  );
}
