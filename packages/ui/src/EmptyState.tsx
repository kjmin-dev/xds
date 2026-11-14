import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon.tsx";

export type EmptyStateProps = {
  /** Illustrates what is missing. It is decoration. */
  icon: IconName;
  /** Says what is missing, such as "No messages yet". */
  title: string;
  /** Why it is empty, or what will appear here. */
  description?: string;
  /** The one thing to do about it, usually a Button. */
  action?: ReactNode;
};

/**
 * What a screen or a list says when it has nothing to show. It centers itself in its container,
 * also vertically when the container is a flex box with room to spare.
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="m-auto flex w-full max-w-acme-dialog flex-col items-center py-8 text-center">
      <Icon name={icon} size="xl" className="mb-4 text-acme-empty-state-icon" />
      <p className="text-acme-heading text-acme-text-primary">{title}</p>
      {description && <p className="mt-2 text-acme-body text-acme-text-secondary">{description}</p>}
      {action != null && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
