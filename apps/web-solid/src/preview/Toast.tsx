import { Button, Text, Toast } from "@acme/ui-solid";
import { createSignal } from "solid-js";
import { OPEN } from "./open.ts";
import { Row } from "./shared.tsx";

export function ToastSection() {
  const [toast, setToast] = createSignal(OPEN === "toast");
  const [deleted, setDeleted] = createSignal(OPEN === "toast");
  return (
    <>
      <Row label="toast">
        <Button
          onPress={() => {
            setDeleted(true);
            setToast(true);
          }}
        >
          Delete a draft
        </Button>
        <Text variant="detail" tone="secondary" as="span">
          {deleted() ? "The draft is deleted." : "The draft is there."}
        </Text>
      </Row>
      <Toast
        open={toast()}
        onClose={() => setToast(false)}
        message="The draft was deleted."
        action={{ label: "Undo", onPress: () => setDeleted(false) }}
        // The scripted mode keeps it, so a capture does not race the timer.
        {...(OPEN === "toast" ? { duration: 0 } : {})}
      />
    </>
  );
}
