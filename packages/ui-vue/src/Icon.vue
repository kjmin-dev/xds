<script setup lang="ts">
// An icon from design/icons. It takes the color of the text around it. An arrow or a chevron
// mirrors itself in a right-to-left layout when given `rtl:-scale-x-100` in `class`, which
// falls through to the drawing.
import { icons } from "@acme/tokens";
import { classes, type IconBaseProps, iconClass, rootPart } from "@acme/ui-core";
import { useDefaults } from "./defaults.ts";

export type IconProps = IconBaseProps;

const { name, size, filled = false, label } = defineProps<IconProps>();
const options = useDefaults("Icon", () => ({ size }));
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    :fill="filled ? 'currentColor' : 'none'"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    :class="classes(rootPart('Icon'), iconClass(options.size))"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
  >
    <path v-for="(path, index) in icons[name]" :key="index" :d="path" />
  </svg>
</template>
