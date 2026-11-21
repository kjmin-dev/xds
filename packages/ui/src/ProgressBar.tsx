import {
  classes,
  type ProgressBarBaseProps,
  progressBarClass,
  progressBarFillClass,
  progressPercent,
  rootPart,
} from "@acme/ui-core";
import type { RootProps } from "./root.ts";

export type ProgressBarProps = ProgressBarBaseProps & RootProps;

/**
 * How far along something is, from 0 to 1. For work of unknown length use a Spinner.
 * `label` says what is progressing; a screen reader reads it with the percentage.
 */
export function ProgressBar({ value, label, className, style }: ProgressBarProps) {
  const percent = progressPercent(value);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={classes(rootPart("ProgressBar"), progressBarClass, className)}
      style={style}
    >
      <div className={progressBarFillClass} style={{ width: `${percent}%` }} />
    </div>
  );
}
