import { useRef } from "react";
import {
  type AccessibilityActionEvent,
  I18nManager,
  PanResponder,
  Platform,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { formatValue, fraction, snap, valueAt } from "./slider.ts";
// The text of the component's own parts takes nothing from an app's `Defaults`.
import { PartText as Text } from "./Text.tsx";
import { themed, useColors, useControl } from "./theme.ts";

export type SliderProps = {
  /** Always visible, above the track. It is also what a screen reader calls the slider. */
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Values snap to whole steps from `min`, and the screen reader's adjust gestures move one. */
  step?: number;
  disabled?: boolean;
  /** Shows the current value at the end of the label row. */
  showValue?: boolean;
  /** Put on the component's root view, after its own style. */
  style?: StyleProp<ViewStyle>;
};

const ACTIONS = [{ name: "increment" }, { name: "decrement" }];

/**
 * Picks a number in a range by dragging the thumb, or by pressing the track where the thumb
 * should go. The fill runs from the start to the thumb, so the value shows in a shape as well as
 * a color.
 */
export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  showValue = false,
  style,
}: SliderProps) {
  const styles = useStyles();
  const colors = useColors();
  const thumb = useControl().sliderThumb;
  const range = { min, max, step };
  const along = fraction(value, range);

  // The responder is created once, so it reads what changes through refs.
  const latest = useRef({ value, onChange, range, disabled, thumb });
  latest.current = { value, onChange, range, disabled, thumb };
  const width = useRef(0);
  const startX = useRef(0);
  const moveTo = (next: number) => {
    if (next === latest.current.value) return;
    // Moves come faster than renders; this keeps a move to the same step from calling twice.
    latest.current.value = next;
    latest.current.onChange(next);
  };
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !latest.current.disabled,
      onMoveShouldSetPanResponder: () => !latest.current.disabled,
      // A drag that strays up or down still belongs to the slider, not to a scroll view around it.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        // The track and the thumb take no touches, so the point is measured from this view.
        startX.current = event.nativeEvent.locationX;
        moveTo(
          valueAt(
            startX.current,
            width.current,
            latest.current.thumb,
            I18nManager.isRTL,
            latest.current.range,
          ),
        );
      },
      onPanResponderMove: (_, gesture) =>
        moveTo(
          valueAt(
            startX.current + gesture.dx,
            width.current,
            latest.current.thumb,
            I18nManager.isRTL,
            latest.current.range,
          ),
        ),
    }),
  ).current;

  const adjust = (event: AccessibilityActionEvent) => {
    if (disabled) return;
    const direction = event.nativeEvent.actionName === "increment" ? 1 : -1;
    moveTo(snap(value + direction * step, range));
  };

  const fill = disabled ? colors.sliderDisabledFill : colors.sliderFill;
  const shown = formatValue(value, range);

  return (
    <View style={[styles.slider, style]}>
      <View style={styles.labels}>
        <Text variant="label" tone={disabled ? "secondary" : "primary"} style={styles.label}>
          {label}
        </Text>
        {showValue && (
          // The slider says its value itself; read here too, it would be heard twice.
          <View aria-hidden>
            <Text variant="detail" tone="secondary" style={styles.number}>
              {shown}
            </Text>
          </View>
        )}
      </View>
      <View
        accessible
        // Not `role="slider"`: in React Native 0.88 it loses VoiceOver's adjustable trait, and
        // with it the swipe that changes the value; TalkBack reads out a new value only for this.
        accessibilityRole="adjustable"
        aria-label={label}
        aria-disabled={disabled}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        // iOS reads a value without text as a percentage of the range, which is not the number
        // shown unless the range is 0 to 100. Android reads the numbers as they are.
        {...(Platform.OS === "ios" ? { "aria-valuetext": shown } : {})}
        accessibilityActions={disabled ? [] : ACTIONS}
        onAccessibilityAction={adjust}
        onLayout={(event) => {
          width.current = event.nativeEvent.layout.width;
        }}
        {...pan.panHandlers}
        style={styles.area}
      >
        {/* The rail is where the thumb's center travels: half a thumb in from each end, so the
            thumb never hangs past the track. The track and the fill reach back out to the ends
            from it; the fill ends at the thumb's center. */}
        <View style={styles.rail}>
          <View style={[styles.track, { backgroundColor: colors.sliderTrack }]} />
          <View style={[styles.fill, { end: `${(1 - along) * 100}%`, backgroundColor: fill }]} />
          <View
            style={[
              styles.thumb,
              {
                start: `${along * 100}%`,
                backgroundColor: colors.sliderThumb,
                borderColor: disabled ? colors.sliderDisabledFill : colors.sliderThumbBorder,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const useStyles = themed(({ border, radius, space, size }) => {
  const control = size.touch;
  const THUMB = control.sliderThumb;
  return StyleSheet.create({
    slider: {
      alignSelf: "stretch",
    },
    labels: {
      flexDirection: "row",
      // The value is set in a different role from the label; they share a baseline.
      alignItems: "baseline",
      gap: space[3],
    },
    label: {
      flex: 1,
    },
    number: {
      // Digits of one width, so the value does not shift as it changes.
      fontVariant: ["tabular-nums"],
    },
    // As tall as the smallest target, with the track across its middle. The height above the
    // thumb is what separates it from the label, so the column needs no gap.
    area: {
      height: control.targetMin,
      justifyContent: "center",
    },
    rail: {
      height: control.sliderTrack,
      marginHorizontal: THUMB / 2,
      // Only the area above takes touches: a touch on the thumb is then measured from the area.
      pointerEvents: "none",
    },
    track: {
      position: "absolute",
      top: 0,
      bottom: 0,
      start: -THUMB / 2,
      end: -THUMB / 2,
      borderRadius: radius.full,
    },
    fill: {
      position: "absolute",
      top: 0,
      bottom: 0,
      start: -THUMB / 2,
      borderRadius: radius.full,
    },
    thumb: {
      position: "absolute",
      top: (control.sliderTrack - THUMB) / 2,
      width: THUMB,
      height: THUMB,
      marginStart: -THUMB / 2,
      borderWidth: border.width.thick,
      borderRadius: radius.full,
    },
  });
});
