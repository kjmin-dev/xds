<!--
  @component
  A native button. It also opens a Menu or a Tooltip it is the trigger of: their props reach it
  through context.
-->
<script module lang="ts">
  import type { ButtonBaseProps } from "@acme/ui-core";
  import type { Snippet } from "svelte";

  export type { ButtonVariant, ControlSize } from "@acme/ui-core";

  export type ButtonProps = ButtonBaseProps & {
    onPress?: () => void;
    /** Leave it out for a button that holds only an icon, and name that one with `aria-label`. */
    children?: Snippet;
  };
</script>

<script lang="ts">
  import { BUTTON_ICON, buttonClass, isHeld } from "@acme/ui-core";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import Icon from "./Icon.svelte";
  import Spinner from "./Spinner.svelte";
  import { withTrigger } from "./trigger.svelte.ts";

  let {
    variant = "secondary",
    size = "md",
    iconStart,
    iconEnd,
    selected,
    disabled,
    loading,
    fullWidth = false,
    type = "button",
    onPress,
    "aria-label": ariaLabel,
    children,
  }: ButtonProps = $props();

  const icon = $derived(BUTTON_ICON[size]);
  const held = $derived(isHeld({ variant, selected, disabled }));
  const attributes = withTrigger(
    (): HTMLButtonAttributes => ({
      type,
      class: buttonClass({
        variant,
        size,
        iconOnly: children === undefined && (iconStart !== undefined || iconEnd !== undefined),
        fullWidth,
      }),
      disabled,
      // Loading keeps the button focusable, so focus is not lost while it waits.
      "aria-disabled": loading ? "true" : undefined,
      "data-pending": loading ? "" : undefined,
      "aria-pressed": selected === undefined ? undefined : selected ? "true" : "false",
      "aria-label": ariaLabel,
      onclick: () => {
        // The press was taken already.
        if (!loading) onPress?.();
      },
    }),
    () => loading === true,
  );
</script>

<button {...attributes()}
  >{#if loading}{#if iconStart}
      <!-- Where the icon was, so the button keeps its width. -->
      <span class={icon.box}><Spinner size="sm" /></span>
    {:else}<Spinner size="sm" />{/if}{:else if iconStart}<Icon
      name={iconStart}
      size={icon.size}
      filled={held}
    />{/if}{@render children?.()}{#if iconEnd}<Icon name={iconEnd} size={icon.size} />{/if}</button
>
