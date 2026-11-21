import {
  type CountBadgeBaseProps,
  countBadgeAnchorClass,
  countBadgeClass,
  classes,
  countBadgeText,
  rootPart,
} from "@acme/ui-core";
import type { ReactNode } from "react";
import type { RootProps } from "./root.ts";

export type CountBadgeProps = CountBadgeBaseProps &
  RootProps & {
    /** What the count belongs to: an icon, an avatar, a button. The badge sits on its corner. */
    children?: ReactNode;
  };

/**
 * A count of something waiting: unread messages, items in a cart. On its own it is laid out
 * inline; around a child it sits on the child's top end corner.
 */
export function CountBadge({ count, max, label, className, style, children }: CountBadgeProps) {
  // On its own the badge is the root; around a child the anchor is.
  const anchored = children !== undefined;
  const badge = count > 0 && (
    <span
      {...(label ? { role: "img", "aria-label": label } : {})}
      className={
        anchored
          ? countBadgeClass(true)
          : classes(rootPart("CountBadge"), countBadgeClass(false), className)
      }
      style={anchored ? undefined : style}
    >
      {countBadgeText(count, max)}
    </span>
  );
  if (!anchored) return badge || null;
  return (
    <span
      className={classes(rootPart("CountBadge"), countBadgeAnchorClass, className)}
      style={style}
    >
      {children}
      {badge}
    </span>
  );
}
