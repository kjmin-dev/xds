import { Icon, type IconName } from "./Icon.tsx";

export type ChipProps = {
  label: string;
  /** Whether the chip's filter is on. The app holds this state. */
  selected?: boolean;
  onPress?: () => void;
  /** An icon in front of the label. A selected chip shows a check mark in its place. */
  iconStart?: IconName;
  disabled?: boolean;
};

/**
 * A choice that filters what is shown. Unlike a Badge it is pressed. A selected chip is tinted,
 * outlined and marked with a check, so the state does not depend on color.
 *
 * It is a toggle button: assistive technology hears whether it is pressed.
 */
export function Chip({ label, selected = false, onPress, iconStart, disabled = false }: ChipProps) {
  const icon = selected ? "check" : iconStart;
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onPress}
      // The border is there on every chip, transparent until selected, so selecting does not
      // change the size. The `before` box is the pressable area, which is taller than the chip
      // where fingers need it to be.
      className={`relative inline-flex h-acme-chip shrink-0 cursor-pointer items-center gap-1.5 rounded-acme-full border px-3 text-acme-label whitespace-nowrap transition-colors duration-(--acme-motion-duration-fast) before:absolute before:inset-x-0 before:top-1/2 before:h-[max(100%,var(--acme-size-target-min))] before:-translate-y-1/2 focus-visible:outline-(length:--acme-focus-width) focus-visible:outline-offset-(--acme-focus-offset) focus-visible:outline-acme-border-focus focus-visible:outline-solid disabled:cursor-not-allowed disabled:border-transparent disabled:bg-acme-chip-disabled-background disabled:text-acme-chip-disabled-text ${
        selected
          ? "border-acme-chip-selected-border bg-acme-chip-selected-background text-acme-chip-selected-text enabled:hover:bg-acme-chip-selected-background-hover enabled:active:bg-acme-chip-selected-background-pressed"
          : "border-transparent bg-acme-chip-background text-acme-chip-text enabled:hover:bg-acme-chip-background-hover enabled:active:bg-acme-chip-background-pressed"
      }`}
    >
      {icon && <Icon name={icon} size="sm" />}
      {label}
    </button>
  );
}
