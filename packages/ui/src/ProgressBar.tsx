import {
  type ProgressBarBaseProps,
  progressBarClass,
  progressBarFillClass,
  progressPercent,
} from "@acme/ui-core";

export type ProgressBarProps = ProgressBarBaseProps;

/**
 * How far along something is, from 0 to 1. For work of unknown length use a Spinner.
 * `label` says what is progressing; a screen reader reads it with the percentage.
 */
export function ProgressBar({ value, label }: ProgressBarProps) {
  const percent = progressPercent(value);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={progressBarClass}
    >
      <div className={progressBarFillClass} style={{ width: `${percent}%` }} />
    </div>
  );
}
