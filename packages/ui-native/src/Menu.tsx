import { border, radius, space } from "@acme/tokens";
import { cloneElement, type ReactElement, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { BottomSheet } from "./BottomSheet.tsx";
import { Icon, type IconName } from "./Icon.tsx";
import { Text } from "./Text.tsx";
import { control, MenuOpen, useColors } from "./theme.ts";

export type MenuItem =
  | {
      /** A line between two groups of items. */
      type: "separator";
    }
  | {
      type?: never;
      label: string;
      /** An icon before the label. */
      icon?: IconName;
      /** Called when the person chooses the item. The menu closes itself. */
      onSelect: () => void;
      /** An item that destroys something. */
      danger?: boolean;
      /** Shown, and does nothing. */
      disabled?: boolean;
      /** The current choice among the items: a check mark is drawn at its end. */
      selected?: boolean;
    };

export type MenuProps = {
  /**
   * The control that opens the menu, usually a Button or an IconButton. The menu takes over its
   * `onPress`; a Button or an IconButton also tells a screen reader whether the menu is open.
   */
  trigger: ReactElement<{ onPress?: (() => void) | undefined }>;
  /** Names the menu. It is the title of the sheet the items are in. */
  label: string;
  items: readonly MenuItem[];
  /**
   * The edge of the trigger a popup lines up with, where the menu is a popup. Here the menu is
   * a sheet across the bottom of the screen, so this changes nothing.
   */
  align?: "start" | "end";
  /** Starts open, for a preview or a screenshot. */
  defaultOpen?: boolean;
};

/**
 * A list of actions that opens from a control. On a touch screen the items are rows of a
 * bottom sheet: choosing one calls its `onSelect` and closes the sheet; a tap outside, a drag
 * down or the back button closes it without choosing.
 */
export function Menu({ trigger, label, items, defaultOpen = false }: MenuProps) {
  const colors = useColors();
  const [open, setOpen] = useState(defaultOpen);
  const pressTrigger = trigger.props.onPress;
  return (
    <>
      <MenuOpen value={open}>
        {cloneElement(trigger, {
          onPress: () => {
            pressTrigger?.();
            setOpen(true);
          },
        })}
      </MenuOpen>
      <BottomSheet open={open} onClose={() => setOpen(false)} title={label}>
        <View accessibilityRole="menu" accessibilityLabel={label} style={styles.items}>
          {items.map((item, index) => {
            if (item.type === "separator") {
              return (
                <View
                  // Items have no identity of their own, and a menu does not reorder while open.
                  key={index}
                  style={[styles.separator, { backgroundColor: colors.menuBorder }]}
                />
              );
            }
            const disabled = item.disabled === true;
            const danger = item.danger === true;
            const text = disabled
              ? colors.menuTextDisabled
              : danger
                ? colors.menuDangerText
                : colors.menuText;
            const iconColor = disabled || danger ? text : colors.menuIcon;
            return (
              <Pressable
                key={index}
                accessibilityRole="menuitem"
                accessibilityState={{ disabled, selected: item.selected === true }}
                disabled={disabled}
                onPress={() => {
                  item.onSelect();
                  setOpen(false);
                }}
                style={({ pressed }) => [
                  styles.item,
                  pressed && {
                    backgroundColor: danger
                      ? colors.menuDangerBackgroundHover
                      : colors.menuItemBackgroundPressed,
                  },
                ]}
              >
                {item.icon && <Icon name={item.icon} color={iconColor} />}
                <Text tone="inherit" numberOfLines={1} style={[styles.label, { color: text }]}>
                  {item.label}
                </Text>
                {/* A mark, so the current choice does not depend on color. */}
                {item.selected && <Icon name="check" color={text} />}
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  // The rows reach past the sheet's padding by their own, so their text lines up with the
  // sheet's title and their highlight stays clear of the sheet's round corners.
  items: {
    marginHorizontal: -space[3],
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    minHeight: control.listRow,
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderRadius: radius.md,
  },
  label: {
    flex: 1,
  },
  separator: {
    height: border.width.thin,
    marginVertical: space[1],
    marginHorizontal: space[3],
  },
});
