<script setup lang="ts">
// A choice that is applied later, with the form it belongs to. A native checkbox: the input is
// hidden and the box is drawn beside it.
import {
  CHECKBOX_MARK,
  type CheckboxBaseProps,
  checkboxBoxClass,
  checkboxClass,
  checkboxLabelClass,
  checkboxMarkClass,
} from "@acme/ui-core";
import { keepChecked } from "./controlled.ts";

// `aria-label` is declared as `ariaLabel`: Vue keeps a prop under its camelized name, and a
// template still writes `aria-label`.
export type CheckboxProps = Omit<CheckboxBaseProps, "checked" | "aria-label"> & {
  ariaLabel?: string;
};

const checked = defineModel<boolean>("checked", { required: true });
const { label, ariaLabel, name, disabled = false } = defineProps<CheckboxProps>();

function change(event: Event) {
  const input = event.currentTarget as HTMLInputElement;
  checked.value = input.checked;
  keepChecked(input, () => checked.value);
}
</script>

<template>
  <label :class="checkboxClass">
    <input
      type="checkbox"
      :aria-label="ariaLabel"
      class="peer sr-only"
      :checked="checked"
      :disabled="disabled"
      :name="name || undefined"
      @change="change"
    />
    <span :class="checkboxBoxClass">
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" :class="checkboxMarkClass">
        <path
          :d="CHECKBOX_MARK"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>
    <span v-if="label" :class="checkboxLabelClass">{{ label }}</span>
  </label>
</template>
