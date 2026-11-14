import { border, radius, space, typography } from "@acme/tokens";
import { type ReactNode, useState } from "react";
import {
  StyleSheet,
  TextInput,
  type TextInputProps,
  useWindowDimensions,
  View,
} from "react-native";
import { Text } from "./Text.tsx";
import { CONTROL_HEIGHT, type Colors, ContentColor, useColors } from "./theme.ts";

/**
 * The outline of a field's box. While the field is in use or wrong the outline thickens as well
 * as changing color, so neither depends on color alone; `edge` is the padding inside it, which
 * shrinks by as much, so the content does not move. Select draws its box with it too.
 */
export function fieldOutline(
  colors: Colors,
  active: boolean,
  invalid: boolean,
): { width: number; color: string; edge: number } {
  const width = active || invalid ? border.width.thick : border.width.thin;
  const color = invalid
    ? colors.fieldBorderInvalid
    : active
      ? colors.fieldBorderFocus
      : colors.fieldBorder;
  return { width, color, edge: space[3] - (width - border.width.thin) };
}

/**
 * What a field says under itself: the error while there is one, the description otherwise, and
 * `counter` at the end edge. Select and RadioGroup put the same words under themselves.
 */
export function FieldMessage({
  error,
  description,
  counter,
}: {
  error?: string | undefined;
  description?: string | undefined;
  counter?: ReactNode;
}) {
  if (error === undefined && !description && !counter) return null;
  return (
    <View style={styles.below}>
      {error !== undefined ? (
        <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.message}>
          <Text variant="detail" tone="danger">
            {error}
          </Text>
        </View>
      ) : description ? (
        <Text variant="detail" tone="secondary" style={styles.message}>
          {description}
        </Text>
      ) : null}
      {counter}
    </View>
  );
}

export type TextFieldProps = {
  /** Always visible. A placeholder is not a label: it disappears as soon as the person types. */
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Help shown under the field. Replaced by `error` while there is one. */
  description?: string;
  /** What is wrong and how to fix it. Clear it when the value changes. */
  error?: string | undefined;
  placeholder?: string;
  disabled?: boolean;
  /**
   * Inside the box, before the text: an icon, a unit, a small button. Icons and text in it
   * take the placeholder's color unless they are given one.
   */
  leading?: ReactNode;
  /** Inside the box, after the text. Colored like `leading`. */
  trailing?: ReactNode;
  /** A text area: `rows` lines tall, scrolling when the text is longer. */
  multiline?: boolean;
  /** How many lines a `multiline` field shows. */
  rows?: number;
  /** The field takes no more characters than this, and shows how many are used. */
  maxLength?: number;
  /** Called when the person presses the keyboard's return key. */
  onSubmit?: () => void;
} & Pick<
  TextInputProps,
  | "autoCapitalize"
  | "autoComplete"
  | "autoFocus"
  | "keyboardType"
  | "returnKeyType"
  | "secureTextEntry"
  | "textContentType"
>;

/** A labelled text field: one line, or several with `multiline`. */
export function TextField({
  label,
  value,
  onChange,
  description,
  error,
  placeholder,
  disabled = false,
  leading,
  trailing,
  multiline = false,
  rows = 3,
  maxLength,
  onSubmit,
  ...input
}: TextFieldProps) {
  const colors = useColors();
  const { fontScale } = useWindowDimensions();
  const [focused, setFocused] = useState(false);
  const invalid = error !== undefined;
  const { width: outline, color: outlineColor, edge } = fieldOutline(colors, focused, invalid);
  // The room inside the outline of a one-line field. A slot is that tall whatever it holds, so
  // the box keeps its height.
  const inner = CONTROL_HEIGHT.md - 2 * outline;
  // What a one-line field leaves above and below its line, so the first line of a text area
  // sits where the only line of a field does.
  const lead = (inner - typography.body.lineHeight) / 2;
  // Lines grow with the system's text size, and a text area with them.
  const line = typography.body.lineHeight * fontScale;
  // In a text area a slot is as tall as the first line and its share of the padding, which
  // centers it on that line.
  const slot = multiline ? line + 2 * lead : inner;

  return (
    <View style={styles.field}>
      <Text variant="label" tone={disabled ? "secondary" : "primary"}>
        {label}
      </Text>
      <View
        style={[
          styles.box,
          multiline && styles.top,
          {
            borderWidth: outline,
            borderColor: outlineColor,
            backgroundColor: disabled ? colors.backgroundDisabled : colors.fieldBackground,
            // Where there is no slot the padding is the input's own, so a touch there still
            // lands on the input.
            paddingStart: leading ? edge : 0,
            paddingEnd: trailing ? edge : 0,
          },
        ]}
      >
        {leading && (
          <ContentColor value={colors.fieldPlaceholder}>
            <View style={[styles.slot, { height: slot }]}>{leading}</View>
          </ContentColor>
        )}
        <TextInput
          {...input}
          accessibilityLabel={label}
          accessibilityHint={error ?? description}
          aria-invalid={invalid}
          editable={!disabled}
          multiline={multiline}
          {...(maxLength === undefined ? {} : { maxLength })}
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...(onSubmit ? { onSubmitEditing: onSubmit } : {})}
          placeholder={placeholder}
          placeholderTextColor={colors.fieldPlaceholder}
          style={[
            styles.input,
            {
              paddingStart: leading ? space[2] : edge,
              paddingEnd: trailing ? space[2] : edge,
              color: disabled ? colors.textDisabled : colors.fieldText,
            },
            multiline
              ? [
                  styles.area,
                  {
                    height: rows * line + 2 * lead,
                    paddingTop: lead,
                    paddingBottom: lead,
                  },
                ]
              : { minHeight: inner },
          ]}
        />
        {trailing && (
          <ContentColor value={colors.fieldPlaceholder}>
            <View style={[styles.slot, { height: slot }]}>{trailing}</View>
          </ContentColor>
        )}
      </View>
      <FieldMessage
        error={error}
        description={description}
        counter={
          maxLength !== undefined && (
            <Text variant="footnote" tone="secondary" style={styles.counter}>
              {value.length}/{maxLength}
            </Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    alignSelf: "stretch",
    gap: space[1],
  },
  box: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
  },
  // In a text area the slots stay with the first line.
  top: {
    alignItems: "flex-start",
  },
  slot: {
    justifyContent: "center",
  },
  input: {
    flex: 1,
    // No line height: iOS centers single-line input text on its own, and a line height
    // pushes it off center.
    fontSize: typography.body.fontSize,
  },
  area: {
    lineHeight: typography.body.lineHeight,
    // Android centers the text of a tall input unless told otherwise.
    textAlignVertical: "top",
  },
  below: {
    flexDirection: "row",
    // The counter is set smaller than the message beside it; they share a baseline.
    alignItems: "baseline",
    gap: space[3],
  },
  message: {
    flex: 1,
  },
  counter: {
    // Stays at the end edge when there is no message to push it there.
    marginStart: "auto",
    // Digits of one width, so the counter does not shift as it counts.
    fontVariant: ["tabular-nums"],
  },
});
