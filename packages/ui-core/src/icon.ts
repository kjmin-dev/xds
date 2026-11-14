import type { IconName } from "@acme/tokens";

// Written out in full: Tailwind only generates the classes it can find as whole strings.
const SIZE = {
  xs: "size-acme-icon-xs",
  sm: "size-acme-icon-sm",
  md: "size-acme-icon-md",
  lg: "size-acme-icon-lg",
  xl: "size-acme-icon-xl",
} as const;

export type { IconName };
export type IconSize = keyof typeof SIZE;

export type IconBaseProps = {
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
};

export function iconClass(size: IconSize = "md"): string {
  return `shrink-0 ${SIZE[size]}`;
}
