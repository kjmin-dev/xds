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

const ROOT = rootPart("ProgressBar");

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
      class={classes(ROOT, progressBarClass, props.class)}
      style={props.style}
    >
      <div class={progressBarFillClass} style={{ width: `${percent()}%` }} />
    </div>
  );
}
