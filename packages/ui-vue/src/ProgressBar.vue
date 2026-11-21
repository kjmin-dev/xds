<script setup lang="ts">
// How far along something is, from 0 to 1. For work of unknown length use a Spinner.
// `label` says what is progressing; a screen reader reads it with the percentage.
import {
  classes,
  type ProgressBarBaseProps,
  progressBarClass,
  progressBarFillClass,
  progressPercent,
  rootPart,
} from "@acme/ui-core";
import { computed } from "vue";

export type ProgressBarProps = ProgressBarBaseProps;

const { value, label } = defineProps<ProgressBarProps>();
const percent = computed(() => progressPercent(value));
</script>

<template>
  <div
    role="progressbar"
    :aria-label="label"
    :aria-valuemin="0"
    :aria-valuemax="100"
    :aria-valuenow="percent"
    :class="classes(rootPart('ProgressBar'), progressBarClass)"
  >
    <div :class="progressBarFillClass" :style="{ width: `${percent}%` }" />
  </div>
</template>
