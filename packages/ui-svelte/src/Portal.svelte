<!--
  @component
  Draws its content at the end of the page's body, out of any box that would clip it or stack it
  under the page, as the other web libraries' portals do, and takes it away with itself. The
  content is a root of its own, which keeps the context it is drawn in: moving the elements
  instead would leave the blocks around them to remove the page's elements in their place. Only
  for this package's own overlays: the index does not export it.
-->
<script lang="ts">
  import { getAllContexts, mount, onMount, type Snippet, unmount } from "svelte";
  import Self from "./Portal.svelte";

  let { children, here = false }: { children: Snippet; here?: boolean } = $props();

  const context = getAllContexts();
  onMount(() => {
    if (here) return;
    const content = mount(Self, {
      target: document.body,
      props: { children, here: true },
      context,
    });
    return () => void unmount(content);
  });
</script>

{#if here}{@render children()}{/if}
