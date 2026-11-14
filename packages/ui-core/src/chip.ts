import type { IconName } from "@acme/tokens";

/** Chip's props in every framework, short of `onPress`. */
export type ChipBaseProps = {
  label: string;
  /** Whether the chip's filter is on. The app holds this state. */
  selected?: boolean;
  /** An icon in front of the label. A selected chip shows a check mark in its place. */
  iconStart?: IconName;
  disabled?: boolean;
};

/**
 * The classes of a Chip, a native toggle button. The border is there on every chip,
 * transparent until selected, so selecting does not change the size. The `before` box is the
 * pressable area, which is taller than the chip where fingers need it to be.
 */
export function chipClass(selected = false): string {
  return `relative inline-flex h-acme-chip shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-acme-full border px-3 text-acme-label transition-colors duration-(--acme-motion-duration-fast) before:absolute before:inset-x-0 before:top-1/2 before:h-[max(100%,var(--acme-size-target-min))] before:-translate-y-1/2 focus-visible:outline-solid focus-visible:outline-(length:--acme-focus-width) focus-visible:outline-offset-(--acme-focus-offset) focus-visible:outline-acme-border-focus disabled:cursor-not-allowed disabled:border-transparent disabled:bg-acme-chip-disabled-background disabled:text-acme-chip-disabled-text ${
    selected
      ? "border-acme-chip-selected-border bg-acme-chip-selected-background text-acme-chip-selected-text enabled:hover:bg-acme-chip-selected-background-hover enabled:active:bg-acme-chip-selected-background-pressed"
      : "border-transparent bg-acme-chip-background text-acme-chip-text enabled:hover:bg-acme-chip-background-hover enabled:active:bg-acme-chip-background-pressed"
  }`;
}

/** The icon in front of the label: a check while selected, so the state is not color alone. */
export function chipIcon(options: {
  selected?: boolean | undefined;
  iconStart?: IconName | undefined;
}): IconName | undefined {
  return options.selected ? "check" : options.iconStart;
}
