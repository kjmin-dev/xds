import { classes, EMPTY_STATE_PARTS, type EmptyStateBaseProps, rootPart } from "@acme/ui-core";
import type { ReactNode } from "react";
import { Icon } from "./Icon.tsx";
import type { RootProps } from "./root.ts";

export type EmptyStateProps = EmptyStateBaseProps &
  RootProps & {
    /** The one thing to do about it, usually a Button. */
    action?: ReactNode;
  };

/**
 * What a screen or a list says when it has nothing to show. It centers itself in its container,
 * also vertically when the container is a flex box with room to spare.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  style,
}: EmptyStateProps) {
  return (
    <div
      className={classes(rootPart("EmptyState"), EMPTY_STATE_PARTS.root, className)}
      style={style}
    >
      <Icon name={icon} size="xl" className={EMPTY_STATE_PARTS.icon} />
      <p className={EMPTY_STATE_PARTS.title}>{title}</p>
      {description && <p className={EMPTY_STATE_PARTS.description}>{description}</p>}
      {action != null && <div className={EMPTY_STATE_PARTS.action}>{action}</div>}
    </div>
  );
}
