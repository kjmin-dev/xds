import { type SpinnerBaseProps, spinnerClass } from "@acme/ui-core";

export type SpinnerProps = SpinnerBaseProps;

/**
 * Says that something is in progress and how long is unknown. Takes the color of the text around
 * it. With `label` it is announced; without one it is decoration next to text that already says
 * what is happening.
 */
export function Spinner({ size, label }: SpinnerProps) {
  return (
    <span
      className="inline-flex shrink-0"
      {...(label ? { role: "status", "aria-label": label } : { "aria-hidden": true })}
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={spinnerClass(size)}>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
