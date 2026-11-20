<!--
  @component
  A list of actions that opens from a control. Choosing an item calls its `onSelect` and closes
  the menu; a press outside or Escape closes it too, and focus goes back to the trigger.

  The trigger reports that it opens a menu and whether the menu is open. The arrow keys move the
  highlight and Enter chooses.
-->
<script module lang="ts">
  import type { MenuBaseProps } from "@acme/ui-core";
  import type { Snippet } from "svelte";
  import type { RootProps } from "./root.ts";

  export type { MenuItem } from "@acme/ui-core";

  /** Its root is the menu, while it is open, not its trigger. */
  export type MenuProps = MenuBaseProps &
    RootProps & {
      /** The control that opens the menu: a Button or an IconButton. */
      trigger: Snippet;
    };
</script>

<script lang="ts">
  import { space } from "@acme/tokens";
  import {
    classes,
    firstMenuValue,
    keepListKeys,
    layoutRect,
    leaveEscapeToFields,
    menuItemClass,
    opensOnPress,
  } from "@acme/ui-core";
  import * as menu from "@zag-js/menu";
  import { mergeProps, normalizeProps, useMachine } from "@zag-js/svelte";
  import Icon from "./Icon.svelte";
  import { modalPopover } from "./modal-popover.svelte.ts";
  import Portal from "./Portal.svelte";
  import { createPresence } from "./presence.svelte.ts";
  import { provideTrigger, type TriggerProps } from "./trigger.svelte.ts";

  let { label, items, align = "start", trigger, class: className, style }: MenuProps = $props();

  const id = $props.id();
  const service = useMachine(menu.machine, () => ({
    id,
    "aria-label": label,
    positioning: {
      placement: `bottom-${align}` as const,
      gutter: space[1],
      getAnchorRect: (anchor) => (anchor instanceof HTMLElement ? layoutRect(anchor) : null),
    },
    onSelect: (details: menu.SelectionDetails) => {
      // The values are positions, because two items may have the same label.
      const item = items[Number(details.value)];
      if (item && item !== "separator") item.onSelect();
    },
    onEscapeKeyDown: leaveEscapeToFields,
    // The arrow keys go round from the last item to the first, as in a native menu.
    loopFocus: true,
  }));
  const api = $derived(menu.connect(service, normalizeProps));
  // Whether the last press on the trigger opened the menu, which its click must then not do.
  let pressOpened = false;
  provideTrigger(() => {
    // Zag's handler for a press is left out: it keeps the press from focusing the trigger, so
    // the focus would reach the menu, and come back to the trigger as the menu closes, only
    // from a script, which the browser marks with the keyboard ring.
    const { onpointerdown: _onPointerDown, ...rest } = api.getTriggerProps() as TriggerProps;
    return mergeProps(rest, {
      // Added to the control's own class; the trigger looks pressed while its menu is open.
      class: "acme-menu__trigger",
      // A mouse opens the menu as its button goes down; touch and pen open it on the click, as
      // Zag does.
      onpointerdown: (event: PointerEvent & { currentTarget: HTMLElement }) => {
        pressOpened = opensOnPress(event) && !api.open;
        if (pressOpened) api.setOpen(true);
      },
      onclick: (event: MouseEvent) => {
        // A click with no pointer behind it comes from a screen reader or a script.
        const pointer = event.detail !== 0;
        // The press opened the menu already. This handler runs before Zag's, which skips a
        // handled click. Not told by the click's pointer type: a browser may send the click as
        // a plain mouse event.
        if (pressOpened && pointer) {
          pressOpened = false;
          event.preventDefault();
          return;
        }
        if (pointer) return;
        // After the machine has opened the menu.
        requestAnimationFrame(() => {
          if (!api.open) return;
          const first = firstMenuValue(items);
          if (first !== undefined) api.setHighlightedValue(first);
        });
      },
    });
  });
  let positioner = $state<HTMLDivElement>();
  let surface = $state<HTMLDivElement>();
  modalPopover(
    () => api.open,
    () => positioner,
  );
  const present = createPresence(
    () => api.open,
    () => [surface],
  );
  const content = $derived(
    mergeProps(api.getContentProps(), {
      class: classes("acme-menu", className),
      style,
      // This handler runs before Zag's.
      onkeydown: (event: KeyboardEvent) =>
        keepListKeys(event, surface, ".acme-menu__item:not([data-disabled])", (value) =>
          api.setHighlightedValue(value),
        ),
    }),
  );
</script>

{@render trigger()}
<Portal>
  {#if api.open}
    <!-- Takes a press outside, which then only closes the menu. The focus stays in the menu until
       the menu hands it back to the trigger. -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="acme-menu__underlay" onmousedown={(event) => event.preventDefault()}></div>
  {/if}
  <div {...api.getPositionerProps()} bind:this={positioner} class="acme-menu__positioner">
    <!-- Shown until its exit animation ends; Zag would hide it as it closes. -->
    <div {...content} bind:this={surface} hidden={!present()}>
      {#each items as item, index (index)}
        {#if item === "separator"}
          <div {...api.getSeparatorProps()} class="acme-menu__separator"></div>
        {:else}
          <div
            {...api.getItemProps({ value: String(index), disabled: item.disabled })}
            class={menuItemClass(item.danger)}
          >
            {#if item.icon}
              <Icon name={item.icon} size="sm" class="acme-menu__item-icon" />
            {/if}
            <span class="flex-1">{item.label}</span>
            <!-- Named, so a screen reader hears the state that the check shows. -->
            {#if item.selected}
              <Icon name="check" size="sm" label="Selected" />
            {/if}
          </div>
        {/if}
      {/each}
    </div>
  </div>
</Portal>
