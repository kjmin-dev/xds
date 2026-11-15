<script setup lang="ts">
// What a screen or a list says when it has nothing to show. It centers itself in its container,
// also vertically when the container is a flex box with room to spare.
import { EMPTY_STATE_PARTS, type EmptyStateBaseProps } from "@acme/ui-core";
import Icon from "./Icon.vue";

export type EmptyStateProps = EmptyStateBaseProps;

const { icon, title, description } = defineProps<EmptyStateProps>();
const slots = defineSlots<{
  /** The one thing to do about it, usually a Button. */
  action?(): unknown;
}>();
</script>

<template>
  <div :class="EMPTY_STATE_PARTS.root">
    <Icon :name="icon" size="xl" :class="EMPTY_STATE_PARTS.icon" />
    <p :class="EMPTY_STATE_PARTS.title">{{ title }}</p>
    <p v-if="description" :class="EMPTY_STATE_PARTS.description">{{ description }}</p>
    <div v-if="slots.action" :class="EMPTY_STATE_PARTS.action"><slot name="action" /></div>
  </div>
</template>
