import { Slider as HeroSlider, Label } from "@heroui/react";

export type SliderProps = {
  /** Shown above the track, and names the slider for assistive technology. */
  label: string;
  value: number;
  onChange: (value: number) => void;
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
 * Picks a number in a range by dragging the thumb, or by pressing the track where it should
 * go. The values snap to `step`.
 *
 * It is a native range input, hidden under the thumb: it is a slider named by its label with
 * its value, minimum and maximum, and each arrow key moves it one step.
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
  return (
    <HeroSlider
      value={value}
      // One thumb, so one number; React Aria's type also allows a range of two.
      onChange={(next) => onChange(typeof next === "number" ? next : (next[0] ?? min))}
      minValue={min}
      maxValue={max}
      step={step}
      isDisabled={disabled}
    >
      <Label>{label}</Label>
      {showValue && <HeroSlider.Output />}
      <HeroSlider.Track>
        <HeroSlider.Fill />
        <HeroSlider.Thumb />
      </HeroSlider.Track>
    </HeroSlider>
  );
}
