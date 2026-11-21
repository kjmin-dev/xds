import {
  CHECKBOX_MARK,
  type CheckboxBaseProps,
  checkboxBoxClass,
  checkboxClass,
  checkboxLabelClass,
  checkboxMarkClass,
  classes,
  rootPart,
} from "@acme/ui-core";
import type { RootProps } from "./root.ts";

export type CheckboxProps = CheckboxBaseProps &
  RootProps & {
    onChange: (checked: boolean) => void;
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
  className,
  style,
  ...aria
}: CheckboxProps) {
  return (
    <label className={classes(rootPart("Checkbox"), checkboxClass, className)} style={style}>
      <input
        {...aria}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        {...(name ? { name } : {})}
      />
      <span className={checkboxBoxClass}>
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={checkboxMarkClass}>
          <path
            d={CHECKBOX_MARK}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {label && <span className={checkboxLabelClass}>{label}</span>}
    </label>
  );
}
