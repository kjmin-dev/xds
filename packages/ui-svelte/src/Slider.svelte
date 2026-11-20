<!--
  @component
  Picks a number in a range by dragging the thumb, or by pressing the track where it should go.
  The values snap to `step`.

  It is a slider named by its label with its value, minimum and maximum, and each arrow key moves
  it one step.
-->
<script module lang="ts">
  import type { SliderBaseProps } from "@acme/ui-core";
  import type { RootProps } from "./root.ts";

  export type SliderProps = SliderBaseProps &
    RootProps & {
      onChange: (value: number) => void;
    };
</script>

<script lang="ts">
  import {
    classes,
    focusThumbOnPress,
    sliderArrowValue,
    sliderPageSize,
    sliderValueText,
  } from "@acme/ui-core";
  import * as slider from "@zag-js/slider";
  import { mergeProps, normalizeProps, useMachine } from "@zag-js/svelte";

  let {
    label,
    value,
    min = 0,
    max = 100,
    step = 1,
    disabled,
    showValue,
    onChange,
    class: className,
    style,
  }: SliderProps = $props();

  const id = $props.id();
  const pageSize = $derived(sliderPageSize({ min, max, step }));
  const service = useMachine(slider.machine, () => ({
    id,
    value: [value],
    // One thumb, so one number.
    onValueChange: (details: slider.ValueChangeDetails) => onChange(details.value[0] ?? min),
    min,
    max,
    step,
    largeStep: pageSize,
    disabled,
    // The thumb's center is on the value, at the ends too; the band is inset to make room.
    thumbAlignment: "center" as const,
    getAriaValueText: (details: { value: number }) => sliderValueText(details.value),
  }));
  const api = $derived(slider.connect(service, normalizeProps));
  let thumbElement = $state<HTMLDivElement>();
  const thumb = $derived(
    mergeProps(api.getThumbProps({ index: 0 }), {
      // Up and Down move a horizontal slider too, as they move a native range input.
      onkeydown: (event: KeyboardEvent) => {
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
    }),
  );
  const control = $derived(
    mergeProps(api.getControlProps(), {
      // No focus ring after a press. This handler runs before Zag's.
      onpointerdown: (event: PointerEvent) => {
        if (!disabled) focusThumbOnPress(event, thumbElement);
      },
    }),
  );
</script>

<!-- A group named by the label, around the label, the value and the slider. Not a fieldset:
     that is for a set of fields, and this is one slider and its label. The app's style is merged
     with the one the machine writes on the root. -->
<div
  {...mergeProps(api.getRootProps(), { class: classes("acme-slider", className), style })}
  role="group"
  aria-labelledby={api.getLabelProps().id}
>
  <!-- Zag's props give it `for`, the hidden input's id. -->
  <label {...api.getLabelProps()} class="acme-slider__label">{label}</label>
  {#if showValue}
    <!-- Read when asked for, not at every step: the slider itself announces its value. -->
    <output {...api.getValueTextProps()} aria-live="off" class="acme-slider__output"
      >{sliderValueText(api.value[0] ?? value)}</output
    >
  {/if}
  <div {...control} class="acme-slider__control">
    <div {...api.getTrackProps()} class="acme-slider__track">
      <div {...api.getRangeProps()} class="acme-slider__range"></div>
    </div>
    <div {...thumb} bind:this={thumbElement} class="acme-slider__thumb">
      <input {...api.getHiddenInputProps({ index: 0 })} />
    </div>
  </div>
</div>
