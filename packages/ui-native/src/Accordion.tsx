import { border, motion, space } from "@acme/tokens";
import { Fragment, type ReactNode, useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";
import { Icon } from "./Icon.tsx";
import { useReducedMotion } from "./motion.ts";
import { Text } from "./Text.tsx";
import { ContentColor, control, useColors } from "./theme.ts";

export type AccordionItem<Value extends string> = {
  value: Value;
  title: string;
  /** A line under the title. */
  description?: string;
  /** The body: text, or anything else. Text in it is secondary unless told otherwise. */
  content: ReactNode;
};

export type AccordionProps<Value extends string> = {
  items: readonly AccordionItem<Value>[];
  /** The values of the items that are open. The accordion holds no state: the app decides. */
  expanded: readonly Value[];
  onChange: (expanded: Value[]) => void;
  /** Lets several items be open at once. Without it, opening one closes the others. */
  multiple?: boolean;
};

/**
 * Items whose bodies open and close under their titles, separated by hairlines. Pressing a
 * title row opens or closes its body, and the chevron at its end turns to say which.
 */
export function Accordion<Value extends string>({
  items,
  expanded,
  onChange,
  multiple = false,
}: AccordionProps<Value>) {
  const colors = useColors();
  const hairline = [styles.hairline, { backgroundColor: colors.accordionBorder }];
  return (
    <View style={styles.accordion}>
      <View style={hairline} />
      {items.map((item) => {
        const open = expanded.includes(item.value);
        return (
          <Fragment key={item.value}>
            <Entry
              item={item}
              open={open}
              onToggle={() =>
                onChange(
                  open
                    ? expanded.filter((value) => value !== item.value)
                    : multiple
                      ? [...expanded, item.value]
                      : [item.value],
                )
              }
            />
            <View style={hairline} />
          </Fragment>
        );
      })}
    </View>
  );
}

// A component of its own, so that every item keeps its own animated value and measured height.
function Entry<Value extends string>({
  item,
  open,
  onToggle,
}: {
  item: AccordionItem<Value>;
  open: boolean;
  onToggle: () => void;
}) {
  const colors = useColors();
  const reduced = useReducedMotion();
  // 0 is closed, 1 open. Height cannot be animated on the native thread, so neither is the
  // chevron that turns with it: one value cannot be driven from both.
  const progress = useRef(new Animated.Value(open ? 1 : 0)).current;
  // The body's own height, measured where nothing constrains it.
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const [x1, y1, x2, y2] = motion.easing.standard;
    const animation = Animated.timing(progress, {
      toValue: open ? 1 : 0,
      // With less motion asked for, the body opens and closes at once.
      duration: reduced ? 0 : motion.duration.normal,
      easing: Easing.bezier(x1, y1, x2, y2),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [open, progress, reduced]);

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={onToggle}
        style={({ pressed }) => [
          styles.header,
          pressed && { backgroundColor: colors.accordionHeaderBackgroundPressed },
        ]}
      >
        <View style={styles.titles}>
          <Text variant="body-strong">{item.title}</Text>
          {item.description && (
            <Text variant="detail" tone="secondary">
              {item.description}
            </Text>
          )}
        </View>
        <Animated.View
          style={{
            transform: [
              {
                rotate: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", "180deg"],
                }),
              },
            ],
          }}
        >
          <Icon name="chevron-down" size="sm" color={colors.accordionIcon} />
        </Animated.View>
      </Pressable>
      <Animated.View
        // A closed body is still laid out, to be measured; it is hidden from touch and from
        // screen readers.
        accessibilityElementsHidden={!open}
        importantForAccessibility={open ? "auto" : "no-hide-descendants"}
        style={[
          styles.clip,
          {
            height: progress.interpolate({ inputRange: [0, 1], outputRange: [0, height] }),
            pointerEvents: open ? "auto" : "none",
          },
        ]}
      >
        <View onLayout={(event) => setHeight(event.nativeEvent.layout.height)} style={styles.body}>
          <ContentColor value={colors.textSecondary}>
            {typeof item.content === "string" ? <Text>{item.content}</Text> : item.content}
          </ContentColor>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  accordion: {
    alignSelf: "stretch",
  },
  hairline: {
    height: border.width.thin,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    minHeight: control.listRow,
    paddingHorizontal: space[4],
    paddingVertical: space[2],
  },
  titles: {
    flex: 1,
    gap: space["0_5"],
  },
  clip: {
    overflow: "hidden",
  },
  // Out of the flow, so it keeps its own height while the box around it is shorter.
  body: {
    position: "absolute",
    top: 0,
    start: 0,
    end: 0,
    paddingHorizontal: space[4],
    paddingBottom: space[4],
  },
});
