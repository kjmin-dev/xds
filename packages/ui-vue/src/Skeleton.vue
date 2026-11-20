<script setup lang="ts">
// Holds the place of content that is loading, in the shape the content will have. It pulses,
// and stands still for people who ask for less motion.
//
// It is hidden from assistive technology: the screen that shows skeletons says that it is
// loading, once, instead of every placeholder saying so.
import {
  classes,
  rootPart,
  type SkeletonBaseProps,
  skeletonClass,
  skeletonSize,
} from "@acme/ui-core";
import { useDefaults } from "./defaults.ts";

export type SkeletonProps = SkeletonBaseProps;

const { shape, width, height } = defineProps<SkeletonProps>();
const options = useDefaults("Skeleton", () => ({ shape }));
</script>

<template>
  <span
    aria-hidden="true"
    :class="classes(rootPart('Skeleton'), skeletonClass(options.shape))"
    :style="skeletonSize({ shape: options.shape, width, height })"
  />
</template>
