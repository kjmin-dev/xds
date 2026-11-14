import { PEER_FOCUS } from "./switch.ts";

/** SegmentedControl's props in every framework, short of `onChange`. */
export type SegmentedControlBaseProps<Value extends string> = {
  options: readonly { value: Value; label: string }[];
  value: Value;
  /** Says what is being chosen, for assistive technology. */
  "aria-label": string;
  /** Stretches to the width of its container. */
  fullWidth?: boolean;
};

/** The track the segments sit in. */
export function segmentedControlClass(fullWidth = false): string {
  return `h-acme-control-md rounded-acme-md bg-acme-segmented-track p-0.5 ${fullWidth ? "flex w-full" : "inline-flex w-fit"}`;
}

/** The label around each segment's hidden radio button. */
export function segmentedControlOptionClass(fullWidth = false): string {
  return `relative flex cursor-pointer ${fullWidth ? "flex-1" : ""}`;
}

/**
 * The segment drawn beside the hidden radio button. The border is there on every segment,
 * transparent until selected, so selecting does not move the text.
 */
export const segmentedControlSegmentClass = `flex w-full items-center justify-center whitespace-nowrap rounded-[calc(var(--acme-radius-md)-2px)] border border-transparent px-4 text-acme-label text-acme-segmented-text peer-checked:border-acme-segmented-selected-border peer-checked:bg-acme-segmented-selected-background peer-checked:text-acme-segmented-selected-text peer-checked:shadow-acme-subtle ${PEER_FOCUS}`;
