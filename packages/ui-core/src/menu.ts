import type { IconName } from "@acme/tokens";

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

/** Menu's props in every framework, short of its trigger. */
export type MenuBaseProps = {
  /** Names the menu for assistive technology. */
  label: string;
  items: readonly MenuItem[];
  /** The edge of the trigger the menu lines up with. */
  align?: "start" | "end";
};

/** The class of a row of the menu. The highlight and the disabled look come from attributes. */
export function menuItemClass(danger = false): string {
  return danger ? "menu__item menu__item--danger" : "menu__item";
}

/**
 * The box to place a menu against: its trigger's box before the transform that scales the
 * trigger about its center while the menu is open, so the menu stays where it opened.
 */
export function layoutRect(element: HTMLElement): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const box = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  const width = Number.parseFloat(style.width);
  const height = Number.parseFloat(style.height);
  return {
    x: box.x + (box.width - width) / 2,
    y: box.y + (box.height - height) / 2,
    width,
    height,
  };
}

/**
 * Whether a press on a menu's trigger opens the menu as the button goes down rather than on
 * the click: the main button of a mouse, without Control (which asks for the context menu on a
 * Mac), on an enabled trigger. The pressed trigger then takes the focus, so the focus that
 * comes back to it when the menu closes shows no keyboard ring. Touch and pen open it on the
 * click, as Zag does.
 */
export function opensOnPress(event: {
  pointerType: string;
  button: number;
  ctrlKey: boolean;
  currentTarget: EventTarget | null;
}): boolean {
  return (
    event.pointerType === "mouse" &&
    event.button === 0 &&
    !event.ctrlKey &&
    !(event.currentTarget instanceof Element && event.currentTarget.matches(":disabled"))
  );
}

/**
 * The value of the first item that can be chosen, by position as the rows are: where the
 * highlight goes when a screen reader or a script opens the menu with a click, as the keyboard
 * puts it there, so the next key works the list at once.
 */
export function firstMenuValue(items: readonly MenuItem[]): string | undefined {
  const first = items.findIndex((item) => item !== "separator" && !item.disabled);
  return first >= 0 ? String(first) : undefined;
}
