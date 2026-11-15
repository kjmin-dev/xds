<script setup lang="ts">
// Holds the place of content that is loading, in the shape the content will have. It pulses,
// and stands still for people who ask for less motion.
//
// It is hidden from assistive technology: the screen that shows skeletons says that it is
// loading, once, instead of every placeholder saying so.
import { type SkeletonBaseProps, skeletonClass, skeletonSize } from "@acme/ui-core";

export type SkeletonProps = SkeletonBaseProps;

const { shape, width, height } = defineProps<SkeletonProps>();
</script>

<template>
  <span
    aria-hidden="true"
    :class="skeletonClass(shape)"
    :style="skeletonSize({ shape, width, height })"
  />
</template>
