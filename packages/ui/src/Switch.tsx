// The focus ring of a control that is drawn next to a visually hidden native input.
export const PEER_FOCUS =
  "peer-focus-visible:outline-solid peer-focus-visible:outline-(length:--acme-focus-width) peer-focus-visible:outline-offset-(--acme-focus-offset) peer-focus-visible:outline-acme-border-focus";

export type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Shown beside the switch. Pressing it toggles too. */
  label?: string;
  /** Names the switch for assistive technology when there is no visible label. */
  "aria-label"?: string;
  disabled?: boolean;
};

/**
 * Turns a setting on or off, and takes effect at once. For a choice that is applied later,
 * with a form, use a Checkbox.
 *
 * It is a native checkbox with the switch role, so the keyboard, forms and screen readers
 * treat it as one. The input is hidden and the track is drawn beside it.
 */
export function Switch({ checked, onChange, label, disabled = false, ...aria }: SwitchProps) {
  return (
    <label className="relative inline-flex min-h-acme-target-min w-fit cursor-pointer items-center gap-2 has-disabled:cursor-not-allowed">
      <input
        {...aria}
        type="checkbox"
        role="switch"
        aria-checked={checked}
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span
        className={`flex h-acme-switch-height w-acme-switch-width shrink-0 rounded-full bg-acme-switch-track p-0.5 transition-colors duration-(--acme-motion-duration-fast) peer-checked:bg-acme-switch-track-on peer-disabled:bg-acme-switch-disabled-track peer-checked:*:translate-x-[calc(var(--acme-size-switch-width)-var(--acme-size-switch-height))] peer-disabled:*:bg-acme-switch-disabled-thumb ${PEER_FOCUS}`}
      >
        <span className="aspect-square h-full rounded-full bg-acme-switch-thumb transition-transform duration-(--acme-motion-duration-fast) ease-(--acme-motion-easing-standard) motion-reduce:transition-none" />
      </span>
      {label && (
        <span className="text-acme-body text-acme-text-primary peer-disabled:text-acme-text-secondary">
          {label}
        </span>
      )}
    </label>
  );
}
