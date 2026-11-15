<script setup lang="ts">
// One line of a list or a settings screen. Separate rows with a Divider.
import type { ListRowBaseProps } from "@acme/ui-core";
import PlaceRow from "./PlaceRow.vue";

export type ListRowProps = ListRowBaseProps & {
  /**
   * Makes the whole row a button. Do not put another control in `trailing` then. A prop rather
   * than an event, since whether there is one decides what is drawn.
   */
  onPress?: () => void;
};

const props = defineProps<ListRowProps>();
defineSlots<{
  /** In front of the title: an avatar or an icon. */
  leading?(): unknown;
  /** At the far end: a value, a badge or a switch. */
  trailing?(): unknown;
}>();
</script>

<template>
  <PlaceRow v-bind="props" current="true">
    <template v-if="$slots.leading" #leading><slot name="leading" /></template>
    <template v-if="$slots.trailing" #trailing><slot name="trailing" /></template>
  </PlaceRow>
</template>
