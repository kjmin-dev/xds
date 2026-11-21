import { type ChipBarBaseProps, chipBarClass, classes, rootPart } from "@acme/ui-core";
import type { Element } from "solid-js";
import type { RootProps } from "./root.ts";

export type ChipBarProps = ChipBarBaseProps &
  RootProps & {
    /** The chips. Which of them are selected is the app's business: the bar holds no state. */
    children: Element;
  };

const ROOT = rootPart("ChipBar");

/**
 * One row of chips. It scrolls sideways when the chips do not fit and never wraps, so the
 * content under it stays where it is.
 */
export function ChipBar(props: ChipBarProps) {
  return (
    // A group, not a fieldset: a fieldset cannot be a scrolling flex row in every browser.
    <div
      role="group"
      aria-label={props.label}
      class={classes(ROOT, chipBarClass, props.class)}
      style={props.style}
    >
      {props.children}
    </div>
  );
}
