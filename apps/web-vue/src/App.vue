<script setup lang="ts">
// The first screen of the app. Replace it with your own.
import { Badge, Button, Card, Text } from "@acme/ui-vue";

function openPreview() {
  location.href = "/design";
}
</script>

<template>
  <main class="mx-auto flex max-w-2xl flex-col gap-6 p-6">
    <Text variant="display" as="h1">Acme</Text>
    <Card title="Your app starts here" description="This screen is apps/web-vue/src/App.vue.">
      <template #actions><Badge tone="accent">Vue</Badge></template>
      <Text tone="secondary">Build it from the components in @acme/ui-vue.</Text>
      <div>
        <Button variant="primary" @press="openPreview">Open the design preview</Button>
      </div>
    </Card>
  </main>
</template>
