import { border, space, typography } from "@acme/tokens";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Icon, type IconName } from "./Icon.tsx";
import { control, useColors } from "./theme.ts";

export type TabsItem<Value extends string> = {
  value: Value;
  label: string;
  /** An icon before the label. */
  icon?: IconName;
};

export type TabsProps<Value extends string> = {
  items: readonly TabsItem<Value>[];
  /** The selected tab. */
  value: Value;
  onChange: (value: Value) => void;
  /** Says what the tabs switch between, for a screen reader. */
  label: string;
  /** The tabs share the width of the row equally. */
  fullWidth?: boolean;
};

/**
 * Switches between views inside one screen. It is only the row: the app shows the view that
 * matches `value`. The selected tab is underlined, so the choice does not depend on color. For
 * two to four short modes a SegmentedControl is lighter; the row of tabs scrolls sideways when
 * it does not fit.
 */
export function Tabs<Value extends string>({
  items,
  value,
  onChange,
  label,
  fullWidth = false,
}: TabsProps<Value>) {
  const colors = useColors();
  return (
    <View style={styles.tabs}>
      {/* Under the row, so that the bar of the selected tab is drawn over it. */}
      <View style={[styles.hairline, { backgroundColor: colors.tabsBorder }]} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="tablist"
        accessibilityLabel={label}
        contentContainerStyle={fullWidth && styles.fill}
      >
        {items.map((item) => {
          const selected = item.value === value;
          return (
            <Pressable
              key={item.value}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => onChange(item.value)}
              style={[styles.tab, fullWidth && styles.share]}
            >
              {({ pressed }) => {
                // There is no pointer to rest on a tab here: a press gets the hover color.
                const color = selected
                  ? colors.tabsTextSelected
                  : pressed
                    ? colors.tabsTextHover
                    : colors.tabsText;
                return (
                  <>
                    {item.icon && <Icon name={item.icon} size="sm" color={color} />}
                    <Text numberOfLines={1} style={[typography.label, { color }]}>
                      {item.label}
                    </Text>
                    {selected && (
                      <View style={[styles.indicator, { backgroundColor: colors.tabsIndicator }]} />
                    )}
                  </>
                );
              }}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    alignSelf: "stretch",
  },
  hairline: {
    position: "absolute",
    start: 0,
    end: 0,
    bottom: 0,
    height: border.width.thin,
  },
  // At least as wide as the row, so that tabs told to share the width have it all to share.
  fill: {
    flexGrow: 1,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space[2],
    height: control.tab,
    minWidth: control.targetMin,
    paddingHorizontal: space[4],
  },
  share: {
    flexGrow: 1,
    flexBasis: 0,
  },
  indicator: {
    position: "absolute",
    start: 0,
    end: 0,
    bottom: 0,
    height: border.width.thick,
  },
});
