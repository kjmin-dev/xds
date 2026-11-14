import { icons } from "@acme/tokens";
import { Icon, type IconName, type IconSize, Text } from "@acme/ui-solid";
import { For } from "solid-js";
import { Row } from "./shared.tsx";

const ICON_SIZES: IconSize[] = ["xs", "sm", "md", "lg", "xl"];
/** Icons made of closed shapes, which is what `filled` is for. */
const FILLABLE_ICONS: IconName[] = ["heart", "star", "bookmark", "thumbs-up", "bell"];

export function IconsSection() {
  return (
    <>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-3">
        <For each={Object.keys(icons) as IconName[]}>
          {(name) => (
            <span class="flex items-center gap-2 text-acme-text-primary">
              <Icon name={name} />
              <Text variant="detail" tone="secondary" as="span">
                {name}
              </Text>
            </span>
          )}
        </For>
      </div>
      <Row label="Sizes">
        <span class="flex items-end gap-3 text-acme-text-primary">
          <For each={ICON_SIZES}>
            {(iconSize) => <Icon name="house" size={iconSize} label={`house, ${iconSize}`} />}
          </For>
        </span>
      </Row>
      <Row label="Filled">
        <span class="flex items-center gap-3 text-acme-text-primary">
          <For each={FILLABLE_ICONS}>
            {(name) => (
              <span class="flex items-center gap-1">
                <Icon name={name} />
                <Icon name={name} filled label={`${name}, filled`} />
              </span>
            )}
          </For>
        </span>
      </Row>
    </>
  );
}
