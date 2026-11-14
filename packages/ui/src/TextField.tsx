import type { TextFieldBaseProps } from "@acme/ui-core";
import { type ReactNode, useId } from "react";

export type TextFieldProps = TextFieldBaseProps & {
  onChange: (value: string) => void;
  /**
   * Inside the box, in front of the text: an icon, a unit. It takes the placeholder's color
   * unless it sets its own.
   */
  leading?: ReactNode;
  /** Inside the box, after the text: an icon, a unit, a small button. */
  trailing?: ReactNode;
};

/**
 * A labelled text field, of one line or several. The label, the description and the error
 * message are tied to the input for assistive technology, and the error is announced when it
 * appears.
 *
 * An invalid field blocks its form from being submitted, so `error` has to be cleared as soon as
 * the person edits the value.
 */
export function TextField({
  label,
  value,
  onChange,
  description,
  error,
  placeholder,
  leading,
  trailing,
  multiline = false,
  rows = 3,
  maxLength,
  name,
  type = "text",
  inputMode,
  autoComplete,
  autoFocus = false,
  required = false,
  disabled = false,
}: TextFieldProps) {
  const id = useId();
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const invalid = error !== undefined;
  // The box is drawn by the input itself until something has to sit inside it beside the
  // text; then a group draws the box and the input inside it has none.
  const grouped = leading != null || trailing != null;
  const shared = {
    id,
    className: grouped ? "text-field__input" : "text-field__input text-field__control",
    value,
    placeholder,
    name,
    maxLength,
    inputMode,
    autoComplete,
    autoFocus,
    required,
    disabled,
    "aria-invalid": invalid || undefined,
    "aria-errormessage": invalid ? errorId : undefined,
    "aria-describedby": invalid ? errorId : description ? descriptionId : undefined,
  };
  const field = multiline ? (
    <textarea {...shared} rows={rows} onChange={(event) => onChange(event.currentTarget.value)} />
  ) : (
    <input {...shared} type={type} onChange={(event) => onChange(event.currentTarget.value)} />
  );
  return (
    <div className="text-field">
      <label htmlFor={id} className="text-field__label">
        {label}
      </label>
      {grouped ? (
        <div className="text-field__control text-field__group">
          {leading != null && (
            <span className="text-field__slot text-field__slot--leading">{leading}</span>
          )}
          {field}
          {trailing != null && (
            <span className="text-field__slot text-field__slot--trailing">{trailing}</span>
          )}
        </div>
      ) : (
        field
      )}
      {/* One line under the box: the help or the error at the start edge, the count at the
          end. The error is a live region, so it is announced when it appears. */}
      <div className="text-field__footer">
        {!invalid && description && (
          <span id={descriptionId} className="text-field__description">
            {description}
          </span>
        )}
        <span id={errorId} className="text-field__error" aria-live="polite">
          {error}
        </span>
        {maxLength !== undefined && (
          <span className="ms-auto shrink-0 text-acme-footnote text-acme-text-secondary tabular-nums">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}
