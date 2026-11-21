import { icons } from "@acme/tokens";
import { classes, type IconBaseProps, iconClass, rootPart } from "@acme/ui-core";
import { useDefaults } from "./Defaults.tsx";
import type { RootProps } from "./root.ts";

export type { IconName, IconSize } from "@acme/ui-core";

export type IconProps = IconBaseProps & RootProps;

/**
 * An icon from design/icons. It takes the color of the text around it. An arrow or a chevron
 * mirrors itself in a right-to-left layout when given `rtl:-scale-x-100` in `className`.
 */
export function Icon(props: IconProps) {
  const defaults = useDefaults("Icon");
  const { name, size = defaults.size, filled = false, label, className, style } = props;
  return (
    // No <title>: the icon is named through aria-label when `label` is given, and hidden otherwise.
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={classes(rootPart("Icon"), iconClass(size), className)}
      style={style}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      {icons[name].map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}
