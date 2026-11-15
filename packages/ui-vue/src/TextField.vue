<script setup lang="ts">
// A labelled text field, of one line or several. The label, the description and the error
// message are tied to the input for assistive technology, and the error is announced when it
// appears.
//
// An invalid field blocks its form from being submitted, so `error` has to be cleared as soon as
// the person edits the value.
import type { TextFieldBaseProps } from "@acme/ui-core";
import { computed, onMounted, useId, useTemplateRef } from "vue";
import { keepValue } from "./controlled.ts";

// `autoComplete` is a string, as Vue's own `autocomplete` attribute is: the union of every
// autofill token that the shared type lists is too large for vue-tsc to destructure the props.
// The shared type takes any other string too, so what this gives up is the editor's list.
export type TextFieldProps = Omit<TextFieldBaseProps, "value" | "autoComplete"> & {
  autoComplete?: string;
};

const value = defineModel<string>("value", { required: true });
const {
  label,
  description,
  error,
  placeholder,
  multiline = false,
  rows = 3,
  maxLength,
  name,
  type = "text",
  inputMode,
  autoComplete: autocomplete,
  autoFocus = false,
  required = false,
  disabled = false,
} = defineProps<TextFieldProps>();
const slots = defineSlots<{
  /**
   * Inside the box, in front of the text: an icon, a unit. It takes the placeholder's color
   * unless it sets its own.
   */
  leading?(): unknown;
  /** Inside the box, after the text: an icon, a unit, a small button. */
  trailing?(): unknown;
}>();

const id = useId();
const descriptionId = `${id}-description`;
const errorId = `${id}-error`;
const invalid = computed(() => error !== undefined);
const input = useTemplateRef<HTMLInputElement | HTMLTextAreaElement>("input");
// The input draws the box itself until something sits inside the box beside the text.
const grouped = computed(() => slots.leading !== undefined || slots.trailing !== undefined);

onMounted(() => {
  // The value is set as a property, which leaves a text area's caret after the last line, and
  // keyboard focus would then scroll to it. React renders the first value as the text area's
  // own text, with the caret before the first line.
  if (input.value instanceof HTMLTextAreaElement) input.value.setSelectionRange(0, 0);
  if (autoFocus) input.value?.focus();
});

// The attributes the input and the text area share.
const shared = computed(() => ({
  id,
  class: grouped.value ? "text-field__input" : "text-field__input text-field__control",
  value: value.value,
  // A form's reset puts a field back to its default value: for an input its `value` attribute,
  // which Vue writes, but for a text area its text, which Vue leaves empty. React keeps both
  // equal to the value.
  defaultValue: value.value,
  placeholder,
  name,
  maxlength: maxLength,
  inputmode: inputMode,
  autocomplete,
  required,
  disabled,
  "aria-invalid": invalid.value ? ("true" as const) : undefined,
  "aria-errormessage": invalid.value ? errorId : undefined,
  "aria-describedby": invalid.value ? errorId : description ? descriptionId : undefined,
}));

function edit(event: Event) {
  const field = event.currentTarget as HTMLInputElement | HTMLTextAreaElement;
  value.value = field.value;
  // While a composition is open the text belongs to the input method; it ends with
  // compositionend.
  if (!(event as InputEvent).isComposing) keepValue(field, () => value.value);
}
function settle(event: CompositionEvent) {
  keepValue(event.currentTarget as HTMLInputElement, () => value.value);
}
</script>

<template>
  <div class="text-field">
    <label :for="id" class="text-field__label">{{ label }}</label>
    <div v-if="grouped" class="text-field__control text-field__group">
      <span v-if="slots.leading" class="text-field__slot text-field__slot--leading">
        <slot name="leading" />
      </span>
      <textarea
        v-if="multiline"
        ref="input"
        :rows="rows"
        v-bind="shared"
        @input="edit"
        @compositionend="settle"
      />
      <input
        v-else
        ref="input"
        :type="type"
        v-bind="shared"
        @input="edit"
        @compositionend="settle"
      />
      <span v-if="slots.trailing" class="text-field__slot text-field__slot--trailing">
        <slot name="trailing" />
      </span>
    </div>
    <textarea
      v-else-if="multiline"
      ref="input"
      :rows="rows"
      v-bind="shared"
      @input="edit"
      @compositionend="settle"
    />
    <input v-else ref="input" :type="type" v-bind="shared" @input="edit" @compositionend="settle" />
    <!-- One line under the box: the help or the error at the start edge, the count at the end.
         The error is a live region, so it is announced when it appears. -->
    <div class="text-field__footer">
      <span v-if="!invalid && description" :id="descriptionId" class="text-field__description">
        {{ description }}
      </span>
      <span :id="errorId" class="text-field__error" aria-live="polite">{{ error }}</span>
      <span
        v-if="maxLength !== undefined"
        class="ms-auto shrink-0 text-acme-footnote text-acme-text-secondary tabular-nums"
      >
        {{ value.length }}/{{ maxLength }}
      </span>
    </div>
  </div>
</template>
