/** Switch's props in every framework, short of `onChange`. */
export type SwitchBaseProps = {
  checked: boolean;
  /** Shown beside the switch. Pressing it toggles too. */
  label?: string;
  /** Names the switch for assistive technology when there is no visible label. */
  "aria-label"?: string;
  disabled?: boolean;
};

// The focus ring of a control that is drawn next to a visually hidden native input.
export const PEER_FOCUS =
  "peer-focus-visible:outline-solid peer-focus-visible:outline-(length:--acme-focus-width) peer-focus-visible:outline-offset-(--acme-focus-offset) peer-focus-visible:outline-acme-border-focus";

/**
 * The label around a Switch's input, which is also a Checkbox's: pressing any of it toggles.
 * The input inside is `peer sr-only`, and the parts after it follow its state.
 */
export const switchClass =
  "relative inline-flex min-h-acme-target-min w-fit cursor-pointer items-center gap-2 has-disabled:cursor-not-allowed";

/** The track, drawn beside the hidden input. */
export const switchTrackClass = `flex h-acme-switch-height w-acme-switch-width shrink-0 rounded-full bg-acme-switch-track p-0.5 transition-colors duration-(--acme-motion-duration-fast) peer-checked:bg-acme-switch-track-on peer-disabled:bg-acme-switch-disabled-track peer-checked:*:translate-x-[calc(var(--acme-size-switch-width)-var(--acme-size-switch-height))] peer-disabled:*:bg-acme-switch-disabled-thumb ${PEER_FOCUS}`;

/** The thumb inside the track. */
export const switchThumbClass =
  "aspect-square h-full rounded-full bg-acme-switch-thumb transition-transform duration-(--acme-motion-duration-fast) ease-(--acme-motion-easing-standard) motion-reduce:transition-none";

/** The visible label after the track, which is also a Checkbox's. */
export const switchLabelClass =
  "text-acme-body text-acme-text-primary peer-disabled:text-acme-text-secondary";
