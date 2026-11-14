import { space } from "@acme/tokens";
import {
  firstMenuValue,
  keepListKeys,
  layoutRect,
  leaveEscapeToFields,
  type MenuBaseProps,
  menuItemClass,
  opensOnPress,
} from "@acme/ui-core";
import * as menu from "@zag-js/menu";
import { mergeProps, normalizeProps, useMachine } from "@zag-js/react";
import { type MouseEvent, type PointerEvent, type ReactNode, useId, useRef } from "react";
import { Icon } from "./Icon.tsx";
import { useModalPopover } from "./modal-popover.ts";
import { Portal } from "./portal.tsx";
import { usePresence } from "./presence.ts";
import { TriggerContext, type TriggerProps, useProvideTrigger } from "./trigger.ts";

export type { MenuItem } from "@acme/ui-core";

export type MenuProps = MenuBaseProps & {
  /** The control that opens the menu: a Button or an IconButton. */
  trigger: ReactNode;
};

/**
 * A list of actions that opens from a control. Choosing an item calls its `onSelect` and
 * closes the menu; a press outside or Escape closes it too, and focus goes back to the
 * trigger.
 *
 * The trigger reports that it opens a menu and whether the menu is open. The arrow keys move
 * the highlight and Enter chooses.
 */
export function Menu({ trigger, label, items, align = "start" }: MenuProps) {
  const service = useMachine(menu.machine, {
    id: useId(),
    "aria-label": label,
    positioning: {
      placement: `bottom-${align}`,
      gutter: space[1],
      getAnchorRect: (anchor) => (anchor instanceof HTMLElement ? layoutRect(anchor) : null),
    },
    onSelect: (details) => {
      // The values are positions, because two items may have the same label.
      const item = items[Number(details.value)];
      if (item && item !== "separator") item.onSelect();
    },
    onEscapeKeyDown: leaveEscapeToFields,
    // The arrow keys go round from the last item to the first, as in a native menu.
    loopFocus: true,
  });
  const api = menu.connect(service, normalizeProps);
  // Zag's handler for a press is left out: it keeps the press from focusing the trigger, so
  // the focus would reach the menu, and come back to the trigger as the menu closes, only from
  // a script, which the browser marks with the keyboard ring.
  const { onPointerDown: _onPointerDown, ...triggerProps } = api.getTriggerProps();
  // Whether the last press on the trigger opened the menu, which its click must then not do.
  const pressOpened = useRef(false);
  const provided = useProvideTrigger(
    mergeProps<TriggerProps>(triggerProps, {
      // Added to the control's own class; the trigger looks pressed while its menu is open.
      className: "menu__trigger",
      // A mouse opens the menu as its button goes down; touch and pen open it on the click,
      // as Zag does.
      onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
        pressOpened.current = opensOnPress(event) && !api.open;
        if (pressOpened.current) api.setOpen(true);
      },
      onClick: (event: MouseEvent<HTMLButtonElement>) => {
        // A click with no pointer behind it comes from a screen reader or a script.
        const pointer = event.detail !== 0;
        // The press opened the menu already. This handler runs before Zag's, which skips a
        // handled click. Not told by the click's pointer type: a browser may send the click
        // as a plain mouse event.
        if (pressOpened.current && pointer) {
          pressOpened.current = false;
          event.preventDefault();
          return;
        }
        if (pointer) return;
        // After the machine has opened the menu.
        requestAnimationFrame(() => {
          const now = menu.connect(service, normalizeProps);
          if (!now.open) return;
          const first = firstMenuValue(items);
          if (first !== undefined) now.setHighlightedValue(first);
        });
      },
    }),
  );
  const positioner = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  useModalPopover(api.open, () => positioner.current);
  const present = usePresence(api.open, () => [surface.current]);
  const content = mergeProps(api.getContentProps(), {
    // This handler runs before Zag's.
    onKeyDown: (event: { key: string; preventDefault(): void }) =>
      keepListKeys(event, surface.current, ".menu__item:not([data-disabled])", (value) =>
        api.setHighlightedValue(value),
      ),
  });
  return (
    <>
      <TriggerContext value={provided}>{trigger}</TriggerContext>
      <Portal>
        {/* Nothing inside opens an overlay from a control outside it. */}
        <TriggerContext value={null}>
          {api.open && (
            // Takes a press outside, which then only closes the menu. The focus stays in the
            // menu until the menu hands it back to the trigger.
            // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- not a control: the handler only keeps the focus where it is
            <div className="menu__underlay" onMouseDown={(event) => event.preventDefault()} />
          )}
          <div {...api.getPositionerProps()} ref={positioner} className="menu__positioner">
            {/* Shown until its exit animation ends; Zag would hide it as it closes. */}
            <div {...content} ref={surface} hidden={!present} className="menu">
              {items.map((item, index) =>
                item === "separator" ? (
                  // A separator has nothing but its position to tell it apart.
                  <div key={index} {...api.getSeparatorProps()} className="menu__separator" />
                ) : (
                  <div
                    key={index}
                    {...api.getItemProps({ value: String(index), disabled: item.disabled })}
                    className={menuItemClass(item.danger)}
                  >
                    {item.icon && <Icon name={item.icon} size="sm" className="menu__item-icon" />}
                    <span className="flex-1">{item.label}</span>
                    {/* Named, so a screen reader hears the state that the check shows. */}
                    {item.selected && <Icon name="check" size="sm" label="Selected" />}
                  </div>
                ),
              )}
            </div>
          </div>
        </TriggerContext>
      </Portal>
    </>
  );
}
