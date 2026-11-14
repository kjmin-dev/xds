import { EMPTY_STATE_PARTS, type EmptyStateBaseProps } from "@acme/ui-core";
import type { ReactNode } from "react";
import { Icon } from "./Icon.tsx";

export type EmptyStateProps = EmptyStateBaseProps & {
  /** The one thing to do about it, usually a Button. */
  action?: ReactNode;
};

/**
 * What a screen or a list says when it has nothing to show. It centers itself in its container,
 * also vertically when the container is a flex box with room to spare.
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className={EMPTY_STATE_PARTS.root}>
      <Icon name={icon} size="xl" className={EMPTY_STATE_PARTS.icon} />
      <p className={EMPTY_STATE_PARTS.title}>{title}</p>
      {description && <p className={EMPTY_STATE_PARTS.description}>{description}</p>}
      {action != null && <div className={EMPTY_STATE_PARTS.action}>{action}</div>}
    </div>
  );
}
