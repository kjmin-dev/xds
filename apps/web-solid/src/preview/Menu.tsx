import { Button, IconButton, Menu, Text } from "@acme/ui-solid";
import { createSignal } from "solid-js";
import { openOnLoad } from "./open.ts";
import { Row } from "./shared.tsx";

export function MenuSection() {
  const [chosen, setChosen] = createSignal("Nothing chosen yet.");
  const [density, setDensity] = createSignal<"comfortable" | "compact">("comfortable");
  let menu!: HTMLSpanElement;
  openOnLoad("menu", () => menu);
  return (
    <Row label="menu">
      <span ref={(element) => (menu = element)} class="flex">
        <Menu
          label="Report actions"
          trigger={<Button iconEnd="chevron-down">Actions</Button>}
          items={[
            { label: "Rename", icon: "pencil", onSelect: () => setChosen("Rename") },
            { label: "Duplicate", icon: "copy", onSelect: () => setChosen("Duplicate") },
            { label: "Share", icon: "share-2", onSelect: () => {}, disabled: true },
            "separator",
            {
              label: "Comfortable",
              icon: "list",
              selected: density() === "comfortable",
              onSelect: () => setDensity("comfortable"),
            },
            {
              label: "Compact",
              icon: "layout-grid",
              selected: density() === "compact",
              onSelect: () => setDensity("compact"),
            },
            "separator",
            {
              label: "Delete",
              icon: "trash",
              danger: true,
              onSelect: () => setChosen("Delete"),
            },
          ]}
        />
      </span>
      <Menu
        label="More actions"
        align="end"
        trigger={<IconButton icon="ellipsis" label="More actions" variant="secondary" />}
        items={[
          { label: "Copy the link", onSelect: () => setChosen("Copy the link") },
          { label: "Open in a new window", onSelect: () => setChosen("Open in a new window") },
        ]}
      />
      <Text variant="detail" tone="secondary" as="span">
        {chosen()} Density: {density()}.
      </Text>
    </Row>
  );
}
