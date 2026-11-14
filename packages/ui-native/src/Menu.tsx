import { border, radius, space } from "@acme/tokens";
import { cloneElement, type ReactElement, type ReactNode, useState } from "react";
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
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
        <MenuList role="menu" label={label}>
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
            return (
              <MenuRow
                key={index}
                role="menuitem"
                label={item.label}
                icon={item.icon}
                danger={item.danger === true}
                disabled={item.disabled === true}
                selected={item.selected === true}
                onPress={() => {
                  item.onSelect();
                  setOpen(false);
                }}
              />
            );
          })}
        </MenuList>
      </BottomSheet>
    </>
  );
}

/**
 * The rows of a sheet that holds a menu, or Select's options. A list taller than half the
 * screen scrolls inside the sheet, which then still leaves the screen behind it in sight.
 */
export function MenuList({
  role,
  label,
  children,
}: {
  /** `menu` for a Menu; `list` for Select's options, where native platforms have no listbox. */
  role: "menu" | "list";
  label: string;
  children: ReactNode;
}) {
  const { height } = useWindowDimensions();
  return (
    <ScrollView
      accessibilityRole={role}
      accessibilityLabel={label}
      // A list shorter than its room stays put rather than rubber-banding under a finger.
      alwaysBounceVertical={false}
      style={[styles.items, { maxHeight: height / 2 }]}
    >
      {children}
    </ScrollView>
  );
}

export type MenuRowProps = {
  label: string;
  /** A line under the label, for an option that needs one. */
  description?: string | undefined;
  /** An icon before the label. */
  icon?: IconName | undefined;
  danger?: boolean;
  disabled?: boolean;
  /** The current choice: a check mark is drawn at its end. */
  selected?: boolean;
  /** `menuitem` in a Menu. Select's options are buttons that say whether they are selected. */
  role: "menuitem" | "button";
  onPress: () => void;
};

/** One row of a MenuList. */
export function MenuRow({
  label,
  description,
  icon,
  danger = false,
  disabled = false,
  selected = false,
  role,
  onPress,
}: MenuRowProps) {
  const colors = useColors();
  const text = disabled
    ? colors.menuTextDisabled
    : danger
      ? colors.menuDangerText
      : colors.menuText;
  const iconColor = disabled || danger ? text : colors.menuIcon;
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        pressed && {
          backgroundColor: danger
            ? colors.menuDangerBackgroundHover
            : colors.menuItemBackgroundPressed,
        },
      ]}
    >
      {icon && <Icon name={icon} color={iconColor} />}
      <View style={styles.label}>
        <Text tone="inherit" numberOfLines={1} style={{ color: text }}>
          {label}
        </Text>
        {description && (
          <Text variant="detail" tone="secondary">
            {description}
          </Text>
        )}
      </View>
      {/* A mark, so the current choice does not depend on color. */}
      {selected && <Icon name="check" color={text} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // The rows reach past the sheet's padding by their own, so their text lines up with the
  // sheet's title and their highlight stays clear of the sheet's round corners.
  items: {
    // A scroll view grows into its parent's room by default; this one is as tall as its rows.
    flexGrow: 0,
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
    gap: space["0_5"],
  },
  separator: {
    height: border.width.thin,
    marginVertical: space[1],
    marginHorizontal: space[3],
  },
});
