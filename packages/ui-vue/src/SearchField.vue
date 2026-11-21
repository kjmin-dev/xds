<script setup lang="ts">
// A text field for a query: TextField's box as a pill, with a search icon in front and, while
// there is a value, a control that clears it. Escape clears too.
//
// Use it to filter or search what is on the screen. For a value that is saved with a form,
// use a TextField, which has a visible label.
import { classes, rootPart, type SearchFieldBaseProps } from "@acme/ui-core";
import { useTemplateRef } from "vue";
import { keepValue } from "./controlled.ts";
import Icon from "./Icon.vue";

export type SearchFieldProps = Omit<SearchFieldBaseProps, "value">;

const value = defineModel<string>("value", { required: true });
const {
  label,
  placeholder,
  disabled = false,
  clearLabel = "Clear",
} = defineProps<SearchFieldProps>();
const emit = defineEmits<{
  /** The query, on Enter or on the search key of a software keyboard. */
  submit: [value: string];
}>();
const input = useTemplateRef("input");

function edit(event: Event) {
  const field = event.currentTarget as HTMLInputElement;
  value.value = field.value;
  if (!(event as InputEvent).isComposing) keepValue(field, () => value.value);
}
function settle(event: CompositionEvent) {
  keepValue(event.currentTarget as HTMLInputElement, () => value.value);
}
function key(event: KeyboardEvent) {
  // While a composition is open, Enter and Escape belong to the input method.
  if (event.isComposing) return;
  if (event.key === "Enter") emit("submit", value.value);
  if (event.key === "Escape" && value.value !== "") {
    event.stopPropagation();
    value.value = "";
  }
}
function clear() {
  value.value = "";
  // The control is about to disappear, and focus would be lost with it.
  input.value?.focus();
}
</script>

<template>
  <div :class="classes('acme-text-field', rootPart('SearchField'))">
    <div class="acme-text-field__control acme-text-field__control--pill acme-text-field__group">
      <span class="acme-text-field__slot acme-text-field__slot--leading"
        ><Icon name="search" size="sm"
      /></span>
      <!-- Escape clears only while there is something to clear; an empty field lets Escape
           through to whatever it sits in, such as a dialog. -->
      <input
        ref="input"
        type="text"
        class="acme-text-field__input"
        :aria-label="label"
        enterkeyhint="search"
        :placeholder="placeholder"
        :value="value"
        :disabled="disabled"
        :data-uses-escape="value !== '' ? '' : undefined"
        @input="edit"
        @compositionend="settle"
        @keydown="key"
      />
      <span
        v-if="value !== '' && !disabled"
        class="acme-text-field__slot acme-text-field__slot--trailing"
      >
        <button
          type="button"
          :aria-label="clearLabel"
          class="-me-1 flex size-acme-target-min cursor-pointer items-center justify-center rounded-acme-full hover:text-acme-field-text focus-visible:outline-(length:--acme-focus-width) focus-visible:outline-acme-border-focus focus-visible:outline-solid"
          @click="clear"
        >
          <Icon name="circle-x" size="sm" />
        </button>
      </span>
    </div>
  </div>
</template>
