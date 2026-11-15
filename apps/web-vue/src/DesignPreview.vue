<script setup lang="ts">
// The design preview at `/design`: every token group and every component in every variant and
// state. Every web app draws the same preview, written once in @acme/ui-core/preview; this one
// draws it with @acme/ui-vue.
import { designPreview, Preview } from "@acme/ui-vue/preview";

const SCREEN = designPreview();
</script>

<template>
  <Preview :screen="SCREEN" />
</template>
