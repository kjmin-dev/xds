import { space } from "@acme/tokens";
import { Dropdown, Separator } from "@heroui/react";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon.tsx";

export type MenuItem =
  | "separator"
  | {
      label: string;
      icon?: IconName;
      onSelect: () => void;
      /** An action that destroys something. Drawn in the danger color. */
      danger?: boolean;
      disabled?: boolean;
      /** The current choice among its neighbours. Marked with a check at the end of the row. */
      selected?: boolean;
    };

export type MenuProps = {
  /** The control that opens the menu: a Button or an IconButton. */
  trigger: ReactNode;
  /** Names the menu for assistive technology. */
  label: string;
  items: readonly MenuItem[];
  /** The edge of the trigger the menu lines up with. */
  align?: "start" | "end";
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
  return (
    <Dropdown>
      {trigger}
      <Dropdown.Popover placement={`bottom ${align}`} offset={space[1]}>
        <Dropdown.Menu
          aria-label={label}
          // The keys are positions, because two items may have the same label.
          disabledKeys={items.flatMap((item, index) =>
            item === "separator" || !item.disabled ? [] : [index],
          )}
          onAction={(key) => {
            const item = items[Number(key)];
            if (item && item !== "separator") item.onSelect();
          }}
        >
          {items.map((item, index) =>
            item === "separator" ? (
              // A separator has nothing but its position to tell it apart.
              <Separator key={index} />
            ) : (
              <Dropdown.Item
                key={index}
                id={index}
                textValue={item.label}
                variant={item.danger ? "danger" : "default"}
              >
                {item.icon && <Icon name={item.icon} size="sm" className="menu-item__icon" />}
                <span className="flex-1">{item.label}</span>
                {/* Named, so a screen reader hears the state that the check shows. */}
                {item.selected && <Icon name="check" size="sm" label="Selected" />}
              </Dropdown.Item>
            ),
          )}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
