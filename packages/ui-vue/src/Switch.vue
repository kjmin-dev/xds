<script setup lang="ts">
// Turns a setting on or off, and takes effect at once. For a choice that is applied later,
// with a form, use a Checkbox.
//
// It is a native checkbox with the switch role, so the keyboard, forms and screen readers
// treat it as one. The input is hidden and the track is drawn beside it.
import {
  type SwitchBaseProps,
  switchClass,
  switchLabelClass,
  switchThumbClass,
  switchTrackClass,
} from "@acme/ui-core";
import { keepChecked } from "./controlled.ts";

// `aria-label` is declared as `ariaLabel`: Vue keeps a prop under its camelized name, and a
// template still writes `aria-label`.
export type SwitchProps = Omit<SwitchBaseProps, "checked" | "aria-label"> & { ariaLabel?: string };

const checked = defineModel<boolean>("checked", { required: true });
const { label, ariaLabel, disabled = false } = defineProps<SwitchProps>();

function change(event: Event) {
  const input = event.currentTarget as HTMLInputElement;
  checked.value = input.checked;
  keepChecked(input, () => checked.value);
}
</script>

<template>
  <label :class="switchClass">
    <input
      type="checkbox"
      role="switch"
      :aria-checked="checked ? 'true' : 'false'"
      :aria-label="ariaLabel"
      class="peer sr-only"
      :checked="checked"
      :disabled="disabled"
      @change="change"
    />
    <span :class="switchTrackClass"><span :class="switchThumbClass" /></span>
    <span v-if="label" :class="switchLabelClass">{{ label }}</span>
  </label>
</template>
