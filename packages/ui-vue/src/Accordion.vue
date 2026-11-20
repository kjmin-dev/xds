<script setup lang="ts" generic="Value extends string = string">
// Items whose bodies open and close under their titles, separated by hairlines. The chevron
// turns over when an item is open, so the state does not depend on color. Opening and closing
// animate the height, and do not for people who ask for less motion.
//
// Each title is a heading holding a button that says whether its body is expanded and which
// body it controls. A closed body is hidden, but the browser's find in page still opens it.
import {
  ACCORDION_PARTS,
  type AccordionBaseProps,
  type AccordionItemBase,
  focusTitleOnClick,
} from "@acme/ui-core";
import * as accordion from "@zag-js/accordion";
import { mergeProps, normalizeProps, useMachine } from "@zag-js/vue";
import { computed, useId } from "vue";
import AccordionPanel from "./AccordionPanel.vue";
import Icon from "./Icon.vue";

export type AccordionItem<Value extends string = string> = AccordionItemBase<Value> & {
  /** The body, shown under the title while the item is open. */
  content: string;
};

export type AccordionProps<Value extends string = string> = AccordionBaseProps<Value> & {
  items: readonly AccordionItem<Value>[];
};

// `v-model:expanded`, written out rather than with defineModel: it takes a list it does not
// change, and hands back a new one, which the owner may change.
const { expanded, items, multiple = false } = defineProps<AccordionProps<Value>>();
const emit = defineEmits<{ "update:expanded": [expanded: Value[]] }>();

const id = useId();
const service = useMachine(
  accordion.machine,
  computed(() => ({
    id,
    value: [...expanded],
    onValueChange: (details: accordion.ValueChangeDetails) =>
      emit("update:expanded", details.value as Value[]),
    multiple,
    collapsible: true,
    hiddenUntilFound: true,
  })),
);
const api = computed(() => accordion.connect(service, normalizeProps));
const trigger = (value: Value) =>
  // Runs before Zag's handler.
  mergeProps(api.value.getItemTriggerProps({ value }), { onClick: focusTitleOnClick });
const body = (value: Value) => {
  // The panel hides itself once it has finished closing.
  const { hidden: _hidden, ...attributes } = api.value.getItemContentProps({ value });
  return attributes;
};
</script>

<template>
  <div v-bind="api.getRootProps()" class="acme-accordion">
    <div
      v-for="item in items"
      :key="item.value"
      v-bind="api.getItemProps({ value: item.value })"
      class="acme-accordion__item"
    >
      <h3 v-bind="api.getItemHeaderProps({ value: item.value })" class="acme-accordion__heading">
        <button v-bind="trigger(item.value)" class="acme-accordion__trigger group">
          <span :class="ACCORDION_PARTS.text">
            <span :class="ACCORDION_PARTS.title">{{ item.title }}</span>
            <span v-if="item.description" :class="ACCORDION_PARTS.description">
              {{ item.description }}
            </span>
          </span>
          <Icon name="chevron-down" size="sm" :class="ACCORDION_PARTS.chevron" />
        </button>
      </h3>
      <AccordionPanel :attributes="body(item.value)" :open="api.value.includes(item.value)">
        {{ item.content }}
      </AccordionPanel>
    </div>
  </div>
</template>
