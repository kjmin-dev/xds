import { space } from "@acme/tokens";
import {
  keepListKeys,
  type SelectBaseProps,
  type SelectOption,
  selectOptionIds,
} from "@acme/ui-core";
import { normalizeProps, useMachine } from "@zag-js/react";
import * as select from "@zag-js/select";
import { type KeyboardEvent, useId, useMemo, useRef } from "react";
import { Icon } from "./Icon.tsx";
import { useModalPopover } from "./modal-popover.ts";
import { Portal } from "./portal.tsx";
import { usePresence } from "./presence.ts";

export type { SelectOption } from "@acme/ui-core";

export type SelectProps<Value extends string = string> = SelectBaseProps<Value> & {
  onChange: (value: Value) => void;
};

type KeyHandler = (event: KeyboardEvent) => void;

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
  const id = useId();
  const valueId = `${id}-value`;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const invalid = error !== undefined;
  const collection = useMemo(
    () =>
      select.collection<SelectOption<Value>>({
        items: [...options],
        itemToValue: (option) => option.value,
        itemToString: (option) => option.label,
      }),
    [options],
  );
  const service = useMachine(select.machine, {
    id,
    collection,
    value: value === undefined ? [] : [value],
    onValueChange: (details) => {
      const next = details.value[0];
      if (next !== undefined) onChange(next as Value);
    },
    disabled,
    invalid,
    name,
    positioning: {
      placement: "bottom-start",
      gutter: space[1],
      sameWidth: true,
      // The list keeps this far from the window's edges.
      overflowPadding: space[3],
    },
  });
  const api = select.connect(service, normalizeProps);
  // Zag's key handlers read whether a search by typing is under way when the field renders,
  // and a search ends on a timer, which renders nothing: long after a search, Space would
  // still search for a space instead of opening the list or choosing. A handler taken from
  // the machine when the key comes reads it then.
  const current = () => select.connect(service, normalizeProps);
  // A span: the field is a button, which a <label> cannot point at. A press on it still
  // focuses the field.
  const { htmlFor: _for, ...labelProps } = api.getLabelProps();
  // A button that opens a list box, rather than Zag's combobox: named by the chosen option and
  // then the label, and described by the help or the error. The error is said there, so the
  // button itself does not claim to be invalid or required.
  const {
    role: _role,
    "aria-invalid": _invalid,
    "aria-required": _required,
    onKeyDown: _onTriggerKeyDown,
    ...triggerProps
  } = api.getTriggerProps();
  const positioner = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const { onKeyDown: _onContentKeyDown, ...contentProps } = api.getContentProps();
  const content = {
    ...contentProps,
    onKeyDown: (event: KeyboardEvent) => {
      // Ahead of Zag's handler, which skips a key that was already handled.
      keepListKeys(event, surface.current, ".select__item:not([data-disabled])", (row) =>
        api.setHighlightedValue(row),
      );
      (current().getContentProps().onKeyDown as KeyHandler | undefined)?.(event);
    },
  };
  useModalPopover(api.open, () => positioner.current);
  const present = usePresence(api.open, () => [surface.current]);
  return (
    <div {...api.getRootProps()} className="select">
      <span {...labelProps} className="select__label">
        {label}
      </span>
      <button
        {...triggerProps}
        aria-labelledby={`${valueId} ${labelProps.id}`}
        aria-describedby={invalid ? errorId : description ? descriptionId : undefined}
        onKeyDown={(event) => {
          const now = current();
          // Home and End leave a closed field to the page; Zag would choose the first or the
          // last option.
          if (!now.open && (event.key === "Home" || event.key === "End")) return;
          (now.getTriggerProps().onKeyDown as KeyHandler | undefined)?.(event);
        }}
        type="button"
        className="select__trigger"
      >
        {/* The chosen option's label alone: the list's rows also hold a description and a
            check, which do not belong in the field. */}
        <span {...api.getValueTextProps()} id={valueId} className="select__value">
          {api.valueAsString || placeholder}
        </span>
        <Icon name="chevrons-up-down" size="sm" className="text-acme-field-placeholder" />
      </button>
      {/* One line under the box: the help, or the error in its place. */}
      {(invalid || description) && (
        <div className="select__footer">
          {invalid ? (
            <span id={errorId} className="select__error">
              {error}
            </span>
          ) : (
            <span id={descriptionId} className="select__description">
              {description}
            </span>
          )}
        </div>
      )}
      {/* What a form submits; the first option stands for no choice. */}
      <select {...api.getHiddenSelectProps()}>
        {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label -- Zag's props hide the select from assistive technology, which uses the trigger */}
        <option value="" />
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Portal>
        {api.open && (
          // Takes a press outside, which then only closes the list. The focus stays in the
          // list until the list hands it back to the field.
          // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- not a control: the handler only keeps the focus where it is
          <div className="select__underlay" onMouseDown={(event) => event.preventDefault()} />
        )}
        <div {...api.getPositionerProps()} ref={positioner} className="select__positioner">
          {/* Shown until its exit animation ends; Zag would hide it as it closes. */}
          <div {...content} ref={surface} hidden={!present} className="select__content">
            <div {...api.getListProps()} className="select__list">
              {collection.items.map((option, index) => {
                const ids = selectOptionIds(id, index);
                return (
                  // Named by its label alone, as the field shows it; the help line describes it.
                  <div
                    key={option.value}
                    {...api.getItemProps({ item: option })}
                    aria-labelledby={ids.label}
                    aria-describedby={option.description ? ids.description : undefined}
                    className="select__item"
                  >
                    <span className="select__item-words">
                      <span
                        {...api.getItemTextProps({ item: option })}
                        id={ids.label}
                        className="select__item-label"
                      >
                        {option.label}
                      </span>
                      {option.description && (
                        <span id={ids.description} className="select__item-description">
                          {option.description}
                        </span>
                      )}
                    </span>
                    {/* Unnamed, unlike a Menu's: the option itself reports that it is selected. */}
                    {api.getItemState({ item: option }).selected && <Icon name="check" size="sm" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Portal>
    </div>
  );
}
