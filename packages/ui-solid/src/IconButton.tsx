import {
  buttonClass,
  classes,
  ICON_BUTTON_BOX,
  type IconButtonBaseProps,
  isHeld,
} from "@acme/ui-core";
import type { JSX } from "@solidjs/web";
import { createMemo, Show } from "solid-js";
import { useDefaults } from "./Defaults.tsx";
import { Icon } from "./Icon.tsx";
import type { RootProps } from "./root.ts";
import { Spinner } from "./Spinner.tsx";
import { withTrigger } from "./trigger.ts";

export type IconButtonProps = IconButtonBaseProps &
  RootProps & {
    onPress?: () => void;
  };

/**
 * A button that holds only an icon, in Button's variants, sizes and states. It is a square as
 * tall as a Button of its size, and its pressable area is never smaller than the minimum
 * target, even when the square is. Like Button, it opens a Menu or a Tooltip it is the trigger
 * of.
 */
export function IconButton(props: IconButtonProps) {
  const defaults = useDefaults("IconButton");
  const variant = () => props.variant ?? defaults().variant ?? "ghost";
  const size = () => props.size ?? defaults().size ?? "md";
  const attributes = withTrigger(
    createMemo((): JSX.ButtonHTMLAttributes<HTMLButtonElement> => ({
      type: "button",
      // Its root part, `acme-icon-button`, is in the recipe.
      class: classes(
        buttonClass({ variant: variant(), size: size(), iconButton: true }),
        props.class,
      ),
      style: props.style,
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
