<!--
  @component
  The top-level places of an app used with a pointer: the counterpart of TabBar on touch. Each row
  is a compact list row; the current one is selected, its title heavier and its icon filled, so
  the place does not depend on the tint alone.

  It is navigation named by `label`, and the current row says it is the current page. Collapsed,
  the rows keep their names, and show them in a Tooltip under a pointer and on keyboard focus.
-->
<script module lang="ts">
  import type { SidebarBaseProps } from "@acme/ui-core";
  import type { Snippet } from "svelte";
  import type { RootProps } from "./root.ts";

  export type { SidebarItem, SidebarSection } from "@acme/ui-core";

  export type SidebarProps<Value extends string = string> = SidebarBaseProps<Value> &
    RootProps & {
      onChange: (value: Value) => void;
      /** At the top, such as the app's name. It has to fit the rail itself while collapsed. */
      header?: Snippet;
      /** At the bottom, such as an account row. It has to fit the rail itself while collapsed. */
      footer?: Snippet;
    };
</script>

<script lang="ts" generics="Value extends string = string">
  import {
    classes,
    rootPart,
    SIDEBAR_PARTS,
    sidebarClass,
    sidebarCount,
    sidebarIconClass,
    sidebarSectionClass,
    sidebarTitleClass,
    tooltipEndSide,
  } from "@acme/ui-core";
  import Icon from "./Icon.svelte";
  import PlaceRow from "./PlaceRow.svelte";
  import SidebarRailButton from "./SidebarRailButton.svelte";
  import TooltipOverlay from "./TooltipOverlay.svelte";

  let {
    sections,
    value,
    label,
    collapsed = false,
    onChange,
    header,
    footer,
    class: className,
    style,
  }: SidebarProps<Value> = $props();

  const id = $props.id();
</script>

<nav
  aria-label={label}
  class={classes(rootPart("Sidebar"), sidebarClass(collapsed), className)}
  {style}
>
  {#if header}
    <div class={SIDEBAR_PARTS.edge}>{@render header()}</div>
  {/if}
  <!-- The places scroll when there are more than fit; the header and footer stay. -->
  <div class={SIDEBAR_PARTS.places}>
    {#each sections as section, index (index)}
      <!-- A section has nothing but its position to tell it apart: titles are optional. -->
      {@const title = `${id}-${index}`}
      <div class={sidebarSectionClass(index, collapsed)}>
        {#if section.title}
          <p id={title} class={sidebarTitleClass(collapsed)}>{section.title}</p>
        {/if}
        {#if collapsed && index > 0}
          <div aria-hidden="true" class={SIDEBAR_PARTS.rule}></div>
        {/if}
        <ul aria-labelledby={section.title ? title : undefined} class={SIDEBAR_PARTS.list}>
          {#each section.items as item (item.value)}
            {@const selected = item.value === value}
            <li class={SIDEBAR_PARTS.item}>
              {#if collapsed}
                <TooltipOverlay label={item.label} placement={tooltipEndSide}>
                  <SidebarRailButton
                    label={item.label}
                    icon={item.icon}
                    {selected}
                    onPress={() => onChange(item.value)}
                  />
                </TooltipOverlay>
              {:else}
                {@const count = sidebarCount(item.count)}
                <PlaceRow
                  compact
                  current="page"
                  {selected}
                  onPress={() => onChange(item.value)}
                  title={item.label}
                >
                  {#snippet leading()}
                    <Icon
                      name={item.icon}
                      size="md"
                      filled={selected}
                      class={sidebarIconClass(selected)}
                    />
                  {/snippet}
                  {#snippet trailing()}
                    {#if count}
                      <span class={SIDEBAR_PARTS.count}>{count}</span>
                    {/if}
                  {/snippet}
                </PlaceRow>
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </div>
  {#if footer}
    <div class={SIDEBAR_PARTS.edge}>{@render footer()}</div>
  {/if}
</nav>
