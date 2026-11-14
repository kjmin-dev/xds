import { space } from "@acme/tokens";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Icon, type IconName } from "./Icon.tsx";
import { Text } from "./Text.tsx";
import { control, useColors } from "./theme.ts";

export type EmptyStateProps = {
  /** Illustrates what is missing. It is decoration: the title says it. */
  icon: IconName;
  title: string;
  description?: string;
  /** The one thing to do about it, usually a Button. */
  action?: ReactNode;
};

/**
 * What a screen says when it has nothing to show. It is centered in its container, and in a
 * container taller than itself, centered in the height too.
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const colors = useColors();
  return (
    <View style={styles.empty}>
      <View style={styles.icon}>
        <Icon name={icon} size="xl" color={colors.emptyStateIcon} />
      </View>
      <Text variant="heading" style={styles.center}>
        {title}
      </Text>
      {description && (
        <Text tone="secondary" style={[styles.center, styles.description]}>
          {description}
        </Text>
      )}
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    flexGrow: 1,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: control.dialog,
    paddingVertical: space[8],
  },
  icon: {
    marginBottom: space[4],
  },
  center: {
    textAlign: "center",
  },
  description: {
    marginTop: space[2],
  },
  action: {
    marginTop: space[6],
  },
});
