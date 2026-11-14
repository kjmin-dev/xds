import type { IconName } from "@acme/tokens";

/** SectionHeader's props in every framework, short of its action. */
export type SectionHeaderBaseProps = {
  title: string;
  /** A line under the title. */
  description?: string;
  /** Before the title. */
  icon?: IconName;
  /** The heading level in the document outline. Defaults to 2. */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
};

// What sits beside the title is centered on the title's first line, not on the whole block,
// so it stays put when a description is added. `1lh` in the heading's type is that line.
const TITLE_LINE = "flex h-lh shrink-0 items-center text-acme-heading";

export const SECTION_HEADER_PARTS = {
  root: "flex items-start gap-4",
  /** The icon and the text. */
  lead: "flex min-w-0 flex-1 items-start gap-2",
  icon: `${TITLE_LINE} text-acme-text-secondary`,
  text: "flex min-w-0 flex-col gap-0.5",
  title: "text-acme-heading text-acme-text-primary",
  description: "text-acme-detail text-acme-text-secondary",
  action: TITLE_LINE,
  // Button's own `iconEnd` does not mirror; this one has to, as it points onward.
  chevron: "rtl:-scale-x-100",
} as const;
