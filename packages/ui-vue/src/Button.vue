<script setup lang="ts">
// A native button. It also opens a Menu or a Tooltip it is the trigger of: their props reach
// it through provide and inject.
import { BUTTON_ICON, type ButtonBaseProps, buttonClass, isHeld } from "@acme/ui-core";
import { type ButtonHTMLAttributes, computed } from "vue";
import Icon from "./Icon.vue";
import Spinner from "./Spinner.vue";
import { useTrigger } from "./trigger.ts";

// `aria-label` is declared as `ariaLabel`: Vue keeps a prop under its camelized name, and a
// template still writes `aria-label`.
export type ButtonProps = Omit<ButtonBaseProps, "aria-label"> & { ariaLabel?: string };

const {
  variant = "secondary",
  size = "md",
  iconStart,
  iconEnd,
  // Undefined unless given, so that only a toggle says whether it is pressed.
  selected = undefined,
  disabled = false,
  loading = false,
  fullWidth = false,
  type = "button",
  ariaLabel,
} = defineProps<ButtonProps>();
const emit = defineEmits<{ press: [] }>();
const slots = defineSlots<{
  /** Leave it out for a button that holds only an icon, and name that one with `aria-label`. */
  default?(): unknown;
}>();

const icon = computed(() => BUTTON_ICON[size]);
const held = computed(() => isHeld({ variant, selected, disabled }));
const attributes = useTrigger(
  (): ButtonHTMLAttributes & { "data-pending"?: "" } => ({
    type,
    class: buttonClass({
      variant,
      size,
      iconOnly: !slots.default && (iconStart !== undefined || iconEnd !== undefined),
      fullWidth,
    }),
    disabled,
    // Loading keeps the button focusable, so focus is not lost while it waits.
    "aria-disabled": loading ? "true" : undefined,
    "data-pending": loading ? "" : undefined,
    "aria-pressed": selected === undefined ? undefined : selected ? "true" : "false",
    "aria-label": ariaLabel,
    onClick: () => {
      // The press was taken already.
      if (!loading) emit("press");
    },
  }),
  () => loading,
);
</script>

<template>
  <button v-bind="attributes">
    <template v-if="loading">
      <!-- Where the icon was, so the button keeps its width. -->
      <span v-if="iconStart" :class="icon.box"><Spinner size="sm" /></span>
      <Spinner v-else size="sm" />
    </template>
    <Icon v-else-if="iconStart" :name="iconStart" :size="icon.size" :filled="held" />
    <slot />
    <Icon v-if="iconEnd" :name="iconEnd" :size="icon.size" />
  </button>
</template>
