import { border, radius, shadow, space } from "@acme/tokens";
import type { ReactNode } from "react";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { Text } from "./Text.tsx";
import { useColors } from "./theme.ts";

/**
 * A surface that groups related content. A hairline outline and a trace of shadow lift it off
 * the page; in dark mode, where shadows barely show, the lighter fill does that. `title` is a
 * heading; `actions` sit across from it.
 */
export function Card({
  title,
  description,
  actions,
  flush = false,
  style,
  children,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  /** No padding and no gaps: for a card that holds a list, whose rows run edge to edge. */
  flush?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.card,
        !flush && styles.padded,
        { backgroundColor: colors.backgroundSurface, borderColor: colors.borderDefault },
        style,
      ]}
    >
      <CardBody flush={flush}>
        {(title || actions) && (
          <View style={styles.header}>
            <View style={styles.titles}>
              {title && (
                <Text variant="heading" heading>
                  {title}
                </Text>
              )}
              {description && (
                <Text variant="detail" tone="secondary">
                  {description}
                </Text>
              )}
            </View>
            {actions}
          </View>
        )}
        {children}
      </CardBody>
    </View>
  );
}

/**
 * A flush card clips its rows to the rounded corners. The clip is on an inner view: on iOS a
 * view that clips its content cannot also cast a shadow.
 */
function CardBody({ flush, children }: { flush: boolean; children: ReactNode }) {
  return flush ? <View style={styles.clip}>{children}</View> : children;
}

/** A line between groups of content. */
export function Divider() {
  const colors = useColors();
  return <View style={[styles.divider, { backgroundColor: colors.borderDefault }]} />;
}

const styles = StyleSheet.create({
  card: {
    alignSelf: "stretch",
    borderWidth: border.width.thin,
    borderRadius: radius.lg,
    // The token color carries the alpha.
    shadowColor: shadow.subtle.color,
    shadowOffset: { width: shadow.subtle.offsetX, height: shadow.subtle.offsetY },
    shadowRadius: shadow.subtle.blur,
    shadowOpacity: 1,
  },
  padded: {
    gap: space[4],
    padding: space[4],
  },
  clip: {
    overflow: "hidden",
    borderRadius: radius.lg - border.width.thin,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: space[3],
  },
  titles: {
    flex: 1,
    gap: 2,
  },
  divider: {
    alignSelf: "stretch",
    height: border.width.thin,
  },
});
