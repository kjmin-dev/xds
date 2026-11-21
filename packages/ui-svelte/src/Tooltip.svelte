<!--
  @component
  Names a control when the pointer rests on it or the keyboard focuses it. It appears after a
  short wait under a pointer and at once on keyboard focus, and goes when the pointer leaves,
  focus leaves, or Escape is pressed.

  It describes the control and is not its name: an IconButton still needs its `label`. It never
  holds anything pressable, and touch input has no hover, so nothing may depend on it.
-->
<script module lang="ts">
  import type { TooltipBaseProps } from "@acme/ui-core";
  import type { Snippet } from "svelte";
  import type { RootProps } from "./root.ts";

  /** Its root is the tooltip, while it shows, not the control it describes. */
  export type TooltipProps = TooltipBaseProps &
    RootProps & {
      /** The control it describes: a Button or an IconButton. */
      children: Snippet;
    };
</script>

<script lang="ts">
  import TooltipOverlay from "./TooltipOverlay.svelte";

  let {
    label,
    shortcut,
    placement = "top",
    class: className,
    style,
    children,
  }: TooltipProps = $props();
</script>

<!-- The overlay gives the root part, `acme-tooltip`, to every tooltip, a collapsed Sidebar's
     too. -->
<TooltipOverlay {label} {shortcut} placement={() => placement} class={className} {style}
  >{@render children()}</TooltipOverlay
>
