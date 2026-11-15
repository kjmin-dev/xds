<script setup lang="ts">
// A ListRow that says what kind of current item its selected state is. A Sidebar's rows are the
// places of an app, so its selected row is the current page. Only for this package's own
// components: the index does not export it.
import {
  LIST_ROW_PARTS,
  type ListRowBaseProps,
  listRowClass,
  listRowDescriptionClass,
  listRowTitleClass,
} from "@acme/ui-core";
import { computed } from "vue";
import Icon from "./Icon.vue";

const {
  title,
  description,
  chevron = false,
  selected = false,
  compact = false,
  disabled = false,
  onPress,
  current,
} = defineProps<ListRowBaseProps & { onPress?: () => void; current: "true" | "page" }>();
defineSlots<{ leading?(): unknown; trailing?(): unknown }>();

const pressable = computed(() => onPress !== undefined);
const row = computed(() =>
  pressable.value
    ? { type: "button", disabled, onClick: () => onPress?.() }
    : ({} as Record<string, never>),
);
</script>

<template>
  <component
    :is="pressable ? 'button' : 'div'"
    v-bind="row"
    :aria-current="selected ? current : undefined"
    :class="listRowClass({ compact, selected, pressable })"
  >
    <slot name="leading" />
    <span :class="LIST_ROW_PARTS.text">
      <span :class="listRowTitleClass({ compact, selected, disabled })">{{ title }}</span>
      <span v-if="description" :class="listRowDescriptionClass(compact)">{{ description }}</span>
    </span>
    <slot name="trailing" />
    <Icon v-if="chevron" name="chevron-right" size="sm" :class="LIST_ROW_PARTS.chevron" />
  </component>
</template>
