import { radius, space, typography } from "@acme/tokens";
import type { ReactNode } from "react";
import { Text as NativeText, StyleSheet, View } from "react-native";
import { Button } from "./Button.tsx";
import { Text } from "./Text.tsx";
import { type Colors, control, useColors } from "./theme.ts";

export type BannerTone = "info" | "success" | "warning" | "danger";

/** Each tone has its own mark, so the tone does not depend on color. */
const MARK: Record<BannerTone, string> = { info: "i", success: "✓", warning: "!", danger: "×" };

function look(colors: Colors, tone: BannerTone): { background: string; accent: string } {
  switch (tone) {
    case "info":
      return { background: colors.bannerInfoBackground, accent: colors.bannerInfoAccent };
    case "success":
      return { background: colors.bannerSuccessBackground, accent: colors.bannerSuccessAccent };
    case "warning":
      return { background: colors.bannerWarningBackground, accent: colors.bannerWarningAccent };
    case "danger":
      return { background: colors.bannerDangerBackground, accent: colors.bannerDangerAccent };
  }
}

/**
 * A message about the whole screen or a section of it. Problems (`warning`, `danger`) are
 * announced by the screen reader as soon as they appear.
 */
export function Banner({
  tone = "info",
  title,
  action,
  onDismiss,
  dismissLabel = "Dismiss",
  children,
}: {
  tone?: BannerTone;
  title?: string;
  /** One thing to do about the message, as a button under it. */
  action?: { label: string; onPress: () => void };
  /**
   * Shows a close button. The banner does not hide itself: the handler decides what a
   * dismissal means.
   */
  onDismiss?: () => void;
  /** What a screen reader says for the close button. */
  dismissLabel?: string;
  children: ReactNode;
}) {
  const colors = useColors();
  const { background, accent } = look(colors, tone);
  const urgent = tone === "danger" || tone === "warning";
  return (
    <View
      {...(urgent ? { accessibilityRole: "alert" as const } : {})}
      accessibilityLiveRegion={urgent ? "assertive" : "polite"}
      style={[styles.banner, { backgroundColor: background }]}
    >
      <View style={[styles.mark, { backgroundColor: accent }]}>
        <NativeText style={[styles.markText, { color: background }]}>{MARK[tone]}</NativeText>
      </View>
      <View style={styles.content}>
        {title && (
          <Text variant="label" tone="inherit" style={{ color: colors.bannerText }}>
            {title}
          </Text>
        )}
        <Text variant="detail" tone="inherit" style={{ color: colors.bannerText }}>
          {children}
        </Text>
        {action && (
          <Button
            variant="secondary"
            size="sm"
            label={action.label}
            onPress={action.onPress}
            style={styles.action}
          />
        )}
      </View>
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          iconStart="x"
          accessibilityLabel={dismissLabel}
          onPress={onDismiss}
          style={styles.dismiss}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space[3],
    padding: space[3],
    borderRadius: radius.md,
  },
  mark: {
    width: control.iconMd,
    height: control.iconMd,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
  },
  markText: {
    fontSize: typography.footnote.fontSize,
    fontWeight: typography.footnote.fontWeight,
    lineHeight: 16,
  },
  content: {
    flex: 1,
    gap: space["0_5"],
  },
  action: {
    // As wide as its label, not as the column.
    alignSelf: "flex-start",
    // With the gap of the column, `space.2` under the message.
    marginTop: space["1_5"],
  },
  // The button is taller than a line of text. Pulled toward the corner it takes about a line's
  // room, so a banner of one line stays that tall. It stops `space.1` short of the edges, which
  // is what a small button's press area reaches past its outline.
  dismiss: {
    marginTop: -space[2],
    marginEnd: -space[2],
    marginBottom: -space[2],
  },
});
