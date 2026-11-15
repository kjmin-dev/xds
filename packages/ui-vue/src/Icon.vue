<script setup lang="ts">
// An icon from design/icons. It takes the color of the text around it. An arrow or a chevron
// mirrors itself in a right-to-left layout when given `rtl:-scale-x-100` in `class`, which
// falls through to the drawing.
import { icons } from "@acme/tokens";
import { type IconBaseProps, iconClass } from "@acme/ui-core";

export type IconProps = IconBaseProps;

const { name, size, filled = false, label } = defineProps<IconProps>();
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    :fill="filled ? 'currentColor' : 'none'"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    :class="iconClass(size)"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
  >
    <path v-for="(path, index) in icons[name]" :key="index" :d="path" />
  </svg>
</template>
