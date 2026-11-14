import { focusWithoutRing } from "./focus.ts";

/** Slider's props in every framework, short of `onChange`. */
export type SliderBaseProps = {
  /** Shown above the track, and names the slider for assistive technology. */
  label: string;
  value: number;
  /** Defaults to 0. */
  min?: number;
  /** Defaults to 100. */
  max?: number;
  /** The values snap to multiples of it from `min`. Defaults to 1. */
  step?: number;
  disabled?: boolean;
  /** Shows the current value at the end of the label's line. */
  showValue?: boolean;
};

/** The value as it is shown beside the label and read out: a number in the reader's own locale. */
export function sliderValueText(value: number): string {
  return new Intl.NumberFormat().format(value);
}

/**
 * How far Page Up, Page Down and a shifted arrow key move the thumb: a tenth of the range,
 * rounded to a whole number of steps and never less than one.
 */
export function sliderPageSize(options: { min: number; max: number; step: number }): number {
  const { min, max, step } = options;
  const steps = Math.max(Math.round((max - min) / 10 / step), 1);
  // Rounded to the step's decimals, so that 3 steps of 0.1 are 0.3.
  const decimals = String(step).split(".")[1]?.length ?? 0;
  return Number((steps * step).toFixed(decimals));
}

/**
 * Where Up or Down moves the thumb of a horizontal slider, as they move a native range input:
 * a step, or `pageSize` with Shift, within the range. Undefined for any other key. Zag's
 * horizontal slider leaves the two keys to the page.
 */
export function sliderArrowValue(
  event: { key: string; shiftKey: boolean },
  options: { value: number; min: number; max: number; step: number; pageSize: number },
): number | undefined {
  const direction = event.key === "ArrowUp" ? 1 : event.key === "ArrowDown" ? -1 : 0;
  if (direction === 0) return undefined;
  const { value, min, max, step, pageSize } = options;
  const next = value + direction * (event.shiftKey ? pageSize : step);
  return Math.min(max, Math.max(min, next));
}

/**
 * For a press on a slider's track or thumb, ahead of Zag's handler. Zag keeps the press from
 * focusing anything, then focuses the thumb from a script; focused here first, the thumb shows
 * no keyboard ring.
 */
export function focusThumbOnPress(
  event: { button: number },
  thumb: HTMLElement | null | undefined,
): void {
  if (event.button === 0) focusWithoutRing(thumb);
}
