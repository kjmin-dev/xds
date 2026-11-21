<script setup lang="ts">
// A short status or category. The words carry the meaning; the color only reinforces it, so a
// badge still reads for someone who cannot tell the tones apart. `dot` adds a small mark for
// live states such as "connected", and `icon` a drawing in front of the words.
import { type BadgeBaseProps, badgeClass, badgeDotClass, classes, rootPart } from "@acme/ui-core";
import { useDefaults } from "./defaults.ts";
import Icon from "./Icon.vue";

export type { BadgeTone } from "@acme/ui-core";

export type BadgeProps = BadgeBaseProps;

const { tone, dot = false, icon } = defineProps<BadgeProps>();
defineSlots<{ default(): unknown }>();
const options = useDefaults("Badge", () => ({ tone }));
</script>

<template>
  <span :class="classes(rootPart('Badge'), badgeClass(options.tone))">
    <span v-if="dot" aria-hidden="true" :class="badgeDotClass" />
    <Icon v-if="icon" :name="icon" size="xs" />
    <slot />
  </span>
</template>
