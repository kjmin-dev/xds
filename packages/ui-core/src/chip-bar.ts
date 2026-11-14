/** ChipBar's props in every framework, short of the chips. */
export type ChipBarBaseProps = {
  /** Says what the chips filter, for assistive technology. */
  label: string;
};

/**
 * The scrolling row. It is as tall as the chips' pressable area, which would otherwise be cut
 * off by the scrolling box. The padding leaves room for a focus ring for the same reason, and
 * the margin takes that room back so the first chip lines up with the content around the bar.
 */
export const chipBarClass =
  "-m-1 flex min-h-[calc(var(--acme-size-target-min)+var(--acme-space-2))] items-center gap-2 overflow-x-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
