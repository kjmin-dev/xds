<!--
  @component
  A button that holds only an icon, in Button's variants, sizes and states. It is a square as
  tall as a Button of its size, and its pressable area is never smaller than the minimum target,
  even when the square is. Like Button, it opens a Menu or a Tooltip it is the trigger of.
-->
<script module lang="ts">
  import type { IconButtonBaseProps } from "@acme/ui-core";
  import type { RootProps } from "./root.ts";

  export type IconButtonProps = IconButtonBaseProps &
    RootProps & {
      onPress?: () => void;
    };
</script>

<script lang="ts">
  import { buttonClass, classes, ICON_BUTTON_BOX, isHeld } from "@acme/ui-core";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { useDefaults } from "./defaults.svelte.ts";
  import Icon from "./Icon.svelte";
  import Spinner from "./Spinner.svelte";
  import { withTrigger } from "./trigger.svelte.ts";

  let {
    icon,
    label,
    variant: ownVariant,
    size: ownSize,
    selected,
    disabled,
    loading,
    onPress,
    class: className,
    style,
  }: IconButtonProps = $props();

  const defaults = useDefaults("IconButton");
  const variant = $derived(ownVariant ?? defaults().variant ?? "ghost");
  const size = $derived(ownSize ?? defaults().size ?? "md");

  const attributes = withTrigger(
    (): HTMLButtonAttributes => ({
      type: "button",
      // The recipe gives the root part, `acme-icon-button`.
      class: classes(buttonClass({ variant, size, iconButton: true }), className),
      style,
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
