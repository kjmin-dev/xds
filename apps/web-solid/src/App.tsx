// The first screen of the app. Replace it with your own.

import { Badge, Button, Card, Text } from "@acme/ui-solid";

export function App() {
  return (
    <main class="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <Text variant="display" as="h1">
        Acme
      </Text>
      <Card
        title="Your app starts here"
        description="This screen is apps/web-solid/src/App.tsx."
        actions={<Badge tone="accent">Solid</Badge>}
      >
        <Text tone="secondary">Build it from the components in @acme/ui-solid.</Text>
        <div>
          <Button
            variant="primary"
            onPress={() => {
              location.href = "/design";
            }}
          >
            Open the design preview
          </Button>
        </div>
      </Card>
    </main>
  );
}
