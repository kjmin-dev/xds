import {
  classes,
  focusThumbOnPress,
  type SliderBaseProps,
  sliderArrowValue,
  sliderPageSize,
  sliderValueText,
} from "@acme/ui-core";
import * as slider from "@zag-js/slider";
import { mergeProps, normalizeProps, useMachine } from "@zag-js/solid";
import { createMemo, createUniqueId, Show } from "solid-js";
import { type RootProps, withStyle } from "./root.ts";

export type SliderProps = SliderBaseProps &
  RootProps & {
    onChange: (value: number) => void;
  };

/**
 * Picks a number in a range by dragging the thumb, or by pressing the track where it should
 * go. The values snap to `step`.
 *
 * It is a slider named by its label with its value, minimum and maximum, and each arrow key
 * moves it one step.
 */
export function Slider(props: SliderProps) {
  const id = createUniqueId();
  const min = () => props.min ?? 0;
  const max = () => props.max ?? 100;
  const step = () => props.step ?? 1;
  const pageSize = () => sliderPageSize({ min: min(), max: max(), step: step() });
  const service = useMachine(slider.machine, () => ({
    id,
    value: [props.value],
    // One thumb, so one number.
    onValueChange: (details: slider.ValueChangeDetails) =>
      props.onChange(details.value[0] ?? min()),
    min: min(),
    max: max(),
    step: step(),
    largeStep: pageSize(),
    disabled: props.disabled,
    // The thumb's center is on the value, at the ends too; the band is inset to make room.
    thumbAlignment: "center" as const,
    getAriaValueText: (details: { value: number }) => sliderValueText(details.value),
  }));
  const api = createMemo(() => slider.connect(service, normalizeProps));
  const root = withStyle(
    () => api().getRootProps(),
    () => props.style,
  );
  const thumb = mergeProps(() => api().getThumbProps({ index: 0 }), {
    // Zag gives `draggable: false`, and Solid removes an attribute whose value is false.
    // `draggable` is not a boolean attribute: without it the thumb is "auto", so "false" has
    // to be written out, as the other web libraries write it.
    draggable: "false" as const,
    // Up and Down move a horizontal slider too, as they move a native range input.
    onKeyDown: (event: KeyboardEvent) => {
      if (props.disabled) return;
      const next = sliderArrowValue(event, {
        value: api().value[0] ?? min(),
        min: min(),
        max: max(),
        step: step(),
        pageSize: pageSize(),
      });
      if (next !== undefined) api().setThumbValue(0, next);
    },
  });
  let thumbElement: HTMLDivElement | undefined;
  const control = mergeProps(() => api().getControlProps(), {
    // No focus ring after a press. This handler runs before Zag's.
    onPointerDown: (event: PointerEvent) => {
      if (!props.disabled) focusThumbOnPress(event, thumbElement);
    },
  });
  return (
    // A group named by the label, around the label, the value and the slider. Not a fieldset:
    // that is for a set of fields, and this is one slider and its label.
    <div
      {...root}
      role="group"
      aria-labelledby={api().getLabelProps().id}
      class={classes("acme-slider", props.class)}
    >
      {/* Zag's props give it `for`, the hidden input's id. */}
      <label {...api().getLabelProps()} class="acme-slider__label">
        {props.label}
      </label>
      <Show when={props.showValue}>
        {/* Read when asked for, not at every step: the slider itself announces its value. */}
        <output {...api().getValueTextProps()} aria-live="off" class="acme-slider__output">
          {sliderValueText(api().value[0] ?? props.value)}
        </output>
      </Show>
      <div {...control} class="acme-slider__control">
        <div {...api().getTrackProps()} class="acme-slider__track">
          <div {...api().getRangeProps()} class="acme-slider__range" />
        </div>
        <div {...thumb} ref={(element) => (thumbElement = element)} class="acme-slider__thumb">
          <input {...api().getHiddenInputProps({ index: 0 })} />
        </div>
      </div>
    </div>
  );
}
