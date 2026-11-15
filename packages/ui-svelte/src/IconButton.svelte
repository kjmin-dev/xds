<!--
  @component
  A button that holds only an icon, in Button's variants, sizes and states. It is a square as
  tall as a Button of its size, and its pressable area is never smaller than the minimum target,
  even when the square is. Like Button, it opens a Menu or a Tooltip it is the trigger of.
-->
<script module lang="ts">
  import type { IconButtonBaseProps } from "@acme/ui-core";

  export type IconButtonProps = IconButtonBaseProps & {
    onPress?: () => void;
  };
</script>

<script lang="ts">
  import { buttonClass, ICON_BUTTON_BOX, isHeld } from "@acme/ui-core";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import Icon from "./Icon.svelte";
  import Spinner from "./Spinner.svelte";
  import { withTrigger } from "./trigger.svelte.ts";

  let {
    icon,
    label,
    variant = "ghost",
    size = "md",
    selected,
    disabled,
    loading,
    onPress,
  }: IconButtonProps = $props();

  const attributes = withTrigger(
    (): HTMLButtonAttributes => ({
      type: "button",
      class: buttonClass({ variant, size, iconButton: true }),
      disabled,
      "aria-disabled": loading ? "true" : undefined,
      "data-pending": loading ? "" : undefined,
      "aria-pressed": selected === undefined ? undefined : selected ? "true" : "false",
      "aria-label": label,
      onclick: () => {
        if (!loading) onPress?.();
      },
    }),
    () => loading === true,
  );
</script>

<button {...attributes()}>
  {#if loading}
    <span class={ICON_BUTTON_BOX[size]}><Spinner size="sm" /></span>
  {:else}
    <Icon name={icon} {size} filled={isHeld({ variant, selected, disabled })} />
  {/if}
</button>
