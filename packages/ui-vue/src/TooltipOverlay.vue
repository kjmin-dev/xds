<script setup lang="ts">
// What Tooltip draws, at any placement: a collapsed Sidebar names its icons at their end edge,
// on the side of the content, where they do not cover their neighbours. Only for this
// package's own components: the index does not export it.
import { motion, space } from "@acme/tokens";
import * as tooltip from "@zag-js/tooltip";
import { normalizeProps, useMachine } from "@zag-js/vue";
import { computed, useId, useTemplateRef } from "vue";
import { usePresence } from "./presence.ts";
import { type TriggerProps, TriggerScope } from "./trigger.ts";

// The class and style a Tooltip is given go on the tooltip itself: the root is the control it
// describes and a Teleport.
defineOptions({ inheritAttrs: false });
const { label, shortcut, placement } = defineProps<{
  label: string;
  shortcut?: string | undefined;
  placement: tooltip.Placement;
}>();
defineSlots<{ default(): unknown }>();

const id = useId();
const service = useMachine(
  tooltip.machine,
  computed(() => ({
    id,
    openDelay: motion.duration.tooltipDelay,
    closeDelay: 0,
    // It stays and follows its control when the page scrolls, for as long as the control keeps
    // focus or the pointer. Tabbing to a control out of view scrolls the page, and a tooltip
    // closed by that scroll would never show for it.
    closeOnScroll: false,
    positioning: { placement, gutter: space[1] },
  })),
);
const api = computed(() => tooltip.connect(service, normalizeProps));
const trigger = computed(() => api.value.getTriggerProps() as TriggerProps);
const content = useTemplateRef<HTMLDivElement>("content");
const present = usePresence(
  () => api.value.open,
  () => [content.value],
);
</script>

<template>
  <TriggerScope :trigger="trigger"><slot /></TriggerScope>
  <Teleport v-if="present" to="body">
    <TriggerScope :trigger="null">
      <div v-bind="api.getPositionerProps()" class="acme-tooltip__positioner">
        <!-- Shown until its exit animation ends; Zag would hide it as it closes. -->
        <div
          v-bind="api.getContentProps()"
          ref="content"
          :hidden="false"
          class="acme-tooltip"
          :class="$attrs.class"
          :style="$attrs.style"
        >
          {{ label }}<kbd v-if="shortcut" class="acme-tooltip__shortcut">{{ shortcut }}</kbd>
        </div>
      </div>
    </TriggerScope>
  </Teleport>
</template>
