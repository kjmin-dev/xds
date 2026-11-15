<!--
  @component
  A choice that filters what is shown. Unlike a Badge it is pressed. A selected chip is tinted,
  outlined and marked with a check, so the state does not depend on color.

  It is a toggle button: assistive technology hears whether it is pressed.
-->
<script module lang="ts">
  import type { ChipBaseProps } from "@acme/ui-core";

  export type ChipProps = ChipBaseProps & {
    onPress?: () => void;
  };
</script>

<script lang="ts">
  import { chipClass, chipIcon } from "@acme/ui-core";
  import Icon from "./Icon.svelte";

  let { label, selected, iconStart, disabled, onPress }: ChipProps = $props();

  const icon = $derived(chipIcon({ selected, iconStart }));
</script>

<button
  type="button"
  aria-pressed={selected ? "true" : "false"}
  {disabled}
  onclick={() => onPress?.()}
  class={chipClass(selected)}
  >{#if icon}<Icon name={icon} size="sm" />{/if}{label}</button
>
