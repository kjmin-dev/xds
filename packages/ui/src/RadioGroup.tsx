import type { RadioGroupBaseProps } from "@acme/ui-core";
import { useId } from "react";

export type { RadioOption } from "@acme/ui-core";

export type RadioGroupProps<Value extends string = string> = RadioGroupBaseProps<Value> & {
  onChange: (value: Value) => void;
};

/**
 * One choice among a few, applied later with the form it belongs to. For a choice that takes
 * effect at once among two to four options, a SegmentedControl is the usual pick.
 *
 * The chosen option has a dot and a thicker ring, so the choice does not depend on color. The
 * options are native radio buttons, hidden and drawn beside, in a group named by the legend:
 * the arrow keys move between them, and the error is tied to the group and announced.
 */
export function RadioGroup<Value extends string = string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
  error,
  name,
}: RadioGroupProps<Value>) {
  const id = useId();
  const labelId = `${id}-label`;
  const errorId = `${id}-error`;
  const invalid = error !== undefined;
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelId}
      aria-describedby={invalid ? errorId : undefined}
      aria-invalid={invalid || undefined}
      aria-disabled={disabled || undefined}
      aria-orientation="vertical"
      className="radio-group"
    >
      <span id={labelId} className="radio-group__label">
        {label}
      </span>
      <div className="radio-group__options">
        {options.map((option, index) => (
          <label key={option.value} className="radio-group__option">
            <input
              type="radio"
              className="radio-group__input sr-only"
              // Radios group by name, which is what makes the arrow keys move between them.
              name={name ?? id}
              value={option.value}
              checked={option.value === value}
              disabled={disabled}
              // The description is inside the pressable row, so the row's text would name the
              // radio together with it. The label alone names it; the description describes it.
              aria-labelledby={`${id}-${index}`}
              aria-describedby={
                [
                  option.description ? `${id}-${index}-description` : undefined,
                  invalid ? errorId : undefined,
                ]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
              // oxlint-disable-next-line jsx-a11y/role-supports-aria-props -- on each radio as well as the group, so it is heard on the radio that has focus
              aria-invalid={invalid || undefined}
              onChange={() => onChange(option.value)}
            />
            <span className="radio-group__row">
              <span className="radio-group__circle-line">
                <span className="radio-group__circle">
                  <span className="radio-group__dot" />
                </span>
              </span>
              <span className="radio-group__words">
                <span id={`${id}-${index}`} className="radio-group__text">
                  {option.label}
                </span>
                {option.description && (
                  <span id={`${id}-${index}-description`} className="radio-group__description">
                    {option.description}
                  </span>
                )}
              </span>
            </span>
          </label>
        ))}
      </div>
      {/* The region is there before the error is, so that the error is announced when it
          appears. Empty, it takes no room. */}
      <div aria-live="polite">
        {invalid && (
          <span id={errorId} className="radio-group__error">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
