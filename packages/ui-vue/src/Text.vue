<script setup lang="ts">
import { type TextBaseProps, textClass } from "@acme/ui-core";

export type TextProps = TextBaseProps & {
  /** The element to render. Pick it for the document outline (`h1`, `h2`, `p`), not for looks. */
  as?: keyof HTMLElementTagNameMap;
};

const { variant, tone, as = "p" } = defineProps<TextProps>();
defineSlots<{ default(): unknown }>();
</script>

<template>
  <component :is="as" :class="textClass({ variant, tone })"><slot /></component>
</template>
