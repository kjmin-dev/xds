import type { RadioGroupBaseProps } from "@acme/ui-core";
import { createUniqueId, For, Show } from "solid-js";
import { keepChecked } from "./controlled.ts";

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
export function RadioGroup<Value extends string = string>(props: RadioGroupProps<Value>) {
  const id = createUniqueId();
  const labelId = `${id}-label`;
  const errorId = `${id}-error`;
  const invalid = () => props.error !== undefined;
  let group!: HTMLDivElement;
  return (
    <div
      ref={(element) => (group = element)}
      role="radiogroup"
      aria-labelledby={labelId}
      aria-describedby={invalid() ? errorId : undefined}
      aria-invalid={invalid() ? "true" : undefined}
      aria-disabled={props.disabled ? "true" : undefined}
      aria-orientation="vertical"
      class="radio-group"
    >
      <span id={labelId} class="radio-group__label">
        {props.label}
      </span>
      <div class="radio-group__options">
        <For each={props.options}>
          {(option, index) => (
            <label class="radio-group__option">
              <input
                type="radio"
                class="radio-group__input sr-only"
                // Radios group by name, which is what makes the arrow keys move between them.
                name={props.name ?? id}
                value={option.value}
                checked={option.value === props.value}
                disabled={props.disabled}
                // The description is inside the pressable row, so the row's text would name the
                // radio together with it. The label alone names it; the description describes it.
                aria-labelledby={`${id}-${index()}`}
                aria-describedby={
                  [
                    option.description ? `${id}-${index()}-description` : undefined,
                    invalid() ? errorId : undefined,
                  ]
                    .filter(Boolean)
                    .join(" ") || undefined
                }
                // oxlint-disable-next-line jsx-a11y/role-supports-aria-props -- on each radio as well as the group, as in the React library, so it is heard on the radio that has focus
                aria-invalid={invalid() ? "true" : undefined}
                onChange={() => {
                  props.onChange(option.value);
                  // The browser moved the dot already; where the parent kept the old value, it
                  // goes back, on every radio of the group.
                  for (const input of group.querySelectorAll("input")) {
                    keepChecked(input, () => input.value === props.value);
                  }
                }}
              />
              <span class="radio-group__row">
                <span class="radio-group__circle-line">
                  <span class="radio-group__circle">
                    <span class="radio-group__dot" />
                  </span>
                </span>
                <span class="radio-group__words">
                  <span id={`${id}-${index()}`} class="radio-group__text">
                    {option.label}
                  </span>
                  <Show when={option.description}>
                    <span id={`${id}-${index()}-description`} class="radio-group__description">
                      {option.description}
                    </span>
                  </Show>
                </span>
              </span>
            </label>
          )}
        </For>
      </div>
      {/* The region is there before the error is, so that the error is announced when it
          appears. Empty, it takes no room. */}
      <div aria-live="polite">
        <Show when={props.error}>
          <span id={errorId} class="radio-group__error">
            {props.error}
          </span>
        </Show>
      </div>
    </div>
  );
}
