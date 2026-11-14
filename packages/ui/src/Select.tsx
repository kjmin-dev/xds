import { space } from "@acme/tokens";
import { Description, FieldError, Select as HeroSelect, Label, ListBox } from "@heroui/react";
import { Icon } from "./Icon.tsx";

export type SelectOption<Value extends string = string> = {
  value: Value;
  label: string;
  /** A line of help under the label, in the list only. */
  description?: string;
};

export type SelectProps<Value extends string = string> = {
  /** Always visible, like a TextField's. */
  label: string;
  options: readonly SelectOption<Value>[];
  /** The chosen option. Leave it out while nothing is chosen. */
  value?: Value | undefined;
  onChange: (value: Value) => void;
  /** Shown in the field while nothing is chosen. */
  placeholder?: string;
  /** Help shown under the field. Replaced by `error` while there is one. */
  description?: string;
  /** What is wrong and how to fix it. Clear it when the choice changes. */
  error?: string | undefined;
  /** The name the choice is submitted under with a form. */
  name?: string;
  disabled?: boolean;
};

/**
 * A field for choosing one option from a list too long to show at once. Closed, it looks like a
 * TextField; pressed, it opens the list under itself with a Menu's surface, as wide as the
 * field. Choosing an option calls `onChange` and closes the list; a press outside or Escape
 * closes it too.
 *
 * The field is a button that says it opens a list box and whether the list is open. In the list
 * the arrow keys move, typing jumps to an option, and Enter chooses. The chosen option is
 * selected for assistive technology and marked with a check.
 */
export function Select<Value extends string = string>({
  label,
  options,
  value,
  onChange,
  placeholder,
  description,
  error,
  name,
  disabled = false,
}: SelectProps<Value>) {
  return (
    <HeroSelect
      fullWidth
      // React Aria treats an undefined value as uncontrolled and would keep a choice of its own.
      value={value ?? null}
      onChange={(next) => {
        if (next !== null) onChange(next as Value);
      }}
      isDisabled={disabled}
      isInvalid={error !== undefined}
      {...(placeholder ? { placeholder } : {})}
      {...(name ? { name } : {})}
    >
      <Label>{label}</Label>
      <HeroSelect.Trigger>
        {/* The chosen option's label alone: the list's rows also hold a description and a
            check, which do not belong in the field. */}
        <HeroSelect.Value>
          {({ isPlaceholder, selectedText }) => (isPlaceholder ? placeholder : selectedText)}
        </HeroSelect.Value>
        <Icon name="chevrons-up-down" size="sm" className="text-acme-field-placeholder" />
      </HeroSelect.Trigger>
      {/* One line under the box, as under a TextField: the help or the error. */}
      <div className="flex items-baseline gap-3 empty:hidden">
        {description && <Description>{description}</Description>}
        <FieldError>{error}</FieldError>
      </div>
      <HeroSelect.Popover placement="bottom start" offset={space[1]}>
        <ListBox>
          {options.map((option) => (
            <ListBox.Item key={option.value} id={option.value} textValue={option.label}>
              {({ isSelected }) => (
                <>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{option.label}</span>
                    {option.description && (
                      <span className="truncate text-acme-footnote text-acme-text-secondary">
                        {option.description}
                      </span>
                    )}
                  </span>
                  {/* Unnamed, unlike a Menu's: the option itself reports that it is selected. */}
                  {isSelected && <Icon name="check" size="sm" />}
                </>
              )}
            </ListBox.Item>
          ))}
        </ListBox>
      </HeroSelect.Popover>
    </HeroSelect>
  );
}
