import {
  classes,
  rootPart,
  type SwitchBaseProps,
  switchClass,
  switchLabelClass,
  switchThumbClass,
  switchTrackClass,
} from "@acme/ui-core";
import { Show } from "solid-js";
import { keepChecked } from "./controlled.ts";
import type { RootProps } from "./root.ts";

export type SwitchProps = SwitchBaseProps &
  RootProps & {
    onChange: (checked: boolean) => void;
  };

const ROOT = rootPart("Switch");

/**
 * Turns a setting on or off, and takes effect at once. For a choice that is applied later,
 * with a form, use a Checkbox.
 *
 * It is a native checkbox with the switch role, so the keyboard, forms and screen readers
 * treat it as one. The input is hidden and the track is drawn beside it.
 */
export function Switch(props: SwitchProps) {
  return (
    <label class={classes(ROOT, switchClass, props.class)} style={props.style}>
      <input
        type="checkbox"
        role="switch"
        aria-checked={props.checked ? "true" : "false"}
        aria-label={props["aria-label"]}
        class="peer sr-only"
        checked={props.checked}
        defaultChecked={props.checked}
        disabled={props.disabled}
        onChange={(event) => {
          props.onChange(event.currentTarget.checked);
          keepChecked(event.currentTarget, () => props.checked);
        }}
      />
      <span class={switchTrackClass}>
        <span class={switchThumbClass} />
      </span>
      <Show when={props.label}>
        <span class={switchLabelClass}>{props.label}</span>
      </Show>
    </label>
  );
}
