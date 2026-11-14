import type { IconName } from "@acme/tokens";

/** EmptyState's props in every framework, short of its action. */
export type EmptyStateBaseProps = {
  /** Illustrates what is missing. It is decoration. */
  icon: IconName;
  /** Says what is missing, such as "No messages yet". */
  title: string;
  /** Why it is empty, or what will appear here. */
  description?: string;
};

export const EMPTY_STATE_PARTS = {
  root: "m-auto flex w-full max-w-acme-dialog flex-col items-center py-8 text-center",
  icon: "mb-4 text-acme-empty-state-icon",
  title: "text-acme-heading text-acme-text-primary",
  description: "mt-2 text-acme-body text-acme-text-secondary",
  action: "mt-6 flex justify-center",
} as const;
