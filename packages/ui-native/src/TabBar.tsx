import { border, radius, shadow, space, typography } from "@acme/tokens";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { control, useColors } from "./theme.ts";

export type TabBarItem<Key extends string> = {
  key: Key;
  label: string;
  /** Drawn above the label, 24 points square, in the color it is given. */
  icon: (color: string) => ReactNode;
};

export type TabBarProps<Key extends string> = {
  items: readonly TabBarItem<Key>[];
  value: Key;
  onChange: (key: Key) => void;
};

const INSET = space[1];

/**
 * The bar that switches between the top-level places of an app: three to five of them. It is
 * a capsule that floats over the bottom of the screen, so give it a margin at the sides and
 * below, inside the safe area. The selected tab sits in a pill of its own: a shape, so the
 * selection does not depend on color.
 */
export function TabBar<Key extends string>({ items, value, onChange }: TabBarProps<Key>) {
  const colors = useColors();
  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          backgroundColor: colors.tabBarBackground,
          borderColor: colors.tabBarBorder,
          shadowColor: shadow.raised.color,
        },
      ]}
    >
      {items.map((item) => {
        const selected = item.key === value;
        const color = selected ? colors.tabBarTextSelected : colors.tabBarText;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(item.key)}
            style={[styles.item, selected && { backgroundColor: colors.tabBarSelectedBackground }]}
          >
            <View style={styles.icon}>{item.icon(color)}</View>
            <Text numberOfLines={1} style={[typography.footnote, { color }]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignSelf: "stretch",
    flexDirection: "row",
    height: control.bar + INSET * 2,
    padding: INSET,
    borderWidth: border.width.thin,
    borderRadius: radius.full,
    shadowOffset: { width: shadow.raised.offsetX, height: shadow.raised.offsetY },
    shadowRadius: shadow.raised.blur,
    shadowOpacity: 1,
    elevation: 6,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: space["0_5"],
    borderRadius: radius.full,
  },
  icon: {
    width: control.iconLg,
    height: control.iconLg,
    alignItems: "center",
    justifyContent: "center",
  },
});
