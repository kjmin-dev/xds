import { type IconName, icons } from "@acme/tokens";
import { I18nManager } from "react-native";
import Svg, { Path } from "react-native-svg";
import { control, useColors } from "./theme.ts";

const SIZE = {
  xs: control.iconXs,
  sm: control.iconSm,
  md: control.iconMd,
  lg: control.iconLg,
  xl: control.iconXl,
} as const;

export type { IconName };
export type IconSize = keyof typeof SIZE;

export type IconProps = {
  name: IconName;
  /**
   * `xs` fits inside a badge, `sm` and `md` sit beside text, `lg` stands alone, as in a tab
   * bar, and `xl` illustrates, as in an empty state.
   */
  size?: IconSize;
  /** Defaults to the primary text color. */
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
};

/** An icon from design/icons. */
export function Icon({
  name,
  size = "md",
  color,
  filled = false,
  label,
  directional = false,
}: IconProps) {
  const colors = useColors();
  const tint = color ?? colors.textPrimary;
  return (
    <Svg
      width={SIZE[size]}
      height={SIZE[size]}
      viewBox="0 0 24 24"
      fill={filled ? tint : "none"}
      stroke={tint}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={directional && I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
      accessible={label !== undefined}
      {...(label ? { accessibilityRole: "image", accessibilityLabel: label } : {})}
    >
      {icons[name].map((path) => (
        <Path key={path} d={path} />
      ))}
    </Svg>
  );
}
