<script setup lang="ts">
// What the components inside take for an option the app leaves out: a variant, a size, a tone.
// It draws nothing of its own. A component's own prop wins over it, and a Defaults inside
// another replaces only the options it names: `<Defaults :value="{ Button: { size: 'sm' } }">`
// inside one that makes buttons primary gives small primary buttons.
import type { ComponentDefaults } from "@acme/ui-core";
import { provideDefaults } from "./defaults.ts";

export type DefaultsProps = {
  /** The defaults, by component: `{ Button: { variant: "primary" }, Badge: { tone: "info" } }`. */
  value: ComponentDefaults;
};

const { value } = defineProps<DefaultsProps>();
defineSlots<{ default(): unknown }>();

provideDefaults(() => value);
</script>

<template>
  <slot />
</template>
