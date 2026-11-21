<script setup lang="ts">
// A line between groups of content. Decorative lines use the low-contrast border color.
import { classes, dividerClass, rootPart } from "@acme/ui-core";
</script>

<template>
  <hr :class="classes(rootPart('Divider'), dividerClass)" />
</template>
