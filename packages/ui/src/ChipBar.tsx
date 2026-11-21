import { type ChipBarBaseProps, chipBarClass, classes, rootPart } from "@acme/ui-core";
import type { ReactNode } from "react";
import type { RootProps } from "./root.ts";

export type ChipBarProps = ChipBarBaseProps &
  RootProps & {
    /** The chips. Which of them are selected is the app's business: the bar holds no state. */
    children: ReactNode;
  };

/**
 * One row of chips. It scrolls sideways when the chips do not fit and never wraps, so the
 * content under it stays where it is.
 */
export function ChipBar({ label, className, style, children }: ChipBarProps) {
  return (
    // A group, not a fieldset: a fieldset cannot be a scrolling flex row in every browser.
    <div
      role="group"
      aria-label={label}
      className={classes(rootPart("ChipBar"), chipBarClass, className)}
      style={style}
    >
      {children}
    </div>
  );
}
