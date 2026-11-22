import {
  I18nManager,
  type StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from "react-native";
import { Button } from "./Button.tsx";
import { Icon, type IconName } from "./Icon.tsx";
// The text of the component's own parts takes nothing from an app's `Defaults`.
import { PartText as Text } from "./Text.tsx";
import { themed, useColors, useControl, useTheme } from "./theme.ts";

export type SectionHeaderProps = {
  title: string;
  /** A line under the title. */
  description?: string;
  /** Before the title. */
  icon?: IconName;
  /** A way into more of the content, such as "See all": a small ghost button at the end edge. */
  action?: { label: string; onPress: () => void };
  /**
   * The heading's level in the document outline, where the platform has levels. The native
   * screen readers know headings without levels, so here this changes nothing.
   */
  level?: number;
  /** Put on the component's root view, after its own style. */
  style?: StyleProp<ViewStyle>;
};

/** The title row of a group of content. The title is a heading for a screen reader. */
export function SectionHeader({ title, description, icon, action, style }: SectionHeaderProps) {
  const styles = useStyles();
  const { typography } = useTheme();
  const control = useControl();
  const colors = useColors();
  const { fontScale } = useWindowDimensions();
  // The icon and the action are centered on the title's first line, not on the title and the
  // description together. Of the title's line and the button, the lower one moves down by half
  // the difference.
  const line = typography.heading.lineHeight * fontScale;
  const button = control.controlSm;
  const lower = action ? Math.max(0, (button - line) / 2) : 0;
  const drop = action ? Math.max(0, (line - button) / 2) : 0;

  return (
    <View style={[styles.header, style]}>
      {icon && (
        <View style={[styles.icon, { height: line, marginTop: lower }]}>
          <Icon name={icon} size="md" color={colors.textSecondary} />
        </View>
      )}
      <View style={[styles.titles, { paddingTop: lower }]}>
        <Text variant="heading" heading>
          {title}
        </Text>
        {description && (
          <Text variant="detail" tone="secondary">
            {description}
          </Text>
        )}
      </View>
      {action && (
        <View style={[styles.action, { marginTop: drop }]}>
          <Button
            variant="ghost"
            size="sm"
            label={action.label}
            // Points to the end edge, which is on the left in a right-to-left layout.
            iconEnd={I18nManager.isRTL ? "chevron-left" : "chevron-right"}
            onPress={action.onPress}
          />
        </View>
      )}
    </View>
  );
}

const useStyles = themed(({ space, size }) => {
  const control = size.touch;
  return StyleSheet.create({
    header: {
      alignSelf: "stretch",
      flexDirection: "row",
      alignItems: "flex-start",
    },
    icon: {
      width: control.iconMd,
      justifyContent: "center",
      marginEnd: space[2],
    },
    titles: {
      flex: 1,
      gap: space["0_5"],
    },
    action: {
      marginStart: space[4],
    },
  });
});
