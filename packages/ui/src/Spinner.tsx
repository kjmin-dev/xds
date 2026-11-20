import { classes, rootPart, type SpinnerBaseProps, spinnerClass } from "@acme/ui-core";
import { useDefaults } from "./Defaults.tsx";
import type { RootProps } from "./root.ts";

export type SpinnerProps = SpinnerBaseProps & RootProps;

/**
 * Says that something is in progress and how long is unknown. Takes the color of the text around
 * it. With `label` it is announced; without one it is decoration next to text that already says
 * what is happening.
 */
export function Spinner(props: SpinnerProps) {
  const defaults = useDefaults("Spinner");
  const { size = defaults.size, label, className, style } = props;
  return (
    <span
      className={classes(rootPart("Spinner"), "inline-flex shrink-0", className)}
      style={style}
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
