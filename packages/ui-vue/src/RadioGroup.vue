<script setup lang="ts" generic="Value extends string = string">
// One choice among a few, applied later with the form it belongs to. For a choice that takes
// effect at once among two to four options, a SegmentedControl is the usual pick.
//
// The chosen option has a dot and a thicker ring, so the choice does not depend on color. The
// options are native radio buttons, hidden and drawn beside, in a group named by the legend:
// the arrow keys move between them, and the error is tied to the group and announced.
import type { RadioGroupBaseProps } from "@acme/ui-core";
import { computed, useId, useTemplateRef } from "vue";
import { keepChecked } from "./controlled.ts";

export type { RadioOption } from "@acme/ui-core";

export type RadioGroupProps<Value extends string = string> = RadioGroupBaseProps<Value>;

// `v-model:value`, written out rather than with defineModel: the value may be left out, but a
// choice is never undefined, and defineModel would say that it can be.
const {
  value,
  label,
  options,
  disabled = false,
  error,
  name,
} = defineProps<RadioGroupProps<Value>>();
const emit = defineEmits<{ "update:value": [value: Value] }>();

const id = useId();
const labelId = `${id}-label`;
const errorId = `${id}-error`;
const invalid = computed(() => error !== undefined);
const group = useTemplateRef("group");

// The description is inside the pressable row, so the row's text would name the radio
// together with it. The label alone names it; the description describes it.
const describedBy = (index: number, description: string | undefined) =>
  [description ? `${id}-${index}-description` : undefined, invalid.value ? errorId : undefined]
    .filter(Boolean)
    .join(" ") || undefined;

function choose(option: Value) {
  emit("update:value", option);
  // The browser moved the dot already; where the owner kept the old value, it goes back, on
  // every radio of the group.
  for (const input of group.value?.querySelectorAll("input") ?? []) {
    keepChecked(input, () => input.value === value);
  }
}
</script>

<template>
  <div
    ref="group"
    role="radiogroup"
    :aria-labelledby="labelId"
    :aria-describedby="invalid ? errorId : undefined"
    :aria-invalid="invalid ? 'true' : undefined"
    :aria-disabled="disabled ? 'true' : undefined"
    aria-orientation="vertical"
    class="radio-group"
  >
    <span :id="labelId" class="radio-group__label">{{ label }}</span>
    <div class="radio-group__options">
      <label v-for="(option, index) in options" :key="option.value" class="radio-group__option">
        <!-- aria-invalid is on each radio as well as the group, so it is heard on the radio
             that has focus. Radios group by name, which is what makes the arrow keys move
             between them. -->
        <input
          type="radio"
          class="radio-group__input sr-only"
          :name="name ?? id"
          :value="option.value"
          :checked="option.value === value"
          :disabled="disabled"
          :aria-labelledby="`${id}-${index}`"
          :aria-describedby="describedBy(index, option.description)"
          :aria-invalid="invalid ? 'true' : undefined"
          @change="choose(option.value)"
        />
        <span class="radio-group__row">
          <span class="radio-group__circle-line">
            <span class="radio-group__circle"><span class="radio-group__dot" /></span>
          </span>
          <span class="radio-group__words">
            <span :id="`${id}-${index}`" class="radio-group__text">{{ option.label }}</span>
            <span
              v-if="option.description"
              :id="`${id}-${index}-description`"
              class="radio-group__description"
            >
              {{ option.description }}
            </span>
          </span>
        </span>
      </label>
    </div>
    <!-- The region is there before the error is, so that the error is announced when it
         appears. Empty, it takes no room. -->
    <div aria-live="polite">
      <span v-if="invalid" :id="errorId" class="radio-group__error">{{ error }}</span>
    </div>
  </div>
</template>
