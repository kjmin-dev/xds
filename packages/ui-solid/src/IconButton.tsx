import { buttonClass, ICON_BUTTON_BOX, type IconButtonBaseProps, isHeld } from "@acme/ui-core";
import type { JSX } from "@solidjs/web";
import { createMemo, Show } from "solid-js";
import { Icon } from "./Icon.tsx";
import { Spinner } from "./Spinner.tsx";
import { withTrigger } from "./trigger.ts";

export type IconButtonProps = IconButtonBaseProps & {
  onPress?: () => void;
};

/**
 * A button that holds only an icon, in Button's variants, sizes and states. It is a square as
 * tall as a Button of its size, and its pressable area is never smaller than the minimum
 * target, even when the square is. Like Button, it opens a Menu or a Tooltip it is the trigger
 * of.
 */
export function IconButton(props: IconButtonProps) {
  const variant = () => props.variant ?? "ghost";
  const size = () => props.size ?? "md";
  const attributes = withTrigger(
    createMemo((): JSX.ButtonHTMLAttributes<HTMLButtonElement> => ({
      type: "button",
      class: buttonClass({ variant: variant(), size: size(), iconButton: true }),
      disabled: props.disabled,
      "aria-disabled": props.loading ? "true" : undefined,
      "data-pending": props.loading ? "" : undefined,
      "aria-pressed": props.selected === undefined ? undefined : props.selected ? "true" : "false",
      "aria-label": props.label,
      onClick: () => {
        if (!props.loading) props.onPress?.();
      },
    })),
    () => props.loading === true,
  );
  return (
    <button {...attributes}>
      <Show
        when={!props.loading}
        fallback={
          <span class={ICON_BUTTON_BOX[size()]}>
            <Spinner size="sm" />
          </span>
        }
      >
        <Icon
          name={props.icon}
          size={size()}
          filled={isHeld({
            variant: variant(),
            selected: props.selected,
            disabled: props.disabled,
          })}
        />
      </Show>
    </button>
  );
}
