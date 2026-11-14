import type { ReactNode } from "react";

export type CountBadgeProps = {
  /** Zero or less draws no badge. */
  count: number;
  /** The largest number shown. A larger count reads "99+". */
  max?: number;
  /**
   * Says what is counted, such as "3 unread notifications". Without it assistive technology
   * reads the number alone.
   */
  label?: string;
  /** What the count belongs to: an icon, an avatar, a button. The badge sits on its corner. */
  children?: ReactNode;
};

/**
 * A count of something waiting: unread messages, items in a cart. On its own it is laid out
 * inline; around a child it sits on the child's top end corner.
 */
export function CountBadge({ count, max = 99, label, children }: CountBadgeProps) {
  const badge = count > 0 && (
    <span
      {...(label ? { role: "img", "aria-label": label } : {})}
      // Pushed out from the corner by a quarter of its own height, so it overlaps the corner
      // instead of covering the child. `end` follows the layout direction.
      className={`inline-flex h-acme-count-badge min-w-acme-count-badge shrink-0 items-center justify-center rounded-full bg-acme-badge-count-background px-1 text-acme-footnote whitespace-nowrap text-acme-badge-count-text select-none ${children === undefined ? "" : "absolute end-[calc(var(--acme-size-count-badge)/-4)] top-[calc(var(--acme-size-count-badge)/-4)]"}`}
    >
      {count > max ? `${max}+` : count}
    </span>
  );
  if (children === undefined) return badge || null;
  return (
    <span className="relative inline-flex w-fit shrink-0">
      {children}
      {badge}
    </span>
  );
}
