<script setup lang="ts">
// Names a control when the pointer rests on it or the keyboard focuses it. It appears after a
// short wait under a pointer and at once on keyboard focus, and goes when the pointer leaves,
// focus leaves, or Escape is pressed.
//
// It describes the control and is not its name: an IconButton still needs its `label`. It
// never holds anything pressable, and touch input has no hover, so nothing may depend on it.
import type { TooltipBaseProps } from "@acme/ui-core";
import TooltipOverlay from "./TooltipOverlay.vue";

export type TooltipProps = TooltipBaseProps;

const { label, shortcut, placement = "top" } = defineProps<TooltipProps>();
defineSlots<{
  /** The control it describes: a Button or an IconButton. */
  default(): unknown;
}>();
</script>

<template>
  <TooltipOverlay :label="label" :shortcut="shortcut" :placement="placement"
    ><slot
  /></TooltipOverlay>
</template>
