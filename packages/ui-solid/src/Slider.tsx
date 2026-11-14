import { type SliderBaseProps, sliderPageSize, sliderValueText } from "@acme/ui-core";
import * as slider from "@zag-js/slider";
import { mergeProps, normalizeProps, useMachine } from "@zag-js/solid";
import { createMemo, createUniqueId, Show } from "solid-js";

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
  const thumb = mergeProps(() => api().getThumbProps({ index: 0 }), {
    // Up and Down move a horizontal slider too, as they move a native range input and the
    // React library's slider. Zag's horizontal slider leaves them to the page.
    onKeyDown: (event: KeyboardEvent) => {
      const direction = event.key === "ArrowUp" ? 1 : event.key === "ArrowDown" ? -1 : 0;
      if (direction === 0 || props.disabled) return;
      const distance = event.shiftKey ? pageSize() : step();
      const next = (api().value[0] ?? min()) + direction * distance;
      api().setThumbValue(0, Math.min(max(), Math.max(min(), next)));
    },
  });
  let thumbElement: HTMLDivElement | undefined;
  const control = mergeProps(() => api().getControlProps(), {
    // Zag keeps a press on the track or the thumb from focusing anything, then focuses the
    // thumb from a script, which the browser takes for keyboard focus: the ring shows, where
    // the React library shows none after a press. Focused here first, without the ring, the
    // thumb is already focused when Zag focuses it. This handler runs before Zag's.
    onPointerDown: (event: PointerEvent) => {
      if (props.disabled || event.button !== 0 || thumbElement === undefined) return;
      if (document.activeElement !== thumbElement)
        thumbElement.focus({ preventScroll: true, focusVisible: false });
    },
  });
  return (
    // A group named by the label, around the label, the value and the slider, as in the React
    // library. Not a fieldset: that is for a set of fields, and this is one slider and its label.
    <div
      {...api().getRootProps()}
      role="group"
      aria-labelledby={api().getLabelProps().id}
      class="slider"
    >
      {/* Zag's props give it `for`, the hidden input's id. */}
      <label {...api().getLabelProps()} class="slider__label">
        {props.label}
      </label>
      <Show when={props.showValue}>
        {/* Read when asked for, not at every step: the slider itself announces its value. */}
        <output {...api().getValueTextProps()} aria-live="off" class="slider__output">
          {sliderValueText(api().value[0] ?? props.value)}
        </output>
      </Show>
      <div {...control} class="slider__control">
        <div {...api().getTrackProps()} class="slider__track">
          <div {...api().getRangeProps()} class="slider__range" />
        </div>
        <div {...thumb} ref={(element) => (thumbElement = element)} class="slider__thumb">
          <input {...api().getHiddenInputProps({ index: 0 })} />
        </div>
      </div>
    </div>
  );
}
