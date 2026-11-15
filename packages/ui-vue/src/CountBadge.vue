<script setup lang="ts">
// A count of something waiting: unread messages, items in a cart. On its own it is laid out
// inline; around a child it sits on the child's top end corner.
import {
  type CountBadgeBaseProps,
  countBadgeAnchorClass,
  countBadgeClass,
  countBadgeText,
} from "@acme/ui-core";

export type CountBadgeProps = CountBadgeBaseProps;

const { count, max, label } = defineProps<CountBadgeProps>();
const slots = defineSlots<{
  /** What the count belongs to: an icon, an avatar, a button. The badge sits on its corner. */
  default?(): unknown;
}>();
</script>

<template>
  <span v-if="slots.default" :class="countBadgeAnchorClass">
    <slot />
    <span
      v-if="count > 0"
      :role="label ? 'img' : undefined"
      :aria-label="label || undefined"
      :class="countBadgeClass(true)"
    >
      {{ countBadgeText(count, max) }}
    </span>
  </span>
  <span
    v-else-if="count > 0"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :class="countBadgeClass(false)"
  >
    {{ countBadgeText(count, max) }}
  </span>
</template>
