<script setup lang="ts">
// A button that holds only an icon, in Button's variants, sizes and states. It is a square as
// tall as a Button of its size, and its pressable area is never smaller than the minimum
// target, even when the square is. Like Button, it opens a Menu or a Tooltip it is the trigger
// of.
import { buttonClass, ICON_BUTTON_BOX, type IconButtonBaseProps, isHeld } from "@acme/ui-core";
import type { ButtonHTMLAttributes } from "vue";
import Icon from "./Icon.vue";
import Spinner from "./Spinner.vue";
import { useTrigger } from "./trigger.ts";

export type IconButtonProps = IconButtonBaseProps;

const {
  icon,
  label,
  variant = "ghost",
  size = "md",
  // Undefined unless given, so that only a toggle says whether it is pressed.
  selected = undefined,
  disabled = false,
  loading = false,
} = defineProps<IconButtonProps>();
const emit = defineEmits<{ press: [] }>();

const attributes = useTrigger(
  (): ButtonHTMLAttributes & { "data-pending"?: "" } => ({
    type: "button",
    class: buttonClass({ variant, size, iconButton: true }),
    disabled,
    "aria-disabled": loading ? "true" : undefined,
    "data-pending": loading ? "" : undefined,
    "aria-pressed": selected === undefined ? undefined : selected ? "true" : "false",
    "aria-label": label,
    onClick: () => {
      if (!loading) emit("press");
    },
  }),
  () => loading,
);
</script>

<template>
  <button v-bind="attributes">
    <span v-if="loading" :class="ICON_BUTTON_BOX[size]"><Spinner size="sm" /></span>
    <Icon v-else :name="icon" :size="size" :filled="isHeld({ variant, selected, disabled })" />
  </button>
</template>
