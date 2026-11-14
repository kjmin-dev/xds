import { type ChipBaseProps, chipClass, chipIcon } from "@acme/ui-core";
import { Show } from "solid-js";
import { Icon } from "./Icon.tsx";

export type ChipProps = ChipBaseProps & {
  onPress?: () => void;
};

/**
 * A choice that filters what is shown. Unlike a Badge it is pressed. A selected chip is tinted,
 * outlined and marked with a check, so the state does not depend on color.
 *
 * It is a toggle button: assistive technology hears whether it is pressed.
 */
export function Chip(props: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={props.selected ? "true" : "false"}
      disabled={props.disabled}
      onClick={() => props.onPress?.()}
      class={chipClass(props.selected)}
    >
      <Show when={chipIcon({ selected: props.selected, iconStart: props.iconStart })}>
        {(name) => <Icon name={name()} size="sm" />}
      </Show>
      {props.label}
    </button>
  );
}
