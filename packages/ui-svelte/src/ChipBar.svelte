<!--
  @component
  One row of chips. It scrolls sideways when the chips do not fit and never wraps, so the content
  under it stays where it is.
-->
<script module lang="ts">
  import type { ChipBarBaseProps } from "@acme/ui-core";
  import type { Snippet } from "svelte";
  import type { RootProps } from "./root.ts";

  export type ChipBarProps = ChipBarBaseProps &
    RootProps & {
      /** The chips. Which of them are selected is the app's business: the bar holds no state. */
      children: Snippet;
    };
</script>

<script lang="ts">
  import { chipBarClass, classes, rootPart } from "@acme/ui-core";

  let { label, class: className, style, children }: ChipBarProps = $props();
</script>

<!-- A group, not a fieldset: a fieldset cannot be a scrolling flex row in every browser. -->
<div
  role="group"
  aria-label={label}
  class={classes(rootPart("ChipBar"), chipBarClass, className)}
  {style}
>
  {@render children()}
</div>
