import { BUTTON_ICON, type ButtonBaseProps, buttonClass, isHeld } from "@acme/ui-core";
import type { JSX } from "@solidjs/web";
import { children, createMemo, type Element, Show } from "solid-js";
import { Icon } from "./Icon.tsx";
import { Spinner } from "./Spinner.tsx";
import { withTrigger } from "./trigger.ts";

export type { ButtonVariant, ControlSize } from "@acme/ui-core";

export type ButtonProps = ButtonBaseProps & {
  onPress?: () => void;
  /** Leave it out for a button that holds only an icon, and name that one with `aria-label`. */
  children?: Element;
};

/**
 * A native button. It also opens a Menu or a Tooltip it is the trigger of: their props reach
 * it through context.
 */
export function Button(props: ButtonProps) {
  // Read once: each read of a JSX prop creates its nodes again.
  const label = children(() => props.children);
  const variant = () => props.variant ?? "secondary";
  const size = () => props.size ?? "md";
  const icon = () => BUTTON_ICON[size()];
  const held = () =>
    isHeld({ variant: variant(), selected: props.selected, disabled: props.disabled });
  const attributes = withTrigger(
    createMemo((): JSX.ButtonHTMLAttributes<HTMLButtonElement> => ({
      type: props.type ?? "button",
      class: buttonClass({
        variant: variant(),
        size: size(),
        iconOnly: label() == null && (props.iconStart !== undefined || props.iconEnd !== undefined),
        fullWidth: props.fullWidth ?? false,
      }),
      disabled: props.disabled,
      // Loading keeps the button focusable, so focus is not lost while it waits.
      "aria-disabled": props.loading ? "true" : undefined,
      "data-pending": props.loading ? "" : undefined,
      "aria-pressed": props.selected === undefined ? undefined : props.selected ? "true" : "false",
      "aria-label": props["aria-label"],
      onClick: () => {
        // The press was taken already.
        if (!props.loading) props.onPress?.();
      },
    })),
    () => props.loading === true,
  );
  return (
    <button {...attributes}>
      <Show when={props.loading}>
        <Show when={props.iconStart} fallback={<Spinner size="sm" />}>
          {/* Where the icon was, so the button keeps its width. */}
          <span class={icon().box}>
            <Spinner size="sm" />
          </span>
        </Show>
      </Show>
      <Show when={!props.loading && props.iconStart}>
        {(name) => <Icon name={name()} size={icon().size} filled={held()} />}
      </Show>
      {label()}
      <Show when={props.iconEnd}>{(name) => <Icon name={name()} size={icon().size} />}</Show>
    </button>
  );
}
