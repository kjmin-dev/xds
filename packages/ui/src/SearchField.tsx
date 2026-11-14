import type { SearchFieldBaseProps } from "@acme/ui-core";
import { useRef } from "react";
import { Icon } from "./Icon.tsx";

export type SearchFieldProps = SearchFieldBaseProps & {
  onChange: (value: string) => void;
  /** Called with the query on Enter, or on the search key of a software keyboard. */
  onSubmit?: (value: string) => void;
};

/**
 * A text field for a query: TextField's box as a pill, with a search icon in front and, while
 * there is a value, a control that clears it. Escape clears too.
 *
 * Use it to filter or search what is on the screen. For a value that is saved with a form,
 * use a TextField, which has a visible label.
 */
export function SearchField({
  value,
  onChange,
  onSubmit,
  label,
  placeholder,
  disabled = false,
  clearLabel = "Clear",
}: SearchFieldProps) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="text-field">
      <div className="text-field__control text-field__control--pill text-field__group">
        <span className="text-field__slot text-field__slot--leading">
          <Icon name="search" size="sm" />
        </span>
        <input
          ref={input}
          type="text"
          className="text-field__input"
          aria-label={label}
          enterKeyHint="search"
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          // Escape clears only while there is something to clear; an empty field lets Escape
          // through to whatever it sits in, such as a dialog.
          data-uses-escape={value !== "" ? "" : undefined}
          onChange={(event) => onChange(event.currentTarget.value)}
          onKeyDown={(event) => {
            // While a composition is open, Enter and Escape belong to the input method.
            if (event.nativeEvent.isComposing) return;
            if (event.key === "Enter") onSubmit?.(value);
            if (event.key === "Escape" && value !== "") {
              event.stopPropagation();
              onChange("");
            }
          }}
        />
        {value !== "" && !disabled && (
          <span className="text-field__slot text-field__slot--trailing">
            <button
              type="button"
              aria-label={clearLabel}
              onClick={() => {
                onChange("");
                // The control is about to disappear, and focus would be lost with it.
                input.current?.focus();
              }}
              className="-me-1 flex size-acme-target-min cursor-pointer items-center justify-center rounded-acme-full hover:text-acme-field-text focus-visible:outline-(length:--acme-focus-width) focus-visible:outline-acme-border-focus focus-visible:outline-solid"
            >
              <Icon name="circle-x" size="sm" />
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
