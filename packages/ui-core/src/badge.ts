import type { IconName } from "@acme/tokens";

const TONE = {
  neutral: "bg-acme-badge-neutral-background text-acme-badge-neutral-text",
  accent: "bg-acme-badge-accent-background text-acme-badge-accent-text",
  success: "bg-acme-badge-success-background text-acme-badge-success-text",
  warning: "bg-acme-badge-warning-background text-acme-badge-warning-text",
  danger: "bg-acme-badge-danger-background text-acme-badge-danger-text",
  /** For a badge that sits on a picture: the same in both color modes. */
  overlay: "bg-acme-badge-overlay-background text-acme-badge-overlay-text",
} as const;

export type BadgeTone = keyof typeof TONE;

/** Badge's props in every framework, short of its words. */
export type BadgeBaseProps = {
  tone?: BadgeTone;
  dot?: boolean;
  icon?: IconName;
};

export function badgeClass(tone: BadgeTone = "neutral"): string {
  return `inline-flex h-acme-badge w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-acme-footnote ${TONE[tone]}`;
}

/** The mark of a badge with `dot`, in the color of its words. */
export const badgeDotClass = "size-1.5 rounded-full bg-current";
