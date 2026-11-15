<!--
  @component
  Draws a screen of @acme/ui-core/preview (the design preview, a behavior test's scenario) with
  this library's components. Each state slot is a state of its own, and a prop is read where the
  component reads it, so a change updates only what reads the slot. The screen it is first given
  is the one it draws.
-->
<script lang="ts">
  import type { Host, Screen } from "@acme/ui-core/preview";
  import { onMount, type Snippet, untrack } from "svelte";
  import Draw from "./Draw.svelte";

  let { screen }: { screen: Screen } = $props();

  const { state: first, root, mount } = untrack(() => screen);
  const values: Record<string, unknown> = {};
  const writes = new Map<string, (value: unknown) => void>();
  for (const [key, value] of Object.entries(first)) {
    // Raw: a list in a slot is replaced, never changed in place.
    let slot = $state.raw(value);
    Object.defineProperty(values, key, { get: () => slot, enumerable: true });
    writes.set(key, (next) => (slot = next));
  }

  const host: Host<Snippet> = {
    state: values,
    set: (patch) => {
      for (const [key, value] of Object.entries(patch)) writes.get(key)?.(value);
    },
    // Draw.svelte draws the slots, and a node prop reaches a component as a snippet that
    // Snippets.svelte writes. The data puts no node anywhere else (see model.ts), so nothing
    // asks this to draw one.
    draw: () => {
      throw new Error("A node goes only in a component's own prop or in its children.");
    },
  };

  onMount(() => mount?.());
</script>

<Draw content={root} {host} />
