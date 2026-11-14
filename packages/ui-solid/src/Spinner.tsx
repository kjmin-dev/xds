import { type SpinnerBaseProps, spinnerClass } from "@acme/ui-core";

export type SpinnerProps = SpinnerBaseProps;

/**
 * Says that something is in progress and how long is unknown. Takes the color of the text around
 * it. With `label` it is announced; without one it is decoration next to text that already says
 * what is happening.
 */
export function Spinner(props: SpinnerProps) {
  return (
    <span
      class="inline-flex shrink-0"
      role={props.label ? "status" : undefined}
      aria-label={props.label || undefined}
      aria-hidden={props.label ? undefined : "true"}
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" class={spinnerClass(props.size)}>
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" opacity="0.25" />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
        />
      </svg>
    </span>
  );
}
