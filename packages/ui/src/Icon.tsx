import { type IconName, icons } from "@acme/tokens";

const SIZE = {
  sm: "size-acme-icon-sm",
  md: "size-acme-icon-md",
  lg: "size-acme-icon-lg",
} as const;

export type { IconName };
export type IconSize = keyof typeof SIZE;

export type IconProps = {
  name: IconName;
  /** `sm` and `md` sit beside text; `lg` stands alone, as in a tab bar. */
  size?: IconSize;
  /** Names the icon for assistive technology. Without it the icon is decoration and is skipped. */
  label?: string;
  className?: string;
};

/**
 * An icon from design/icons. It takes the color of the text around it. An arrow or a chevron
 * mirrors itself in a right-to-left layout when given `rtl:-scale-x-100` in `className`.
 */
export function Icon({ name, size = "md", label, className = "" }: IconProps) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: named through aria-label when `label` is given, hidden otherwise
    <svg
      viewBox="0 0 24 24"
      fill="none"
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
