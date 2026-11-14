/** ProgressBar's props in every framework. */
export type ProgressBarBaseProps = {
  /** How far along, from 0 to 1. Values outside are clamped. */
  value: number;
  /** Says what is progressing; a screen reader reads it with the percentage. */
  label: string;
};

/** The whole percentage a value from 0 to 1 stands for, clamped to 0 to 100. */
export function progressPercent(value: number): number {
  return Math.round(Math.min(1, Math.max(0, value)) * 100);
}

/** The track. It has the progress bar role and holds the fill. */
export const progressBarClass =
  "h-acme-progress w-full overflow-hidden rounded-full bg-acme-progress-track";

/** The fill, whose width is the percentage. */
export const progressBarFillClass =
  "h-full rounded-full bg-acme-progress-fill transition-[width] duration-(--acme-motion-duration-normal) motion-reduce:transition-none";
