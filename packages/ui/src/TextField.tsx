import {
  Description,
  FieldError,
  TextField as HeroTextField,
  Input,
  InputGroup,
  Label,
  TextArea,
} from "@heroui/react";
import type { HTMLInputAutoCompleteAttribute, HTMLInputTypeAttribute, ReactNode } from "react";

export type TextFieldProps = {
  /** Always visible. A placeholder is not a label: it disappears as soon as the person types. */
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Help shown under the field. Replaced by `error` while there is one. */
  description?: string;
  /** What is wrong and how to fix it. Clear it when the value changes. */
  error?: string | undefined;
  placeholder?: string;
  /**
   * Inside the box, in front of the text: an icon, a unit. It takes the placeholder's color
   * unless it sets its own.
   */
  leading?: ReactNode;
  /** Inside the box, after the text: an icon, a unit, a small button. */
  trailing?: ReactNode;
  /** A text area of `rows` lines, which scrolls beyond that. `type` does not apply to it. */
  multiline?: boolean;
  rows?: number;
  /** The field takes no more characters than this, and counts them under its end edge. */
  maxLength?: number;
  name?: string;
  type?: HTMLInputTypeAttribute;
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "email" | "url" | "search";
  autoComplete?: HTMLInputAutoCompleteAttribute;
  autoFocus?: boolean;
  required?: boolean;
  disabled?: boolean;
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
  const control = placeholder ? { placeholder } : {};
  // The box is drawn by the input itself until something has to sit inside it beside the
  // text; then a group draws the box and the input inside it has none.
  const grouped = leading != null || trailing != null;
  return (
    <HeroTextField
      fullWidth
      type={type}
      value={value}
      onChange={onChange}
      isInvalid={error !== undefined}
      isRequired={required}
      isDisabled={disabled}
      autoFocus={autoFocus}
      {...(maxLength === undefined ? {} : { maxLength })}
      {...(name ? { name } : {})}
      {...(inputMode ? { inputMode } : {})}
      {...(autoComplete ? { autoComplete } : {})}
    >
      <Label>{label}</Label>
      {grouped ? (
        <InputGroup fullWidth>
          {leading != null && <InputGroup.Prefix>{leading}</InputGroup.Prefix>}
          {multiline ? (
            <InputGroup.TextArea rows={rows} {...control} />
          ) : (
            <InputGroup.Input {...control} />
          )}
          {trailing != null && <InputGroup.Suffix>{trailing}</InputGroup.Suffix>}
        </InputGroup>
      ) : multiline ? (
        <TextArea rows={rows} {...control} />
      ) : (
        <Input {...control} />
      )}
      {/* One line under the box: the help or the error at the start edge, the count at the
          end. With none of them it is empty and takes no room. */}
      <div className="flex items-baseline gap-3 empty:hidden">
        {description && <Description>{description}</Description>}
        <FieldError>{error}</FieldError>
        {maxLength !== undefined && (
          <span className="ms-auto shrink-0 text-acme-footnote text-acme-text-secondary tabular-nums">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </HeroTextField>
  );
}
