<script setup lang="ts">
// Says that something is in progress and how long is unknown. Takes the color of the text
// around it. With `label` it is announced; without one it is decoration next to text that
// already says what is happening.
import { classes, rootPart, type SpinnerBaseProps, spinnerClass } from "@acme/ui-core";
import { useDefaults } from "./defaults.ts";

export type SpinnerProps = SpinnerBaseProps;

const { size, label } = defineProps<SpinnerProps>();
const options = useDefaults("Spinner", () => ({ size }));
</script>

<template>
  <span
    :class="classes(rootPart('Spinner'), 'inline-flex shrink-0')"
    :role="label ? 'status' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
  >
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" :class="spinnerClass(options.size)">
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" opacity="0.25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
      />
    </svg>
  </span>
</template>
