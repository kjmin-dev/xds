import { icons } from "@acme/tokens";
import { type IconBaseProps, iconClass } from "@acme/ui-core";

export type { IconName, IconSize } from "@acme/ui-core";

export type IconProps = IconBaseProps & {
  className?: string;
};

/**
 * An icon from design/icons. It takes the color of the text around it. An arrow or a chevron
 * mirrors itself in a right-to-left layout when given `rtl:-scale-x-100` in `className`.
 */
export function Icon({ name, size, filled = false, label, className }: IconProps) {
  return (
    // No <title>: the icon is named through aria-label when `label` is given, and hidden otherwise.
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ? `${iconClass(size)} ${className}` : iconClass(size)}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      {icons[name].map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}
