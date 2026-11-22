import { type ReactNode, useContext } from "react";
import { Text as NativeText, type StyleProp, type TextStyle } from "react-native";
import { useDefaults } from "./defaults.ts";
import { type Colors, ContentColor, type Theme, useColors, useTheme } from "./theme.ts";

export type TextVariant =
  | "display"
  | "title"
  | "heading"
  | "body"
  | "body-strong"
  | "label"
  | "detail"
  | "footnote";

export type TextTone =
  | "primary"
  | "secondary"
  | "accent"
  | "danger"
  | "success"
  | "warning"
  | "inherit";

/** The type role of a variant. */
export function variantStyle(typography: Theme["typography"], variant: TextVariant): TextStyle {
  switch (variant) {
    case "display":
      return typography.display;
    case "title":
      return typography.title;
    case "heading":
      return typography.heading;
    case "body":
      return typography.body;
    case "body-strong":
      return typography.bodyStrong;
    case "label":
      return typography.label;
    case "detail":
      return typography.detail;
    case "footnote":
      return typography.footnote;
  }
}

function toneColor(colors: Colors, tone: TextTone): string | undefined {
  switch (tone) {
    case "primary":
      return colors.textPrimary;
    case "secondary":
      return colors.textSecondary;
    case "accent":
      return colors.textAccent;
    case "danger":
      return colors.statusDanger;
    case "success":
      return colors.statusSuccess;
    case "warning":
      return colors.statusWarning;
    case "inherit":
      return undefined;
  }
}

export type TextProps = {
  /** What the text is for. Sets size, weight, line height and tracking together. */
  variant?: TextVariant;
  /** Defaults to `primary`, or to the color of the slot the text is in. */
  tone?: TextTone;
  /** Marks the text as a heading for screen readers. */
  heading?: boolean;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
};

/**
 * Text in one of the design system's roles. It grows with the system's text size setting, and
 * Korean breaks between words rather than between syllables. A variant or a tone it is not given
 * comes from the closest `Defaults`.
 */
export function Text(props: TextProps) {
  const defaults = useDefaults("Text");
  return (
    <PartText
      {...props}
      variant={props.variant ?? defaults.variant}
      tone={props.tone ?? defaults.tone}
    />
  );
}

/**
 * Text as the library's components draw their own parts: with what they pass and nothing from a
 * `Defaults`, so an app's defaults for its text never restyle a card's title or a menu's rows.
 * Without a tone it takes the color of the slot it is in, or the primary text color.
 */
export function PartText({
  variant = "body",
  tone,
  heading = false,
  numberOfLines,
  style,
  children,
}: TextProps) {
  const colors = useColors();
  const { typography } = useTheme();
  const inherited = useContext(ContentColor);
  const color = tone ? toneColor(colors, tone) : (inherited ?? colors.textPrimary);
  return (
    <NativeText
      {...(heading ? { role: "heading" as const } : {})}
      {...(numberOfLines ? { numberOfLines } : {})}
      // Android has no equivalent yet.
      lineBreakStrategyIOS="hangul-word"
      style={[variantStyle(typography, variant), color ? { color } : null, style]}
    >
      {children}
    </NativeText>
  );
}
