import { Button, Card, EmptyState } from "@acme/ui-solid";

export function EmptyStateSection() {
  return (
    <div class="grid gap-4 sm:grid-cols-2">
      <Card>
        <EmptyState
          icon="mail"
          title="No messages yet"
          description="When someone writes to you, the conversation shows up here."
          action={
            <Button variant="primary" iconStart="plus">
              New message
            </Button>
          }
        />
      </Card>
      <Card>
        <EmptyState
          icon="search"
          title="No results"
          description="Try fewer words, or check the spelling."
        />
      </Card>
    </div>
  );
}
