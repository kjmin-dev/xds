<script setup lang="ts">
// A choice that filters what is shown. Unlike a Badge it is pressed. A selected chip is tinted,
// outlined and marked with a check, so the state does not depend on color.
//
// It is a toggle button: assistive technology hears whether it is pressed.
import { type ChipBaseProps, chipClass, chipIcon } from "@acme/ui-core";
import { computed } from "vue";
import Icon from "./Icon.vue";

export type ChipProps = ChipBaseProps;

const { label, selected = false, disabled = false, iconStart } = defineProps<ChipProps>();
const emit = defineEmits<{ press: [] }>();
const icon = computed(() => chipIcon({ selected, iconStart }));
</script>

<template>
  <button
    type="button"
    :aria-pressed="selected ? 'true' : 'false'"
    :disabled="disabled"
    :class="chipClass(selected)"
    @click="emit('press')"
  >
    <Icon v-if="icon" :name="icon" size="sm" />{{ label }}
  </button>
</template>
