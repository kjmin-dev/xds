<!--
  @component
  What a screen or a list says when it has nothing to show. It centers itself in its container,
  also vertically when the container is a flex box with room to spare.
-->
<script module lang="ts">
  import type { EmptyStateBaseProps } from "@acme/ui-core";
  import type { Snippet } from "svelte";

  export type EmptyStateProps = EmptyStateBaseProps & {
    /** The one thing to do about it, usually a Button. */
    action?: Snippet;
  };
</script>

<script lang="ts">
  import { EMPTY_STATE_PARTS } from "@acme/ui-core";
  import Icon from "./Icon.svelte";

  let { icon, title, description, action }: EmptyStateProps = $props();
</script>

<div class={EMPTY_STATE_PARTS.root}>
  <Icon name={icon} size="xl" class={EMPTY_STATE_PARTS.icon} />
  <p class={EMPTY_STATE_PARTS.title}>{title}</p>
  {#if description}
    <p class={EMPTY_STATE_PARTS.description}>{description}</p>
  {/if}
  {#if action}
    <div class={EMPTY_STATE_PARTS.action}>{@render action()}</div>
  {/if}
</div>
