<!--
  @component
  A choice that filters what is shown. Unlike a Badge it is pressed. A selected chip is tinted,
  outlined and marked with a check, so the state does not depend on color.

  It is a toggle button: assistive technology hears whether it is pressed.
-->
<script module lang="ts">
  import type { ChipBaseProps } from "@acme/ui-core";
  import type { RootProps } from "./root.ts";

  export type ChipProps = ChipBaseProps &
    RootProps & {
      onPress?: () => void;
    };
</script>

<script lang="ts">
  import { chipClass, chipIcon, classes, rootPart } from "@acme/ui-core";
  import Icon from "./Icon.svelte";

  let {
    label,
    selected,
    iconStart,
    disabled,
    onPress,
    class: className,
    style,
  }: ChipProps = $props();

  const icon = $derived(chipIcon({ selected, iconStart }));
</script>

<button
  type="button"
  aria-pressed={selected ? "true" : "false"}
  {disabled}
  onclick={() => onPress?.()}
  class={classes(rootPart("Chip"), chipClass(selected), className)}
  {style}
  >{#if icon}<Icon name={icon} size="sm" />{/if}{label}</button
>
