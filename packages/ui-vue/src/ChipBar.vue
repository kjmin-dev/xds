<script setup lang="ts">
// One row of chips. It scrolls sideways when the chips do not fit and never wraps, so the
// content under it stays where it is.
import { type ChipBarBaseProps, chipBarClass, classes, rootPart } from "@acme/ui-core";

export type ChipBarProps = ChipBarBaseProps;

const { label } = defineProps<ChipBarProps>();
defineSlots<{
  /** The chips. Which of them are selected is the app's business: the bar holds no state. */
  default(): unknown;
}>();
</script>

<template>
  <!-- A group, not a fieldset: a fieldset cannot be a scrolling flex row in every browser. -->
  <div role="group" :aria-label="label" :class="classes(rootPart('ChipBar'), chipBarClass)">
    <slot />
  </div>
</template>
