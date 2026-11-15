<script setup lang="ts">
// An item's body. Its height moves between zero and the height of what it holds, and it is
// hidden only once it has finished closing. Only for Accordion: the index does not export it.
import { setPanelOpen } from "@acme/ui-core";
import { onMounted, useTemplateRef, watch } from "vue";

// Zag's attributes come first, so that the panel's own role and aria-hidden win.
const { open, attributes } = defineProps<{ open: boolean; attributes: Record<string, unknown> }>();
defineSlots<{ default(): unknown }>();
const panel = useTemplateRef<HTMLDivElement>("panel");

// Set before the browser paints, so a closed panel never shows for a frame. Only a change
// animates.
onMounted(() => panel.value && setPanelOpen(panel.value, open, false));
watch(
  () => open,
  (isOpen, _, onCleanup) => {
    // The next toggle takes over from this one.
    if (panel.value) onCleanup(setPanelOpen(panel.value, isOpen, true));
  },
  { flush: "post" },
);
</script>

<template>
  <!-- A group: a region is a landmark, and a page of accordions would fill the list of
       landmarks. A closed one is left out of the accessibility tree as soon as it starts
       closing; `hidden="until-found"` alone leaves the empty group in it. A group, not a
       fieldset: it is the body of a disclosure, not a set of form fields. -->
  <div
    v-bind="attributes"
    ref="panel"
    role="group"
    :aria-hidden="open ? undefined : 'true'"
    class="accordion__panel"
  >
    <div class="accordion__body"><slot /></div>
  </div>
</template>
