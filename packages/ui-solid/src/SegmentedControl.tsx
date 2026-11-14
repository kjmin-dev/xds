import {
  type SegmentedControlBaseProps,
  segmentedControlClass,
  segmentedControlOptionClass,
  segmentedControlSegmentClass,
} from "@acme/ui-core";
import { createUniqueId, For } from "solid-js";
import { keepChecked } from "./controlled.ts";

export type SegmentedControlProps<Value extends string> = SegmentedControlBaseProps<Value> & {
  onChange: (value: Value) => void;
};

/**
 * A choice between a few views or modes, all visible at once. The selected segment is outlined
 * as well as filled, so the choice does not depend on telling two greys apart.
 *
 * It is a group of native radio buttons, so the arrow keys move between segments.
 */
export function SegmentedControl<Value extends string>(props: SegmentedControlProps<Value>) {
  const name = createUniqueId();
  let group!: HTMLDivElement;
  return (
    <div
      ref={(element) => (group = element)}
      aria-label={props["aria-label"]}
      role="radiogroup"
      class={segmentedControlClass(props.fullWidth)}
    >
      <For each={props.options}>
        {(option) => (
          <label class={segmentedControlOptionClass(props.fullWidth)}>
            <input
              type="radio"
              name={name}
              value={option.value}
              class="peer sr-only"
              checked={option.value === props.value}
              onChange={() => {
                props.onChange(option.value);
                // The browser moved the dot already; where the parent kept the old value, it
                // goes back, on every radio of the group.
                for (const input of group.querySelectorAll("input")) {
                  keepChecked(input, () => input.value === props.value);
                }
              }}
            />
            <span class={segmentedControlSegmentClass}>{option.label}</span>
          </label>
        )}
      </For>
    </div>
  );
}
