import { TextField as HeroTextField, InputGroup } from "@heroui/react";
import { useRef } from "react";
import { Icon } from "./Icon.tsx";

export type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  /** Called with the query on Enter, or on the search key of a software keyboard. */
  onSubmit?: (value: string) => void;
  /** The accessible name. It is not shown: the search icon says what the field is for. */
  label: string;
  placeholder?: string;
  disabled?: boolean;
  /** Names the control that empties the field, for assistive technology. */
  clearLabel?: string;
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
    <HeroTextField
      fullWidth
      aria-label={label}
      value={value}
      onChange={onChange}
      isDisabled={disabled}
    >
      <InputGroup fullWidth className="input-group--pill">
        <InputGroup.Prefix>
          <Icon name="search" size="sm" />
        </InputGroup.Prefix>
        <InputGroup.Input
          ref={input}
          enterKeyHint="search"
          {...(placeholder ? { placeholder } : {})}
          onKeyDown={(event) => {
            // While a composition is open, Enter and Escape belong to the input method.
            if (event.nativeEvent.isComposing) return;
            if (event.key === "Enter") onSubmit?.(value);
            if (event.key === "Escape" && value !== "") {
              // Only the clearing uses the key up: an empty field lets Escape through to
              // whatever it sits in, such as a dialog.
              event.stopPropagation();
              onChange("");
            }
          }}
        />
        {value !== "" && !disabled && (
          <InputGroup.Suffix>
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
          </InputGroup.Suffix>
        )}
      </InputGroup>
    </HeroTextField>
  );
}
