import { type IconName, icons } from "@acme/tokens";
import { useContext } from "react";
import { I18nManager, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useDefaults } from "./defaults.ts";
import { type Control, ContentColor, useColors, useControl } from "./theme.ts";

export type { IconName };
export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

/** The side of an icon of a size. */
export function iconSide(control: Control, size: IconSize): number {
  switch (size) {
    case "xs":
      return control.iconXs;
    case "sm":
      return control.iconSm;
    case "md":
      return control.iconMd;
    case "lg":
      return control.iconLg;
    case "xl":
      return control.iconXl;
  }
}

export type IconProps = {
  name: IconName;
  /**
   * `xs` fits inside a badge, `sm` and `md` sit beside text, `lg` stands alone, as in a tab
   * bar, and `xl` illustrates, as in an empty state.
   */
  size?: IconSize;
  /** Defaults to the primary text color, or to the color of the slot the icon is in. */
  color?: string;
  /**
   * Fills the shapes, so that a selected state shows in the form and not in the color alone:
   * a heart that was pressed, a bookmark that is saved. Only for icons made of closed shapes.
   */
  filled?: boolean;
  /** Names the icon for a screen reader. Without it the icon is decoration and is skipped. */
  label?: string;
  /** For arrows and chevrons: mirrors the icon in a right-to-left layout. */
  directional?: boolean;
  /** Put on the component's root view, after its own style. */
  style?: StyleProp<ViewStyle>;
};

/** An icon from design/icons. */
export function Icon({
  name,
  size: givenSize,
  color,
  filled = false,
  label,
  directional = false,
  style,
}: IconProps) {
  const defaults = useDefaults("Icon");
  const size = givenSize ?? defaults.size ?? "md";

  const colors = useColors();
  const inherited = useContext(ContentColor);
  const tint = color ?? inherited ?? colors.textPrimary;
  const side = iconSide(useControl(), size);
  return (
    <Svg
      width={side}
      height={side}
      viewBox="0 0 24 24"
      fill={filled ? tint : "none"}
      stroke={tint}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={[
        directional && I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : undefined,
        style,
      ]}
      accessible={label !== undefined}
      // react-native-svg hands Svg's props to its native view as they are, and the native view
      // reads no `aria-*` prop.
      {...(label ? { accessibilityRole: "image", accessibilityLabel: label } : {})}
    >
      {icons[name].map((path) => (
        <Path key={path} d={path} />
      ))}
    </Svg>
  );
}
