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

/**
 * The value as it is shown beside the label and read out: a number in the reader's own
 * locale, as the React library writes it.
 */
export function sliderValueText(value: number): string {
  return new Intl.NumberFormat().format(value);
}

/**
 * How far Page Up, Page Down and a shifted arrow key move the thumb: a tenth of the range,
 * rounded to a whole number of steps and never less than one, as in the React library.
 */
export function sliderPageSize(options: { min: number; max: number; step: number }): number {
  const { min, max, step } = options;
  const steps = Math.max(Math.round((max - min) / 10 / step), 1);
  // Rounded to the step's decimals, so that 3 steps of 0.1 are 0.3.
  const decimals = String(step).split(".")[1]?.length ?? 0;
  return Number((steps * step).toFixed(decimals));
}
