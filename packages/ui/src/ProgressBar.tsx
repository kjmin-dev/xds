/**
 * How far along something is, from 0 to 1. For work of unknown length use a Spinner.
 * `label` says what is progressing; a screen reader reads it with the percentage.
 */
export function ProgressBar({ value, label }: { value: number; label: string }) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="h-acme-progress w-full overflow-hidden rounded-full bg-acme-progress-track"
    >
      <div
        className="h-full rounded-full bg-acme-progress-fill transition-[width] duration-(--acme-motion-duration-normal) motion-reduce:transition-none"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
