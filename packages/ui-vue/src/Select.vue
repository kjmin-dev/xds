<script setup lang="ts" generic="Value extends string = string">
// A field for choosing one option from a list too long to show at once. Closed, it looks like a
// TextField; pressed, it opens the list under itself with a Menu's surface, as wide as the
// field. Choosing an option sets the value and closes the list; a press outside or Escape
// closes it too.
//
// The field is a button that says it opens a list box and whether the list is open. In the list
// the arrow keys move, typing jumps to an option, and Enter chooses. The chosen option is
// selected for assistive technology and marked with a check.
import { space } from "@acme/tokens";
import {
  keepListKeys,
  type SelectBaseProps,
  type SelectOption,
  selectOptionIds,
} from "@acme/ui-core";
import * as select from "@zag-js/select";
import { normalizeProps, useMachine } from "@zag-js/vue";
import { computed, useId, useTemplateRef } from "vue";
import Icon from "./Icon.vue";
import { useModalPopover } from "./modal-popover.ts";
import { usePresence } from "./presence.ts";

export type { SelectOption } from "@acme/ui-core";

export type SelectProps<Value extends string = string> = SelectBaseProps<Value>;

type KeyHandler = (event: KeyboardEvent) => void;

// `v-model:value`, written out rather than with defineModel: the value may be left out, but a
// choice is never undefined, and defineModel would say that it can be.
const {
  value,
  label,
  options,
  placeholder,
  description,
  error,
  name,
  disabled = false,
} = defineProps<SelectProps<Value>>();
const emit = defineEmits<{ "update:value": [value: Value] }>();

const id = useId();
const valueId = `${id}-value`;
const descriptionId = `${id}-description`;
const errorId = `${id}-error`;
const invalid = computed(() => error !== undefined);
const collection = computed(() =>
  select.collection<SelectOption<Value>>({
    items: [...options],
    itemToValue: (option) => option.value,
    itemToString: (option) => option.label,
  }),
);
const service = useMachine(
  select.machine,
  computed(() => ({
    id,
    collection: collection.value,
    value: value === undefined ? [] : [value],
    onValueChange: (details: select.ValueChangeDetails<SelectOption<Value>>) => {
      const next = details.value[0];
      if (next !== undefined) emit("update:value", next as Value);
    },
    disabled,
    invalid: invalid.value,
    name,
    positioning: {
      placement: "bottom-start" as const,
      gutter: space[1],
      sameWidth: true,
      // The list keeps this far from the window's edges.
      overflowPadding: space[3],
    },
  })),
);
const api = computed(() => select.connect(service, normalizeProps));
// Zag's key handlers read whether a search by typing is under way when the field renders, and
// a search ends on a timer, which renders nothing: long after a search, Space would still
// search for a space instead of opening the list or choosing. A handler taken from the machine
// when the key comes reads it then.
const current = () => select.connect(service, normalizeProps);
// A span: the field is a button, which a <label> cannot point at. A press on it still focuses
// the field.
const labelProps = computed(() => {
  const { for: _, ...rest } = api.value.getLabelProps();
  return rest;
});
// A button that opens a list box, rather than Zag's combobox: named by the chosen option and
// then the label, and described by the help or the error. The error is said there, so the
// button itself does not claim to be invalid or required.
const triggerProps = computed(() => {
  const {
    role: _role,
    "aria-invalid": _invalid,
    "aria-required": _required,
    onKeydown: _onKeydown,
    ...rest
  } = api.value.getTriggerProps();
  return {
    ...rest,
    // Home and End leave a closed field to the page; Zag would choose the first or the last
    // option.
    onKeydown: (event: KeyboardEvent) => {
      if (!api.value.open && (event.key === "Home" || event.key === "End")) return;
      (current().getTriggerProps().onKeydown as KeyHandler | undefined)?.(event);
    },
  };
});
const positioner = useTemplateRef<HTMLDivElement>("positioner");
const surface = useTemplateRef<HTMLDivElement>("surface");
useModalPopover(
  () => api.value.open,
  () => positioner.value,
);
const present = usePresence(
  () => api.value.open,
  () => [surface.value],
);
const content = computed(() => {
  const { onKeydown: _onKeydown, ...rest } = api.value.getContentProps();
  return {
    ...rest,
    onKeydown: (event: KeyboardEvent) => {
      keepListKeys(event, surface.value, ".acme-select__item:not([data-disabled])", (next) =>
        api.value.setHighlightedValue(next),
      );
      (current().getContentProps().onKeydown as KeyHandler | undefined)?.(event);
    },
  };
});
</script>

<template>
  <div v-bind="api.getRootProps()" class="acme-select">
    <span v-bind="labelProps" class="acme-select__label">{{ label }}</span>
    <button
      v-bind="triggerProps"
      :aria-labelledby="`${valueId} ${labelProps.id}`"
      :aria-describedby="invalid ? errorId : description ? descriptionId : undefined"
      class="acme-select__trigger"
    >
      <!-- The chosen option's label alone: the list's rows also hold a description and a
           check, which do not belong in the field. -->
      <span v-bind="api.getValueTextProps()" :id="valueId" class="acme-select__value">
        {{ api.valueAsString || placeholder }}
      </span>
      <Icon name="chevrons-up-down" size="sm" class="text-acme-field-placeholder" />
    </button>
    <!-- One line under the box: the help, or the error in its place. -->
    <div v-if="invalid || description" class="acme-select__footer">
      <span v-if="invalid" :id="errorId" class="acme-select__error">{{ error }}</span>
      <span v-else :id="descriptionId" class="acme-select__description">{{ description }}</span>
    </div>
    <!-- What a form submits; the first option stands for no choice. Zag's props hide it from
         assistive technology, which uses the trigger. -->
    <select v-bind="api.getHiddenSelectProps()">
      <option value="" />
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <Teleport to="body">
      <!-- Takes a press outside, which then only closes the list. The focus stays in the list
           until the list hands it back to the field. -->
      <div v-if="api.open" class="acme-select__underlay" @mousedown.prevent />
      <div ref="positioner" v-bind="api.getPositionerProps()" class="acme-select__positioner">
        <!-- Shown until its exit animation ends; Zag would hide it as it closes. -->
        <div v-bind="content" ref="surface" :hidden="!present" class="acme-select__content">
          <div v-bind="api.getListProps()" class="acme-select__list">
            <!-- Named by its label alone, as the field shows it; the help line describes it. -->
            <div
              v-for="(option, index) in collection.items"
              :key="option.value"
              v-bind="api.getItemProps({ item: option })"
              :aria-labelledby="selectOptionIds(id, index).label"
              :aria-describedby="
                option.description ? selectOptionIds(id, index).description : undefined
              "
              class="acme-select__item"
            >
              <span class="acme-select__item-words">
                <span
                  v-bind="api.getItemTextProps({ item: option })"
                  :id="selectOptionIds(id, index).label"
                  class="acme-select__item-label"
                >
                  {{ option.label }}
                </span>
                <span
                  v-if="option.description"
                  :id="selectOptionIds(id, index).description"
                  class="acme-select__item-description"
                >
                  {{ option.description }}
                </span>
              </span>
              <!-- Unnamed, unlike a Menu's: the option itself reports that it is selected. -->
              <Icon v-if="api.getItemState({ item: option }).selected" name="check" size="sm" />
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
