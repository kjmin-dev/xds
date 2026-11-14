import { type TabsBaseProps, tabsClass } from "@acme/ui-core";
import { normalizeProps, useMachine } from "@zag-js/solid";
import * as tabs from "@zag-js/tabs";
import { createMemo, createUniqueId, For, Show } from "solid-js";
import { Icon } from "./Icon.tsx";

export type TabsProps<Value extends string> = TabsBaseProps<Value> & {
  onChange: (value: Value) => void;
};

/**
 * Switches between views inside one screen. For two to four short modes a SegmentedControl is
 * lighter; tabs are for more items, longer labels, or a row that may have to scroll.
 *
 * The selected tab is underlined as well as darker, so the choice does not depend on color.
 * This is only the row: the app shows the view that matches `value`. The arrow keys move
 * between tabs.
 */
export function Tabs<Value extends string>(props: TabsProps<Value>) {
  const id = createUniqueId();
  const service = useMachine(tabs.machine, () => ({
    id,
    value: props.value,
    onValueChange: (details: tabs.ValueChangeDetails) => props.onChange(details.value as Value),
  }));
  const api = createMemo(() => tabs.connect(service, normalizeProps));
  return (
    <div {...api().getRootProps()} class={tabsClass(props.fullWidth)}>
      <div {...api().getListProps()} aria-label={props.label} class="tabs__list">
        <For each={props.items}>
          {(item) => (
            <button
              {...api().getTriggerProps({ value: item.value })}
              // Zag points the selected tab at its panel, which this row never renders: the app
              // shows the view. A reference to an element that does not exist is invalid.
              aria-controls={undefined}
              class="tabs__tab"
            >
              <Show when={item.icon}>{(name) => <Icon name={name()} size="sm" />}</Show>
              {item.label}
            </button>
          )}
        </For>
        <div {...api().getIndicatorProps()} class="tabs__indicator" />
      </div>
    </div>
  );
}
