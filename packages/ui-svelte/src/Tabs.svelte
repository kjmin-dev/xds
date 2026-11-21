<!--
  @component
  Switches between views inside one screen. For two to four short modes a SegmentedControl is
  lighter; tabs are for more items, longer labels, or a row that may have to scroll.

  The selected tab is underlined as well as darker, so the choice does not depend on color. This
  is only the row: the app shows the view that matches `value`. The arrow keys move between tabs.
-->
<script module lang="ts">
  import type { TabsBaseProps } from "@acme/ui-core";
  import type { RootProps } from "./root.ts";

  export type TabsProps<Value extends string> = TabsBaseProps<Value> &
    RootProps & {
      onChange: (value: Value) => void;
    };
</script>

<script lang="ts" generics="Value extends string">
  import { classes, tabStopIndex, tabsClass } from "@acme/ui-core";
  import { mergeProps, normalizeProps, useMachine } from "@zag-js/svelte";
  import * as tabs from "@zag-js/tabs";
  import Icon from "./Icon.svelte";

  let {
    items,
    value,
    label,
    fullWidth,
    onChange,
    class: className,
    style,
  }: TabsProps<Value> = $props();

  const id = $props.id();
  const service = useMachine(tabs.machine, () => ({
    id,
    value,
    onValueChange: (details: tabs.ValueChangeDetails) => onChange(details.value as Value),
  }));
  const api = $derived(tabs.connect(service, normalizeProps));
  // Merged, so that the app's style joins any the machine writes on the root. The recipe gives
  // the root part, `acme-tabs`.
  const root = $derived(
    mergeProps(api.getRootProps(), { class: classes(tabsClass(fullWidth), className), style }),
  );
</script>

<div {...root}>
  <div {...api.getListProps()} aria-label={label} class="acme-tabs__list">
    {#each items as item (item.value)}
      {@const trigger = api.getTriggerProps({ value: item.value })}
      <!-- Zag points the selected tab at its panel, which this row never renders: the app shows
           the view. A reference to an element that does not exist is invalid. -->
      <button
        {...trigger}
        tabindex={tabStopIndex(api.focusedValue, item.value, trigger.tabindex)}
        aria-controls={undefined}
        class="acme-tabs__tab"
        >{#if item.icon}<Icon name={item.icon} size="sm" />{/if}{item.label}</button
      >
    {/each}
    <div {...api.getIndicatorProps()} class="acme-tabs__indicator"></div>
  </div>
</div>
