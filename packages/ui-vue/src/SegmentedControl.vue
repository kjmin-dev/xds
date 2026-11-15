<script setup lang="ts" generic="Value extends string">
// A choice between a few views or modes, all visible at once. The selected segment is outlined
// as well as filled, so the choice does not depend on telling two greys apart.
//
// It is a group of native radio buttons, so the arrow keys move between segments.
import {
  type SegmentedControlBaseProps,
  segmentedControlClass,
  segmentedControlOptionClass,
  segmentedControlSegmentClass,
} from "@acme/ui-core";
import { useId, useTemplateRef } from "vue";
import { keepChecked } from "./controlled.ts";

// `aria-label` is declared as `ariaLabel`: Vue keeps a prop under its camelized name, and a
// template still writes `aria-label`.
export type SegmentedControlProps<Value extends string> = Omit<
  SegmentedControlBaseProps<Value>,
  "value" | "aria-label"
> & { ariaLabel: string };

const value = defineModel<Value>("value", { required: true });
const { options, ariaLabel, fullWidth = false } = defineProps<SegmentedControlProps<Value>>();

const name = useId();
const group = useTemplateRef("group");

function choose(option: Value) {
  value.value = option;
  // The browser moved the dot already; where the owner kept the old value, it goes back, on
  // every radio of the group.
  for (const input of group.value?.querySelectorAll("input") ?? []) {
    keepChecked(input, () => input.value === value.value);
  }
}
</script>

<template>
  <div
    ref="group"
    :aria-label="ariaLabel"
    role="radiogroup"
    :class="segmentedControlClass(fullWidth)"
  >
    <label
      v-for="option in options"
      :key="option.value"
      :class="segmentedControlOptionClass(fullWidth)"
    >
      <input
        type="radio"
        :name="name"
        :value="option.value"
        class="peer sr-only"
        :checked="option.value === value"
        @change="choose(option.value)"
      />
      <span :class="segmentedControlSegmentClass">{{ option.label }}</span>
    </label>
  </div>
</template>
