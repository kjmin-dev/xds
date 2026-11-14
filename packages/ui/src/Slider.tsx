import {
  focusThumbOnPress,
  type SliderBaseProps,
  sliderArrowValue,
  sliderPageSize,
  sliderValueText,
} from "@acme/ui-core";
import { mergeProps, normalizeProps, useMachine } from "@zag-js/react";
import * as slider from "@zag-js/slider";
import { useId, useRef } from "react";

export type SliderProps = SliderBaseProps & {
  onChange: (value: number) => void;
};

/**
 * Picks a number in a range by dragging the thumb, or by pressing the track where it should
 * go. The values snap to `step`.
 *
 * It is a slider named by its label with its value, minimum and maximum, and each arrow key
 * moves it one step.
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
}: SliderProps) {
  const pageSize = sliderPageSize({ min, max, step });
  const service = useMachine(slider.machine, {
    id: useId(),
    value: [value],
    // One thumb, so one number.
    onValueChange: (details) => onChange(details.value[0] ?? min),
    min,
    max,
    step,
    largeStep: pageSize,
    disabled,
    // The thumb's center is on the value, at the ends too; the band is inset to make room.
    thumbAlignment: "center",
    getAriaValueText: (details) => sliderValueText(details.value),
  });
  const api = slider.connect(service, normalizeProps);
  const thumbElement = useRef<HTMLDivElement>(null);
  const thumb = mergeProps(api.getThumbProps({ index: 0 }), {
    // Up and Down move a horizontal slider too, as they move a native range input.
    onKeyDown: (event: { key: string; shiftKey: boolean }) => {
      if (disabled) return;
      const next = sliderArrowValue(event, {
        value: api.value[0] ?? min,
        min,
        max,
        step,
        pageSize,
      });
      if (next !== undefined) api.setThumbValue(0, next);
    },
  });
  const control = mergeProps(api.getControlProps(), {
    // No focus ring after a press. This handler runs before Zag's.
    onPointerDown: (event: { button: number }) => {
      if (!disabled) focusThumbOnPress(event, thumbElement.current);
    },
  });
  return (
    // A group named by the label, around the label, the value and the slider. Not a fieldset:
    // that is for a set of fields, and this is one slider and its label.
    <div
      {...api.getRootProps()}
      role="group"
      aria-labelledby={api.getLabelProps().id}
      className="slider"
    >
      {/* Zag's props give it `htmlFor`, the hidden input's id. */}
      <label {...api.getLabelProps()} className="slider__label">
        {label}
      </label>
      {showValue && (
        // Read when asked for, not at every step: the slider itself announces its value.
        <output {...api.getValueTextProps()} aria-live="off" className="slider__output">
          {sliderValueText(api.value[0] ?? value)}
        </output>
      )}
      <div {...control} className="slider__control">
        <div {...api.getTrackProps()} className="slider__track">
          <div {...api.getRangeProps()} className="slider__range" />
        </div>
        <div {...thumb} ref={thumbElement} className="slider__thumb">
          <input {...api.getHiddenInputProps({ index: 0 })} />
        </div>
      </div>
    </div>
  );
}
