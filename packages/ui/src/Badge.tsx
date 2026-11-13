import type { ReactNode } from "react";

const TONE = {
  neutral: "bg-acme-badge-neutral-background text-acme-badge-neutral-text",
  accent: "bg-acme-badge-accent-background text-acme-badge-accent-text",
  success: "bg-acme-badge-success-background text-acme-badge-success-text",
  warning: "bg-acme-badge-warning-background text-acme-badge-warning-text",
  danger: "bg-acme-badge-danger-background text-acme-badge-danger-text",
} as const;

export type BadgeTone = keyof typeof TONE;

/**
 * A short status or category. The words carry the meaning; the color only reinforces it, so a
 * badge still reads for someone who cannot tell the tones apart. `dot` adds a small mark for
 * live states such as "connected".
 */
export function Badge({
  tone = "neutral",
  dot = false,
  children,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex h-6 w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-acme-footnote ${TONE[tone]}`}
    >
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
