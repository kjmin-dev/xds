import { classes, rootPart, type SpinnerBaseProps, spinnerClass } from "@acme/ui-core";
import { useDefaults } from "./Defaults.tsx";
import type { RootProps } from "./root.ts";

export type SpinnerProps = SpinnerBaseProps & RootProps;

const ROOT = rootPart("Spinner");

/**
 * Says that something is in progress and how long is unknown. Takes the color of the text around
 * it. With `label` it is announced; without one it is decoration next to text that already says
 * what is happening.
 */
export function Spinner(props: SpinnerProps) {
  const defaults = useDefaults("Spinner");
  return (
    <span
      class={classes(ROOT, "inline-flex shrink-0", props.class)}
      style={props.style}
      role={props.label ? "status" : undefined}
      aria-label={props.label || undefined}
      aria-hidden={props.label ? undefined : "true"}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        class={spinnerClass(props.size ?? defaults().size)}
      >
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
