import { type IconName, icons } from "@acme/tokens";
import { I18nManager } from "react-native";
import Svg, { Path } from "react-native-svg";
import { control, useColors } from "./theme.ts";

const SIZE = { sm: control.iconSm, md: control.iconMd, lg: control.iconLg } as const;

export type { IconName };
export type IconSize = keyof typeof SIZE;

export type IconProps = {
  name: IconName;
  /** `sm` and `md` sit beside text; `lg` stands alone, as in a tab bar. */
  size?: IconSize;
  /** Defaults to the primary text color. */
  color?: string;
  /** Names the icon for a screen reader. Without it the icon is decoration and is skipped. */
  label?: string;
  /** For arrows and chevrons: mirrors the icon in a right-to-left layout. */
  directional?: boolean;
};

/** An icon from design/icons. */
export function Icon({ name, size = "md", color, label, directional = false }: IconProps) {
  const colors = useColors();
  return (
    <Svg
      width={SIZE[size]}
      height={SIZE[size]}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? colors.textPrimary}
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
