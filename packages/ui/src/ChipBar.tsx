import type { ReactNode } from "react";

export type ChipBarProps = {
  /** Says what the chips filter, for assistive technology. */
  label: string;
  /** The chips. Which of them are selected is the app's business: the bar holds no state. */
  children: ReactNode;
};

/**
 * One row of chips. It scrolls sideways when the chips do not fit and never wraps, so the
 * content under it stays where it is.
 */
export function ChipBar({ label, children }: ChipBarProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: a fieldset cannot be a scrolling flex row in every browser
    <div
      role="group"
      aria-label={label}
      // As tall as the chips' pressable area, which would otherwise be cut off by the scrolling
      // box. The padding leaves room for a focus ring for the same reason, and the margin
      // takes that room back so the first chip lines up with the content around the bar.
      className="-m-1 flex min-h-[calc(var(--acme-size-target-min)+var(--acme-space-2))] items-center gap-2 overflow-x-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {children}
    </div>
  );
}
