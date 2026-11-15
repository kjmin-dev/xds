<!-- The first screen of the app. Replace it with your own. -->
<script lang="ts">
  import { Badge, Button, Card, Text } from "@acme/ui-svelte";
</script>

<main class="mx-auto flex max-w-2xl flex-col gap-6 p-6">
  <Text variant="display" as="h1">Acme</Text>
  <Card title="Your app starts here" description="This screen is apps/web-svelte/src/App.svelte.">
    {#snippet actions()}<Badge tone="accent">Svelte</Badge>{/snippet}
    <Text tone="secondary">Build it from the components in @acme/ui-svelte.</Text>
    <div>
      <Button
        variant="primary"
        onPress={() => {
          location.href = "/design";
        }}>Open the design preview</Button
      >
    </div>
  </Card>
</main>
