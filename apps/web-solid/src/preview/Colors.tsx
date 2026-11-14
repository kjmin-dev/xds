import { colors } from "@acme/tokens";
import { Text } from "@acme/ui-solid";
import { For } from "solid-js";
import { kebab } from "./shared.tsx";

/** Semantic colors by group. Component colors are shown by the components that use them. */
const COMPONENT_COLORS =
  /^(button|field|badge|banner|card|switch|checkbox|radio|segmented|avatar|progress|slider|listRow|topBar|tabBar|sheet|chip|tabs|menu|dialog|toast|tooltip|skeleton|thumbnail|sidebar|emptyState|accordion)/;

const COLOR_GROUPS = Object.entries(
  Object.groupBy(
    Object.keys(colors.light).filter((name) => !COMPONENT_COLORS.test(name)),
    (name) => kebab(name).split("-")[0] ?? name,
  ),
);

export function ColorsSection() {
  return (
    <For each={COLOR_GROUPS}>
      {([group, names]) => (
        <div class="flex flex-col gap-2">
          <Text variant="label" tone="secondary">
            {group}
          </Text>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <For each={names ?? []}>
              {(name) => (
                <div class="flex items-center gap-2">
                  <span
                    class="size-8 shrink-0 rounded-acme-sm border border-acme-border-default"
                    style={{ background: `var(--acme-color-${kebab(name)})` }}
                  />
                  <Text variant="footnote" tone="secondary" as="span" class="break-all">
                    {kebab(name)}
                  </Text>
                </div>
              )}
            </For>
          </div>
        </div>
      )}
    </For>
  );
}
