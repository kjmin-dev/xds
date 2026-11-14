import { space } from "@acme/tokens";
import {
  keepListKeys,
  type SelectBaseProps,
  type SelectOption,
  selectOptionIds,
} from "@acme/ui-core";
import { type JSX, Portal } from "@solidjs/web";
import * as select from "@zag-js/select";
import { mergeProps, normalizeProps, useMachine } from "@zag-js/solid";
import { createMemo, createUniqueId, For, Show } from "solid-js";
import { Icon } from "./Icon.tsx";
import { modalPopover } from "./modal-popover.ts";
import { createPresence } from "./presence.ts";

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
export function Select<Value extends string = string>(props: SelectProps<Value>) {
  const id = createUniqueId();
  const valueId = `${id}-value`;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const invalid = () => props.error !== undefined;
  const collection = createMemo(() =>
    select.collection<SelectOption<Value>>({
      items: [...props.options],
      itemToValue: (option) => option.value,
      itemToString: (option) => option.label,
    }),
  );
  const service = useMachine(select.machine, () => ({
    id,
    collection: collection(),
    value: props.value === undefined ? [] : [props.value],
    onValueChange: (details: select.ValueChangeDetails<SelectOption<Value>>) => {
      const next = details.value[0];
      if (next !== undefined) props.onChange(next as Value);
    },
    disabled: props.disabled,
    invalid: invalid(),
    name: props.name,
    positioning: {
      placement: "bottom-start" as const,
      gutter: space[1],
      sameWidth: true,
      // The list keeps this far from the window's edges.
      overflowPadding: space[3],
    },
  }));
  const api = createMemo(() => select.connect(service, normalizeProps));
  // Zag's key handlers read whether a search by typing is under way when the field renders,
  // and a search ends on a timer, which renders nothing: long after a search, Space would
  // still search for a space instead of opening the list or choosing. A handler taken from
  // the machine when the key comes reads it then.
  const current = () => select.connect(service, normalizeProps);
  // A span: the field is a button, which a <label> cannot point at. A press on it still
  // focuses the field.
  const labelProps = createMemo(() => {
    const { for: _, ...rest } = api().getLabelProps() as JSX.LabelHTMLAttributes<HTMLElement>;
    return rest as JSX.HTMLAttributes<HTMLSpanElement>;
  });
  // A button that opens a list box, rather than Zag's combobox: named by the chosen option and
  // then the label, and described by the help or the error. The error is said there, so the
  // button itself does not claim to be invalid or required.
  const triggerProps = createMemo(() => {
    const {
      role: _role,
      "aria-invalid": _invalid,
      "aria-required": _required,
      onKeyDown: _onKeyDown,
      ...rest
    } = api().getTriggerProps() as JSX.ButtonHTMLAttributes<HTMLButtonElement>;
    return {
      ...rest,
      // Home and End leave a closed field to the page; Zag would choose the first or the last
      // option.
      onKeyDown: (event: KeyboardEvent) => {
        if (!api().open && (event.key === "Home" || event.key === "End")) return;
        (current().getTriggerProps().onKeyDown as KeyHandler | undefined)?.(event);
      },
    };
  });
  let positioner: HTMLDivElement | undefined;
  let surface: HTMLDivElement | undefined;
  modalPopover(
    () => api().open,
    () => positioner,
  );
  const present = createPresence(
    () => api().open,
    () => [surface],
  );
  const content = mergeProps(
    () => {
      const { onKeyDown: _onKeyDown, ...rest } = api().getContentProps();
      return rest;
    },
    {
      onKeyDown: (event: KeyboardEvent) => {
        keepListKeys(event, surface, ".select__item:not([data-disabled])", (value) =>
          api().setHighlightedValue(value),
        );
        (current().getContentProps().onKeyDown as KeyHandler | undefined)?.(event);
      },
    },
  );
  return (
    <div {...api().getRootProps()} class="select">
      <span {...labelProps()} class="select__label">
        {props.label}
      </span>
      <button
        {...triggerProps()}
        aria-labelledby={`${valueId} ${labelProps().id}`}
        aria-describedby={invalid() ? errorId : props.description ? descriptionId : undefined}
        class="select__trigger"
      >
        {/* The chosen option's label alone: the list's rows also hold a description and a
            check, which do not belong in the field. */}
        <span {...api().getValueTextProps()} id={valueId} class="select__value">
          {api().valueAsString || props.placeholder}
        </span>
        <Icon name="chevrons-up-down" size="sm" class="text-acme-field-placeholder" />
      </button>
      {/* One line under the box: the help, or the error in its place. */}
      <Show when={invalid() || props.description}>
        <div class="select__footer">
          <Show
            when={invalid()}
            fallback={
              <span id={descriptionId} class="select__description">
                {props.description}
              </span>
            }
          >
            <span id={errorId} class="select__error">
              {props.error}
            </span>
          </Show>
        </div>
      </Show>
      {/* What a form submits; the first option stands for no choice. */}
      <select {...api().getHiddenSelectProps()}>
        {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label -- Zag's props hide the select from assistive technology, which uses the trigger */}
        <option value="" />
        <For each={props.options}>
          {(option) => <option value={option.value}>{option.label}</option>}
        </For>
      </select>
      <Portal>
        <Show when={api().open}>
          {/* Takes a press outside, which then only closes the list. The focus stays in the
              list until the list hands it back to the field. */}
          {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- not a control: the handler only keeps the focus where it is */}
          <div class="select__underlay" onMouseDown={(event) => event.preventDefault()} />
        </Show>
        <div
          ref={(element) => (positioner = element)}
          {...api().getPositionerProps()}
          class="select__positioner"
        >
          {/* Shown until its exit animation ends; Zag would hide it as it closes. */}
          <div
            {...content}
            ref={(element) => (surface = element)}
            hidden={!present()}
            class="select__content"
          >
            <div {...api().getListProps()} class="select__list">
              <For each={collection().items}>
                {(option, index) => {
                  const ids = () => selectOptionIds(id, index());
                  return (
                    // Named by its label alone, as the field shows it; the help line describes it.
                    <div
                      {...api().getItemProps({ item: option })}
                      aria-labelledby={ids().label}
                      aria-describedby={option.description ? ids().description : undefined}
                      class="select__item"
                    >
                      <span class="select__item-words">
                        <span
                          {...api().getItemTextProps({ item: option })}
                          id={ids().label}
                          class="select__item-label"
                        >
                          {option.label}
                        </span>
                        <Show when={option.description}>
                          <span id={ids().description} class="select__item-description">
                            {option.description}
                          </span>
                        </Show>
                      </span>
                      {/* Unnamed, unlike a Menu's: the option itself reports that it is selected. */}
                      <Show when={api().getItemState({ item: option }).selected}>
                        <Icon name="check" size="sm" />
                      </Show>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>
        </div>
      </Portal>
    </div>
  );
}
