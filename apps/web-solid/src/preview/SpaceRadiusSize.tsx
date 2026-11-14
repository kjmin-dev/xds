import { radius, size, space } from "@acme/tokens";
import { Text } from "@acme/ui-solid";
import { For } from "solid-js";
import { Row } from "./shared.tsx";

const SPACES = Object.entries(space).sort(([, a], [, b]) => a - b);

export function SpaceRadiusSizeSection() {
  return (
    <>
      <Row label="space">
        <For each={SPACES}>
          {([name, px]) => (
            <span class="flex flex-col items-center gap-1">
              <span
                class="bg-acme-accent-default"
                style={{ width: `${px}px`, height: `${px}px` }}
              />
              <Text variant="footnote" tone="secondary" as="span">
                {name.replace("_", ".")}
              </Text>
            </span>
          )}
        </For>
      </Row>
      <Row label="radius">
        <For each={Object.entries(radius)}>
          {([name, px]) => (
            <span
              class="flex size-12 items-center justify-center border border-acme-border-strong"
              style={{ "border-radius": `${px}px` }}
            >
              <Text variant="footnote" tone="secondary" as="span">
                {name}
              </Text>
            </span>
          )}
        </For>
      </Row>
      <Row label="control">
        {/* Line breaks as in the React preview: the formatter would end the first line with
            `touch{" "}`, a text node of its own, and the browser lays out the line a fraction
            of a pixel differently. */}
        {/* prettier-ignore */}
        <Text variant="detail" tone="secondary" as="span">
          Pointer {size.pointer.controlSm}/{size.pointer.controlMd}/{size.pointer.controlLg},
          touch {size.touch.controlSm}/{size.touch.controlMd}/{size.touch.controlLg}. This page
          uses the sizes of the input device it is viewed with.
        </Text>
      </Row>
    </>
  );
}
