import { Button, Dialog, TextField } from "@acme/ui-solid";
import { createSignal } from "solid-js";
import { OPEN } from "./open.ts";
import { Row } from "./shared.tsx";

export function DialogSection() {
  const [confirming, setConfirming] = createSignal(OPEN === "dialog");
  const [asking, setAsking] = createSignal(false);
  const [copyName, setCopyName] = createSignal("Weekly report, my copy");
  return (
    <>
      <Row label="dialog">
        <Button variant="danger" onPress={() => setConfirming(true)}>
          Delete the report
        </Button>
        <Button onPress={() => setAsking(true)}>A question that must be answered</Button>
      </Row>
      <Dialog
        open={confirming()}
        onClose={() => setConfirming(false)}
        title="Delete the weekly report?"
        description="The report and its 12 comments are removed for everyone. This cannot be undone."
        actions={
          <>
            <Button onPress={() => setConfirming(false)}>Cancel</Button>
            <Button variant="danger" onPress={() => setConfirming(false)}>
              Delete
            </Button>
          </>
        }
      />
      <Dialog
        open={asking()}
        onClose={() => setAsking(false)}
        dismissible={false}
        title="Keep the changes?"
        description="You edited the report in another window."
        actions={
          <>
            <Button onPress={() => setAsking(false)}>Discard</Button>
            <Button variant="primary" onPress={() => setAsking(false)}>
              Keep
            </Button>
          </>
        }
      >
        <TextField label="Name of the copy" value={copyName()} onChange={setCopyName} />
      </Dialog>
    </>
  );
}
