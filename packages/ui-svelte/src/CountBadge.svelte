<!--
  @component
  A count of something waiting: unread messages, items in a cart. On its own it is laid out
  inline; around a child it sits on the child's top end corner.
-->
<script module lang="ts">
  import type { CountBadgeBaseProps } from "@acme/ui-core";
  import type { Snippet } from "svelte";

  export type CountBadgeProps = CountBadgeBaseProps & {
    /** What the count belongs to: an icon, an avatar, a button. The badge sits on its corner. */
    children?: Snippet;
  };
</script>

<script lang="ts">
  import { countBadgeAnchorClass, countBadgeClass, countBadgeText } from "@acme/ui-core";

  let { count, max, label, children }: CountBadgeProps = $props();
</script>

{#snippet badge(onChild: boolean)}
  {#if count > 0}
    <span
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      class={countBadgeClass(onChild)}>{countBadgeText(count, max)}</span
    >
  {/if}
{/snippet}

{#if children}
  <span class={countBadgeAnchorClass}>{@render children()}{@render badge(true)}</span>
{:else}
  {@render badge(false)}
{/if}
