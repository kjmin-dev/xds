<script setup lang="ts">
import { classes, rootPart, type TextBaseProps, textClass } from "@acme/ui-core";
import { useDefaults } from "./defaults.ts";

export type TextProps = TextBaseProps & {
  /** The element to render. Pick it for the document outline (`h1`, `h2`, `p`), not for looks. */
  as?: keyof HTMLElementTagNameMap;
};

const { variant, tone, as = "p" } = defineProps<TextProps>();
defineSlots<{ default(): unknown }>();
const options = useDefaults("Text", () => ({ variant, tone }));
</script>

<template>
  <component :is="as" :class="classes(rootPart('Text'), textClass(options))"><slot /></component>
</template>
