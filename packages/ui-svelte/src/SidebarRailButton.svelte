<!--
  @component
  A row of a collapsed Sidebar. It is the trigger of the Tooltip that names it. Only for Sidebar:
  the index does not export it.
-->
<script lang="ts">
  import type { IconName } from "@acme/tokens";
  import { sidebarRailButtonClass } from "@acme/ui-core";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import Icon from "./Icon.svelte";
  import { withTrigger } from "./trigger.svelte.ts";

  let {
    label,
    icon,
    selected,
    onPress,
  }: { label: string; icon: IconName; selected: boolean; onPress: () => void } = $props();

  const attributes = withTrigger((): HTMLButtonAttributes => ({
    type: "button",
    class: sidebarRailButtonClass(selected),
    "aria-label": label,
    "aria-current": selected ? "page" : undefined,
    onclick: () => onPress(),
  }));
</script>

<button {...attributes()}><Icon name={icon} size="md" filled={selected} /></button>
