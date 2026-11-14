import {
  CHECKBOX_MARK,
  type CheckboxBaseProps,
  checkboxBoxClass,
  checkboxClass,
  checkboxLabelClass,
  checkboxMarkClass,
} from "@acme/ui-core";
import { Show } from "solid-js";
import { keepChecked } from "./controlled.ts";

export type CheckboxProps = CheckboxBaseProps & {
  onChange: (checked: boolean) => void;
};

/**
 * A choice that is applied later, with the form it belongs to. A native checkbox: the input is
 * hidden and the box is drawn beside it.
 */
export function Checkbox(props: CheckboxProps) {
  return (
    <label class={checkboxClass}>
      <input
        type="checkbox"
        aria-label={props["aria-label"]}
        class="peer sr-only"
        checked={props.checked}
        disabled={props.disabled}
        name={props.name || undefined}
        onChange={(event) => {
          props.onChange(event.currentTarget.checked);
          keepChecked(event.currentTarget, () => props.checked);
        }}
      />
      <span class={checkboxBoxClass}>
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" class={checkboxMarkClass}>
          <path
            d={CHECKBOX_MARK}
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
      <Show when={props.label}>
        <span class={checkboxLabelClass}>{props.label}</span>
      </Show>
    </label>
  );
}
