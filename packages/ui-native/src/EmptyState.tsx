import type { ReactNode } from "react";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { Icon, type IconName } from "./Icon.tsx";
// The text of the component's own parts takes nothing from an app's `Defaults`.
import { PartText as Text } from "./Text.tsx";
import { themed, useColors } from "./theme.ts";

export type EmptyStateProps = {
  /** Illustrates what is missing. It is decoration: the title says it. */
  icon: IconName;
  title: string;
  description?: string;
  /** The one thing to do about it, usually a Button. */
  action?: ReactNode;
  /** Put on the component's root view, after its own style. */
  style?: StyleProp<ViewStyle>;
};

/**
 * What a screen says when it has nothing to show. It is centered in its container, and in a
 * container taller than itself, centered in the height too.
 */
export function EmptyState({ icon, title, description, action, style }: EmptyStateProps) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={[styles.empty, style]}>
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

const useStyles = themed(({ space, size }) => {
  const control = size.touch;
  return StyleSheet.create({
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
});
