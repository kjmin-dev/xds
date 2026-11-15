<script setup lang="ts">
// Picks a number in a range by dragging the thumb, or by pressing the track where it should
// go. The values snap to `step`.
//
// It is a slider named by its label with its value, minimum and maximum, and each arrow key
// moves it one step.
import {
  focusThumbOnPress,
  type SliderBaseProps,
  sliderArrowValue,
  sliderPageSize,
  sliderValueText,
} from "@acme/ui-core";
import * as slider from "@zag-js/slider";
import { mergeProps, normalizeProps, useMachine } from "@zag-js/vue";
import { computed, useId, useTemplateRef } from "vue";

export type SliderProps = Omit<SliderBaseProps, "value">;

const value = defineModel<number>("value", { required: true });
const {
  label,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  showValue = false,
} = defineProps<SliderProps>();

const id = useId();
const pageSize = computed(() => sliderPageSize({ min, max, step }));
const service = useMachine(
  slider.machine,
  computed(() => ({
    id,
    value: [value.value],
    // One thumb, so one number.
    onValueChange: (details: slider.ValueChangeDetails) => (value.value = details.value[0] ?? min),
    min,
    max,
    step,
    largeStep: pageSize.value,
    disabled,
    // The thumb's center is on the value, at the ends too; the band is inset to make room.
    thumbAlignment: "center" as const,
    getAriaValueText: (details: { value: number }) => sliderValueText(details.value),
  })),
);
const api = computed(() => slider.connect(service, normalizeProps));
const thumbElement = useTemplateRef<HTMLDivElement>("thumb");
const thumb = computed(() =>
  mergeProps(api.value.getThumbProps({ index: 0 }), {
    // Up and Down move a horizontal slider too, as they move a native range input.
    onKeydown: (event: KeyboardEvent) => {
      if (disabled) return;
      const next = sliderArrowValue(event, {
        value: api.value.value[0] ?? min,
        min,
        max,
        step,
        pageSize: pageSize.value,
      });
      if (next !== undefined) api.value.setThumbValue(0, next);
    },
  }),
);
const control = computed(() =>
  mergeProps(api.value.getControlProps(), {
    // No focus ring after a press. This handler runs before Zag's.
    onPointerdown: (event: PointerEvent) => {
      if (!disabled) focusThumbOnPress(event, thumbElement.value ?? undefined);
    },
  }),
);
</script>

<template>
  <!-- A group named by the label, around the label, the value and the slider. Not a fieldset:
       that is for a set of fields, and this is one slider and its label. -->
  <div
    v-bind="api.getRootProps()"
    role="group"
    :aria-labelledby="api.getLabelProps().id"
    class="slider"
  >
    <!-- Zag's props give it `for`, the hidden input's id. -->
    <label v-bind="api.getLabelProps()" class="slider__label">{{ label }}</label>
    <!-- Read when asked for, not at every step: the slider itself announces its value. -->
    <output
      v-if="showValue"
      v-bind="api.getValueTextProps()"
      aria-live="off"
      class="slider__output"
    >
      {{ sliderValueText(api.value[0] ?? value) }}
    </output>
    <div v-bind="control" class="slider__control">
      <div v-bind="api.getTrackProps()" class="slider__track">
        <div v-bind="api.getRangeProps()" class="slider__range" />
      </div>
      <div v-bind="thumb" ref="thumb" class="slider__thumb">
        <input v-bind="api.getHiddenInputProps({ index: 0 })" />
      </div>
    </div>
  </div>
</template>
