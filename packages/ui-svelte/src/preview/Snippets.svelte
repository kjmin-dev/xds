<!--
  @component
  Draws a component with each of its node props as a snippet. Svelte has no public way to make a
  snippet that draws components from a script, so this wraps one node prop at a time in a
  template snippet, which adds nothing to the page, and calls itself for the next.
-->
<script lang="ts">
  import type { Host, Slot, State } from "@acme/ui-core/preview";
  import type { Component, Snippet } from "svelte";
  import Draw from "./Draw.svelte";
  import Self from "./Snippets.svelte";

  let {
    component: Drawn,
    props,
    slots,
    host,
    made = {},
  }: {
    component: Component<Record<string, unknown>>;
    props: Record<string, unknown>;
    /** The node props still to wrap, by name. */
    slots: readonly (readonly [string, Slot<State>])[];
    host: Host<Snippet>;
    /** The snippets made so far, by name. */
    made?: Record<string, Snippet>;
  } = $props();
</script>

{#if slots.length === 0}
  <Drawn {...props} {...made} />
{:else}
  {@const [name, content] = slots[0] ?? ["", undefined]}
  {#snippet drawn()}<Draw {content} {host} />{/snippet}
  <Self component={Drawn} {props} slots={slots.slice(1)} {host} made={{ ...made, [name]: drawn }} />
{/if}
