import { Button, type ButtonVariant, type ControlSize, IconButton } from "@acme/ui-solid";
import { createSignal, For, Show } from "solid-js";
import { OPEN } from "./open.ts";
import { Row } from "./shared.tsx";
import { TooltipRow } from "./TooltipRow.tsx";

const VARIANTS: ButtonVariant[] = ["primary", "secondary", "ghost", "danger"];
const SIZES: ControlSize[] = ["sm", "md", "lg"];

export function ButtonsSection() {
  const [liked, setLiked] = createSignal(true);
  const [saved, setSaved] = createSignal(true);
  const [pinned, setPinned] = createSignal(true);
  return (
    <>
      <Show when={OPEN === "tooltip"}>
        <TooltipRow />
      </Show>
      <For each={VARIANTS}>
        {(variant) => (
          <Row label={variant}>
            <For each={SIZES}>
              {(buttonSize) => (
                <Button variant={variant} size={buttonSize}>
                  Save
                </Button>
              )}
            </For>
            <Button variant={variant} disabled>
              Disabled
            </Button>
            <Button variant={variant} loading>
              Saving
            </Button>
          </Row>
        )}
      </For>
      <Row label="icons">
        <Button variant="primary" iconStart="plus">
          New
        </Button>
        <Button iconEnd="chevron-down">Options</Button>
        <Button variant="ghost" size="sm" iconStart="download">
          Export
        </Button>
        <Button variant="primary" size="lg" iconStart="upload" iconEnd="arrow-right">
          Publish
        </Button>
        <Button variant="ghost" iconStart="settings" aria-label="Settings" />
        <Button size="sm" iconStart="ellipsis" aria-label="More" />
      </Row>
      <Row label="icon, loading">
        <Button iconStart="download">Export</Button>
        <Button iconStart="download" loading>
          Export
        </Button>
        <Button size="lg" iconStart="download">
          Export
        </Button>
        <Button size="lg" iconStart="download" loading>
          Export
        </Button>
      </Row>
      <Row label="selected">
        <Button iconStart="heart" selected={liked()} onPress={() => setLiked(!liked())}>
          Like
        </Button>
        <Button iconStart="heart" selected={false}>
          Like
        </Button>
        <Button
          variant="ghost"
          iconStart="bookmark"
          selected={saved()}
          onPress={() => setSaved(!saved())}
        >
          Save
        </Button>
        <Button variant="ghost" iconStart="bookmark" selected={false}>
          Save
        </Button>
        <Button variant="ghost" size="sm" iconStart="star" selected aria-label="Starred" />
        <Button iconStart="heart" selected disabled>
          Disabled
        </Button>
        <Button variant="primary" iconStart="bell" selected>
          Primary
        </Button>
      </Row>
      <For each={VARIANTS}>
        {(variant) => (
          <Row label={`icon, ${variant}`}>
            <For each={SIZES}>
              {(buttonSize) => (
                <IconButton
                  icon="settings"
                  label={`Settings, ${buttonSize}`}
                  variant={variant}
                  size={buttonSize}
                />
              )}
            </For>
            <IconButton icon="settings" label="Disabled" variant={variant} disabled />
            <IconButton icon="settings" label="Loading" variant={variant} loading />
          </Row>
        )}
      </For>
      <Row label="icon, selected">
        <IconButton
          icon="pin"
          label="Pin"
          selected={pinned()}
          onPress={() => setPinned(!pinned())}
        />
        <IconButton icon="pin" label="Pin" selected={false} />
        <IconButton icon="star" label="Star" variant="secondary" selected />
        <IconButton icon="star" label="Star" variant="secondary" selected={false} />
        <IconButton icon="heart" label="Like" size="sm" selected />
        <IconButton icon="heart" label="Like" size="lg" selected />
        <IconButton icon="bookmark" label="Save" selected disabled />
        <IconButton icon="bell" label="Notify" variant="primary" selected />
      </Row>
      <Show when={OPEN !== "tooltip"}>
        <TooltipRow />
      </Show>
    </>
  );
}
