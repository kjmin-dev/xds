import { type ChipBarBaseProps, chipBarClass } from "@acme/ui-core";
import type { Element } from "solid-js";

export type ChipBarProps = ChipBarBaseProps & {
  /** The chips. Which of them are selected is the app's business: the bar holds no state. */
  children: Element;
};

/**
 * One row of chips. It scrolls sideways when the chips do not fit and never wraps, so the
 * content under it stays where it is.
 */
export function ChipBar(props: ChipBarProps) {
  return (
    // A group, not a fieldset: a fieldset cannot be a scrolling flex row in every browser.
    <div role="group" aria-label={props.label} class={chipBarClass}>
      {props.children}
    </div>
  );
}
