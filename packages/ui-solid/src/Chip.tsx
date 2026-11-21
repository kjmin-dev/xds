import { type ChipBaseProps, chipClass, chipIcon, classes, rootPart } from "@acme/ui-core";
import { Show } from "solid-js";
import { Icon } from "./Icon.tsx";
import type { RootProps } from "./root.ts";

export type ChipProps = ChipBaseProps &
  RootProps & {
    onPress?: () => void;
  };

const ROOT = rootPart("Chip");

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
      class={classes(ROOT, chipClass(props.selected), props.class)}
      style={props.style}
    >
      <Show when={chipIcon({ selected: props.selected, iconStart: props.iconStart })}>
        {(name) => <Icon name={name()} size="sm" />}
      </Show>
      {props.label}
    </button>
  );
}
