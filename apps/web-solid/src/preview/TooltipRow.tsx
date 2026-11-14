// The tooltip row of the Buttons section: at its end, or at its top with `?open=tooltip`, which
// focuses the first control as a keyboard would.

import { Button, IconButton, Text, Tooltip } from "@acme/ui-solid";
import { openOnLoad } from "./open.ts";
import { Row } from "./shared.tsx";

export function TooltipRow() {
  let tooltip!: HTMLSpanElement;
  openOnLoad("tooltip", () => tooltip);
  return (
    <Row label="tooltip">
      <span ref={(element) => (tooltip = element)} class="flex">
        <Tooltip label="Search" shortcut="⌘K">
          <IconButton icon="search" label="Search" />
        </Tooltip>
      </span>
      <Tooltip label="Share" placement="bottom">
        <IconButton icon="share-2" label="Share" variant="secondary" />
      </Tooltip>
      <Tooltip label="Export as a spreadsheet">
        <Button iconStart="download">Export</Button>
      </Tooltip>
      <Text variant="detail" tone="secondary" as="span">
        Rest the pointer on a control, or focus it with the keyboard.
      </Text>
    </Row>
  );
}
