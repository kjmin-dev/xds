import {
  type SwitchBaseProps,
  switchClass,
  switchLabelClass,
  switchThumbClass,
  switchTrackClass,
} from "@acme/ui-core";

export type SwitchProps = SwitchBaseProps & {
  onChange: (checked: boolean) => void;
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
    <label className={switchClass}>
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
      <span className={switchTrackClass}>
        <span className={switchThumbClass} />
      </span>
      {label && <span className={switchLabelClass}>{label}</span>}
    </label>
  );
}
