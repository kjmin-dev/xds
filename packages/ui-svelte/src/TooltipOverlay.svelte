<!--
  @component
  What Tooltip draws, at the placement it is given: a collapsed Sidebar names its icons at the
  end edge, on the side of the content, where they do not cover their neighbours. Only for this
  package's own components: the index does not export it.
-->
<script lang="ts">
  import { motion, space } from "@acme/tokens";
  import { classes } from "@acme/ui-core";
  import { mergeProps, normalizeProps, useMachine } from "@zag-js/svelte";
  import * as tooltip from "@zag-js/tooltip";
  import type { Snippet } from "svelte";
  import Portal from "./Portal.svelte";
  import { createPresence } from "./presence.svelte.ts";
  import type { RootProps } from "./root.ts";
  import { provideTrigger, type TriggerProps } from "./trigger.svelte.ts";

  let {
    label,
    shortcut,
    placement,
    class: className,
    style,
    children,
  }: RootProps & {
    label: string;
    shortcut?: string | undefined;
    placement: () => tooltip.Placement;
    children: Snippet;
  } = $props();

  const id = $props.id();
  const service = useMachine(tooltip.machine, () => ({
    id,
    openDelay: motion.duration.tooltipDelay,
    closeDelay: 0,
    // It stays and follows its control when the page scrolls, for as long as the control keeps
    // focus or the pointer. Tabbing to a control out of view scrolls the page, and a tooltip
    // closed by that scroll would never show for it.
    closeOnScroll: false,
    positioning: { placement: placement(), gutter: space[1] },
  }));
  const api = $derived(tooltip.connect(service, normalizeProps));
  provideTrigger(() => api.getTriggerProps() as TriggerProps);
  let content = $state<HTMLDivElement>();
  const present = createPresence(
    () => api.open,
    () => [content],
  );
</script>

{@render children()}
{#if present()}
  <Portal>
    <div {...api.getPositionerProps()} class="acme-tooltip__positioner">
      <!-- Shown until its exit animation ends; Zag would hide it as it closes. -->
      <div
        {...mergeProps(api.getContentProps(), { class: classes("acme-tooltip", className), style })}
        bind:this={content}
        hidden={false}
      >
        {label}{#if shortcut}<kbd class="acme-tooltip__shortcut">{shortcut}</kbd>{/if}
      </div>
    </div>
  </Portal>
{/if}
