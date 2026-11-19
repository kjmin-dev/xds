// The documentation's live examples use the opaque material. The device captures show the blur.
import { border } from "@acme/tokens";
import type { ReactNode } from "react";
import { View } from "react-native";
import type { MaterialProps } from "./Glass.tsx";
import { useColors } from "./theme.ts";

export const GlassBackdrop = View;
export const GlassScene = ({ children }: { children: ReactNode }) => children;
export function GlassMaterial({ corners, sheet: _sheet, style, ...props }: MaterialProps) {
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
