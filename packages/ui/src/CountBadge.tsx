import {
  type CountBadgeBaseProps,
  countBadgeAnchorClass,
  countBadgeClass,
  countBadgeText,
} from "@acme/ui-core";
import type { ReactNode } from "react";

export type CountBadgeProps = CountBadgeBaseProps & {
  /** What the count belongs to: an icon, an avatar, a button. The badge sits on its corner. */
  children?: ReactNode;
};

/**
 * A count of something waiting: unread messages, items in a cart. On its own it is laid out
 * inline; around a child it sits on the child's top end corner.
 */
export function CountBadge({ count, max, label, children }: CountBadgeProps) {
  const badge = count > 0 && (
    <span
      {...(label ? { role: "img", "aria-label": label } : {})}
      className={countBadgeClass(children !== undefined)}
    >
      {countBadgeText(count, max)}
    </span>
  );
  if (children === undefined) return badge || null;
  return (
    <span className={countBadgeAnchorClass}>
      {children}
      {badge}
    </span>
  );
}
