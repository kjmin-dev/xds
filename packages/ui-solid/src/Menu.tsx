import { space } from "@acme/tokens";
import {
  layoutRect,
  leaveEscapeToFields,
  type MenuBaseProps,
  menuItemClass,
  pageTarget,
} from "@acme/ui-core";
import { Portal } from "@solidjs/web";
import * as menu from "@zag-js/menu";
import { mergeProps, normalizeProps, useMachine } from "@zag-js/solid";
import { createMemo, createUniqueId, type Element, For, Show } from "solid-js";
import { Icon } from "./Icon.tsx";
import { modalPopover } from "./modal-popover.ts";
import { createPresence } from "./presence.ts";
import { provideTrigger, TriggerContext, type TriggerProps } from "./trigger.ts";

export type { MenuItem } from "@acme/ui-core";

export type MenuProps = MenuBaseProps & {
  /** The control that opens the menu: a Button or an IconButton. */
  trigger: Element;
};

/**
 * A list of actions that opens from a control. Choosing an item calls its `onSelect` and
 * closes the menu; a press outside or Escape closes it too, and focus goes back to the
 * trigger.
 *
 * The trigger reports that it opens a menu and whether the menu is open. The arrow keys move
 * the highlight and Enter chooses.
 */
export function Menu(props: MenuProps) {
  const id = createUniqueId();
  const service = useMachine(menu.machine, () => ({
    id,
    "aria-label": props.label,
    positioning: {
      placement: `bottom-${props.align ?? "start"}` as const,
      gutter: space[1],
      getAnchorRect: (anchor) => (anchor instanceof HTMLElement ? layoutRect(anchor) : null),
    },
    onSelect: (details: menu.SelectionDetails) => {
      // The values are positions, because two items may have the same label.
      const item = props.items[Number(details.value)];
      if (item && item !== "separator") item.onSelect();
    },
    onEscapeKeyDown: leaveEscapeToFields,
    // The arrow keys go round from the last item to the first, as in the React library.
    loopFocus: true,
  }));
  const api = createMemo(() => menu.connect(service, normalizeProps));
  const trigger = provideTrigger(() => {
    const { onPointerDown, ...rest } = api().getTriggerProps() as TriggerProps & {
      onPointerDown?: (event: PointerEvent) => void;
    };
    return mergeProps(rest, {
      // Added to the control's own class; the trigger looks pressed while its menu is open.
      class: "menu__trigger",
      // A mouse opens the menu as its button goes down, as in the React library. Zag would
      // open it on the click and keep the focus off the trigger meanwhile; a pressed trigger
      // takes the focus, so the focus that comes back to it when the menu closes shows no
      // keyboard ring. Touch and pen open it on the click, as Zag does.
      onPointerDown: (event: PointerEvent & { currentTarget: HTMLElement }) => {
        if (event.pointerType !== "mouse") {
          onPointerDown?.(event);
          return;
        }
        if (event.button !== 0 || event.ctrlKey || event.currentTarget.matches(":disabled")) return;
        if (!api().open) api().setOpen(true);
      },
      onClick: (event: MouseEvent) => {
        // The press opened the menu already. This handler runs before Zag's, which skips a
        // handled click.
        if (event instanceof PointerEvent && event.pointerType === "mouse") {
          event.preventDefault();
          return;
        }
        // A click with no pointer behind it comes from a screen reader or a script. As with
        // the keyboard, the first item is highlighted, so the next key works the list at once.
        if (event.detail !== 0) return;
        // After the machine has opened the menu.
        requestAnimationFrame(() => {
          if (!api().open) return;
          const first = props.items.findIndex((item) => item !== "separator" && !item.disabled);
          if (first >= 0) api().setHighlightedValue(String(first));
        });
      },
    });
  });
  let positioner: HTMLDivElement | undefined;
  let surface: HTMLDivElement | undefined;
  modalPopover(
    () => api().open,
    () => positioner,
  );
  const present = createPresence(
    () => api().open,
    () => [surface],
  );
  const content = mergeProps(() => api().getContentProps(), {
    // This handler runs before Zag's, which skips a key that was already handled.
    onKeyDown: (event: KeyboardEvent) => {
      // The open menu keeps focus, as in the React library: Tab and Shift+Tab stay in it, and a
      // choice, Escape or a press outside closes it. Zag would close it and move focus on.
      if (event.key === "Tab") event.preventDefault();
      // Zag has no page keys; the React library moves a page, or to the end of a short menu.
      if ((event.key === "PageDown" || event.key === "PageUp") && surface) {
        event.preventDefault();
        const value = pageTarget(
          surface,
          ".menu__item:not([data-disabled])",
          event.key === "PageDown" ? 1 : -1,
        );
        if (value !== undefined) api().setHighlightedValue(value);
      }
    },
  });
  return (
    <>
      <TriggerContext value={trigger}>{props.trigger}</TriggerContext>
      <Portal>
        {/* Nothing inside opens an overlay from a control outside it. */}
        <TriggerContext value={null}>
          <Show when={api().open}>
            {/* Takes a press outside, which then only closes the menu. The focus stays in the
                menu until the menu hands it back to the trigger. */}
            {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- not a control: the handler only keeps the focus where it is */}
            <div class="menu__underlay" onMouseDown={(event) => event.preventDefault()} />
          </Show>
          <div
            ref={(element) => (positioner = element)}
            {...api().getPositionerProps()}
            class="menu__positioner"
          >
            {/* Shown until its exit animation ends; Zag would hide it as it closes. */}
            <div
              {...content}
              ref={(element) => (surface = element)}
              hidden={!present()}
              class="menu"
            >
              <For each={props.items}>
                {(item, index) =>
                  item === "separator" ? (
                    <div {...api().getSeparatorProps()} class="menu__separator" />
                  ) : (
                    <div
                      {...api().getItemProps({ value: String(index()), disabled: item.disabled })}
                      class={menuItemClass(item.danger)}
                    >
                      <Show when={item.icon}>
                        {(name) => <Icon name={name()} size="sm" class="menu__item-icon" />}
                      </Show>
                      <span class="flex-1">{item.label}</span>
                      {/* Named, so a screen reader hears the state that the check shows. */}
                      <Show when={item.selected}>
                        <Icon name="check" size="sm" label="Selected" />
                      </Show>
                    </div>
                  )
                }
              </For>
            </div>
          </div>
        </TriggerContext>
      </Portal>
    </>
  );
}
