import type { ReactNode } from "react";
import { Pressable, type StyleProp, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { GlassMaterial, type Surface } from "./Glass";
import { themed, useColors, useTheme } from "./theme.ts";

export type TabBarItem<Key extends string> = {
  key: Key;
  label: string;
  /** Drawn above the label, 24 points square, in the color it is given. */
  icon: (color: string) => ReactNode;
};

export type TabBarProps<Key extends string> = {
  surface?: Surface;
  items: readonly TabBarItem<Key>[];
  value: Key;
  onChange: (key: Key) => void;
  /** Put on the component's root view, after its own style. */
  style?: StyleProp<ViewStyle>;
};

/**
 * The bar that switches between the top-level places of an app: three to five of them. It is
 * a capsule that floats over the bottom of the screen, so give it a margin at the sides and
 * below, inside the safe area. The selected tab sits in a pill of its own: a shape, so the
 * selection does not depend on color.
 */
export function TabBar<Key extends string>({
  items,
  value,
  onChange,
  surface = "solid",
  style,
}: TabBarProps<Key>) {
  const styles = useStyles();
  const { radius, typography } = useTheme();
  const colors = useColors();
  const content = items.map((item) => {
    const selected = item.key === value;
    const color = selected
      ? colors.tabBarTextSelected
      : surface === "glass"
        ? colors.glassForeground
        : colors.tabBarText;
    return (
      <Pressable
        key={item.key}
        role="tab"
        aria-label={item.label}
        aria-selected={selected}
        onPress={() => onChange(item.key)}
        style={[styles.item, selected && { backgroundColor: colors.tabBarSelectedBackground }]}
      >
        <View style={styles.icon}>{item.icon(color)}</View>
        <Text numberOfLines={1} style={[typography.footnote, { color }]}>
          {item.label}
        </Text>
      </Pressable>
    );
  });
  return surface === "glass" ? (
    <GlassMaterial role="tablist" corners={radius.full} style={[styles.bar, style]}>
      {content}
    </GlassMaterial>
  ) : (
    <View
      role="tablist"
      style={[
        styles.bar,
        styles.solid,
        { backgroundColor: colors.tabBarBackground, borderColor: colors.tabBarBorder },
        style,
      ]}
    >
      {content}
    </View>
  );
}

const useStyles = themed(({ border, radius, shadow, space, size }) => {
  const control = size.touch;
  // The gap between the capsule's edge and the selected tab's pill.
  const INSET = space[1];
  return StyleSheet.create({
    bar: {
      alignSelf: "stretch",
      flexDirection: "row",
      height: control.bar + INSET * 2,
      padding: INSET,
      borderRadius: radius.full,
    },
    solid: {
      borderWidth: border.width.thin,

      // The whole shadow in one object: react-native-web builds a box-shadow from each on its own.
      shadowColor: shadow.raised.color,
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
});
