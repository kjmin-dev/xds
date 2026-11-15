<!--
  @component
  An Accordion item's body. Its height moves between zero and the height of what it holds, and
  it is hidden only once it has finished closing. Only for Accordion: the index does not export
  it.
-->
<script lang="ts">
  import { setPanelOpen } from "@acme/ui-core";
  import type { Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    open,
    attributes,
    children,
  }: { open: boolean; attributes: HTMLAttributes<HTMLDivElement>; children: Snippet } = $props();

  let rendered = false;
  // Again on each toggle; the next one takes over from this one.
  const toggle: Attachment<HTMLDivElement> = (panel) => {
    const stop = setPanelOpen(panel, open, rendered);
    rendered = true;
    return stop;
  };
</script>

<!-- A group: a region is a landmark, and a page of accordions would fill the list of landmarks.
     A closed one is left out of the accessibility tree as soon as it starts closing;
     `hidden="until-found"` alone leaves the empty group in it. A group, not a fieldset: it is the
     body of a disclosure, not a set of form fields. -->
<div
  {...attributes}
  {@attach toggle}
  role="group"
  aria-hidden={open ? undefined : "true"}
  class="accordion__panel"
>
  <div class="accordion__body">{@render children()}</div>
</div>
