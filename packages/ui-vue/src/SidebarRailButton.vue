<script setup lang="ts">
// A row of a collapsed Sidebar: its icon alone. It is the trigger of the Tooltip that names it.
// Only for Sidebar: the index does not export it.
import type { IconName } from "@acme/tokens";
import { sidebarRailButtonClass } from "@acme/ui-core";
import type { ButtonHTMLAttributes } from "vue";
import Icon from "./Icon.vue";
import { useTrigger } from "./trigger.ts";

const { label, icon, selected } = defineProps<{
  label: string;
  icon: IconName;
  selected: boolean;
}>();
const emit = defineEmits<{ press: [] }>();

const attributes = useTrigger((): ButtonHTMLAttributes => ({
  type: "button",
  class: sidebarRailButtonClass(selected),
  "aria-label": label,
  "aria-current": selected ? "page" : undefined,
  onClick: () => emit("press"),
}));
</script>

<template>
  <button v-bind="attributes"><Icon :name="icon" size="md" :filled="selected" /></button>
</template>
