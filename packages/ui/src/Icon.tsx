import { type IconName, icons } from "@acme/tokens";

const SIZE = {
  xs: "size-acme-icon-xs",
  sm: "size-acme-icon-sm",
  md: "size-acme-icon-md",
  lg: "size-acme-icon-lg",
  xl: "size-acme-icon-xl",
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
  /**
   * Fills the shapes, so that a selected state shows in the form and not in the color alone:
   * a heart that was pressed, a bookmark that is saved. Only for icons made of closed shapes.
   */
  filled?: boolean;
  /** Names the icon for assistive technology. Without it the icon is decoration and is skipped. */
  label?: string;
  className?: string;
};

/**
 * An icon from design/icons. It takes the color of the text around it. An arrow or a chevron
 * mirrors itself in a right-to-left layout when given `rtl:-scale-x-100` in `className`.
 */
export function Icon({ name, size = "md", filled = false, label, className = "" }: IconProps) {
  return (
    // No <title>: the icon is named through aria-label when `label` is given, and hidden otherwise.
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${SIZE[size]} ${className}`}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      {icons[name].map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}
