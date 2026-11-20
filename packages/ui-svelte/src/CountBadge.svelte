<!--
  @component
  A count of something waiting: unread messages, items in a cart. On its own it is laid out
  inline; around a child it sits on the child's top end corner.
-->
<script module lang="ts">
  import type { CountBadgeBaseProps } from "@acme/ui-core";
  import type { Snippet } from "svelte";
  import type { RootProps } from "./root.ts";

  export type CountBadgeProps = CountBadgeBaseProps &
    RootProps & {
      /** What the count belongs to: an icon, an avatar, a button. The badge sits on its corner. */
      children?: Snippet;
    };
</script>

<script lang="ts">
  import {
    classes,
    countBadgeAnchorClass,
    countBadgeClass,
    countBadgeText,
    rootPart,
  } from "@acme/ui-core";

  let { count, max, label, class: className, style, children }: CountBadgeProps = $props();

  // The root is the anchor around the child, or the badge itself when there is none.
  const root = $derived(classes(rootPart("CountBadge"), className));
</script>

{#snippet badge(onChild: boolean)}
  {#if count > 0}
    <span
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      class={classes(countBadgeClass(onChild), !onChild && root)}
      style={onChild ? undefined : style}>{countBadgeText(count, max)}</span
    >
  {/if}
{/snippet}

{#if children}
  <span class={classes(countBadgeAnchorClass, root)} {style}
    >{@render children()}{@render badge(true)}</span
  >
{:else}
  {@render badge(false)}
{/if}
