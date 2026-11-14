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
export function ProgressBar(props: ProgressBarProps) {
  const percent = () => progressPercent(props.value);
  return (
    <div
      role="progressbar"
      aria-label={props.label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent()}
      class={progressBarClass}
    >
      <div class={progressBarFillClass} style={{ width: `${percent()}%` }} />
    </div>
  );
}
