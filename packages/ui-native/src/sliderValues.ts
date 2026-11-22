/** The numbers a Slider moves between. */
export type SliderRange = { min: number; max: number; step: number };

/** Digits after the decimal point of `value` as written: 2 for 0.25. */
function decimals(value: number): number {
  const [, fraction = ""] = String(value).split(".");
  return fraction.length;
}

/**
 * The value nearest `raw` that is a whole number of steps from `min` and inside the range. The
 * sums are done in whole units of the finest decimal, so steps of 0.1 give 0.3 and not
 * 0.30000000000000004, and a range that is not a whole number of steps long stops at the last
 * step that fits rather than at `max`.
 */
export function snap(raw: number, { min, max, step }: SliderRange): number {
  const scale = 10 ** Math.max(decimals(min), decimals(max), decimals(step));
  const low = Math.round(min * scale);
  const high = Math.round(max * scale);
  const unit = Math.round(step * scale);
  if (high <= low || unit <= 0) return min;
  const last = Math.floor((high - low) / unit);
  const index = Math.min(last, Math.max(0, Math.round((raw * scale - low) / unit)));
  return (low + index * unit) / scale;
}

/** How far along the range `value` is, from 0 at `min` to 1 at `max`. */
export function fraction(value: number, { min, max }: SliderRange): number {
  if (max <= min) return 0;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

/**
 * The value under a point `x` from the left edge of a track `width` long. The thumb's center
 * stops half a thumb short of either end, so the thumb never hangs past the track, and the
 * range runs from the right in a right-to-left layout.
 */
export function valueAt(
  x: number,
  width: number,
  thumb: number,
  rtl: boolean,
  range: SliderRange,
): number {
  const travel = width - thumb;
  if (travel <= 0) return range.min;
  const along = Math.min(1, Math.max(0, (x - thumb / 2) / travel));
  return snap(range.min + (rtl ? 1 - along : along) * (range.max - range.min), range);
}

/**
 * The value as it is shown: with as many decimals as the steps have, so that it keeps its width
 * as it moves.
 */
export function formatValue(value: number, { min, step }: SliderRange): string {
  return value.toFixed(Math.max(decimals(min), decimals(step)));
}
