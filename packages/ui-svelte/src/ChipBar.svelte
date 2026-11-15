<!--
  @component
  One row of chips. It scrolls sideways when the chips do not fit and never wraps, so the content
  under it stays where it is.
-->
<script module lang="ts">
  import type { ChipBarBaseProps } from "@acme/ui-core";
  import type { Snippet } from "svelte";

  export type ChipBarProps = ChipBarBaseProps & {
    /** The chips. Which of them are selected is the app's business: the bar holds no state. */
    children: Snippet;
  };
</script>

<script lang="ts">
  import { chipBarClass } from "@acme/ui-core";

  let { label, children }: ChipBarProps = $props();
</script>

<!-- A group, not a fieldset: a fieldset cannot be a scrolling flex row in every browser. -->
<div role="group" aria-label={label} class={chipBarClass}>{@render children()}</div>
