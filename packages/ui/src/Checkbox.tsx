import { PEER_FOCUS } from "./Switch.tsx";

export type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Shown beside the box. Pressing it toggles too. */
  label?: string;
  /** Names the checkbox for assistive technology when there is no visible label. */
  "aria-label"?: string;
  name?: string;
  disabled?: boolean;
};

/**
 * A choice that is applied later, with the form it belongs to. A native checkbox: the input is
 * hidden and the box is drawn beside it.
 */
export function Checkbox({
  checked,
  onChange,
  label,
  name,
  disabled = false,
  ...aria
}: CheckboxProps) {
  return (
    <label className="relative inline-flex min-h-acme-target-min w-fit cursor-pointer items-center gap-2 has-disabled:cursor-not-allowed">
      <input
        {...aria}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        {...(name ? { name } : {})}
      />
      {/* The outline is what makes an empty box visible; a filled one does not need it. */}
      <span
        className={`flex size-acme-checkbox shrink-0 items-center justify-center rounded-acme-sm border-2 border-acme-checkbox-border text-acme-checkbox-mark peer-checked:border-0 peer-checked:bg-acme-checkbox-background-checked peer-disabled:border-0 peer-disabled:bg-acme-checkbox-disabled-background peer-disabled:text-acme-checkbox-disabled-mark *:opacity-0 peer-checked:*:opacity-100 ${PEER_FOCUS}`}
      >
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="size-3/4">
          <path
            d="m3.5 8.5 3 3 6-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {label && (
        <span className="text-acme-body text-acme-text-primary peer-disabled:text-acme-text-secondary">
          {label}
        </span>
      )}
    </label>
  );
}
