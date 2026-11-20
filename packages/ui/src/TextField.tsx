import { classes, type TextFieldBaseProps } from "@acme/ui-core";
import { type ReactNode, useId } from "react";
import type { RootProps } from "./root.ts";

export type TextFieldProps = TextFieldBaseProps &
  RootProps & {
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
  className,
  style,
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
    className: grouped
      ? "acme-text-field__input"
      : "acme-text-field__input acme-text-field__control",
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
    <div className={classes("acme-text-field", className)} style={style}>
      <label htmlFor={id} className="acme-text-field__label">
        {label}
      </label>
      {grouped ? (
        <div className="acme-text-field__control acme-text-field__group">
          {leading != null && (
            <span className="acme-text-field__slot acme-text-field__slot--leading">{leading}</span>
          )}
          {field}
          {trailing != null && (
            <span className="acme-text-field__slot acme-text-field__slot--trailing">
              {trailing}
            </span>
          )}
        </div>
      ) : (
        field
      )}
      {/* One line under the box: the help or the error at the start edge, the count at the
          end. The error is a live region, so it is announced when it appears. */}
      <div className="acme-text-field__footer">
        {!invalid && description && (
          <span id={descriptionId} className="acme-text-field__description">
            {description}
          </span>
        )}
        <span id={errorId} className="acme-text-field__error" aria-live="polite">
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
