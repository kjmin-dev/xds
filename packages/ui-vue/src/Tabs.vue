<script setup lang="ts" generic="Value extends string">
// Switches between views inside one screen. For two to four short modes a SegmentedControl is
// lighter; tabs are for more items, longer labels, or a row that may have to scroll.
//
// The selected tab is underlined as well as darker, so the choice does not depend on color.
// This is only the row: the app shows the view that matches `value`. The arrow keys move
// between tabs.
import { type TabsBaseProps, tabStopIndex, tabsClass } from "@acme/ui-core";
import * as tabs from "@zag-js/tabs";
import { normalizeProps, useMachine } from "@zag-js/vue";
import { computed, useId } from "vue";
import Icon from "./Icon.vue";

export type TabsProps<Value extends string> = Omit<TabsBaseProps<Value>, "value">;

const value = defineModel<Value>("value", { required: true });
const { items, label, fullWidth = false } = defineProps<TabsProps<Value>>();

const id = useId();
const service = useMachine(
  tabs.machine,
  computed(() => ({
    id,
    value: value.value,
    onValueChange: (details: tabs.ValueChangeDetails) => (value.value = details.value as Value),
  })),
);
const api = computed(() => tabs.connect(service, normalizeProps));
const trigger = (item: Value) => {
  const props = api.value.getTriggerProps({ value: item });
  return { ...props, tabindex: tabStopIndex(api.value.focusedValue, item, props.tabindex) };
};
</script>

<template>
  <div v-bind="api.getRootProps()" :class="tabsClass(fullWidth)">
    <div v-bind="api.getListProps()" :aria-label="label" class="acme-tabs__list">
      <!-- Zag points the selected tab at its panel, which this row never renders: the app
           shows the view. A reference to an element that does not exist is invalid. -->
      <button
        v-for="item in items"
        :key="item.value"
        v-bind="trigger(item.value)"
        :aria-controls="undefined"
        type="button"
        class="acme-tabs__tab"
      >
        <Icon v-if="item.icon" :name="item.icon" size="sm" />{{ item.label }}
      </button>
      <div v-bind="api.getIndicatorProps()" class="acme-tabs__indicator" />
    </div>
  </div>
</template>
