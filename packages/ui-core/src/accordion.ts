import { afterAnimations } from "./animation.ts";

/** An item of an Accordion in every framework, short of its body. */
export type AccordionItemBase<Value extends string = string> = {
  value: Value;
  title: string;
  /** A line under the title, shown whether the item is open or not. */
  description?: string;
};

/** Accordion's props in every framework, short of its items and `onChange`. */
export type AccordionBaseProps<Value extends string = string> = {
  /** The values of the open items. */
  expanded: readonly Value[];
  /** Lets several items be open at once. Without it, opening one closes the others. */
  multiple?: boolean;
};

export const ACCORDION_PARTS = {
  /** The title and the description, beside the chevron. */
  text: "flex min-w-0 flex-1 flex-col gap-0.5",
  title: "text-acme-body-strong text-acme-text-primary",
  description: "text-acme-detail text-acme-text-secondary",
  // The trigger is a `group`; the chevron turns over while it is expanded.
  chevron:
    "text-acme-accordion-icon transition-transform duration-(--acme-motion-duration-normal) ease-(--acme-motion-easing-standard) group-aria-expanded:rotate-180 motion-reduce:transition-none",
} as const;

/**
 * Opens or closes an item's panel (`.accordion__panel`), as the React library does: its height
 * moves between zero and the height of what it holds, and it is hidden only once it has
 * finished closing, with `hidden="until-found"`, so the browser's find in page still opens it.
 * Call it on every change of `open`, with `animate` false the first time, when there is
 * nothing to move from. Returns the function that stops the change from settling: call it
 * before the next change, which takes over.
 */
export function setPanelOpen(panel: HTMLElement, open: boolean, animate: boolean): () => void {
  const height = (value: string) => panel.style.setProperty("--accordion-panel-height", value);
  if (!animate) {
    if (open) panel.removeAttribute("hidden");
    else panel.setAttribute("hidden", "until-found");
    height(open ? "auto" : "0px");
    return () => {};
  }
  if (open) {
    panel.removeAttribute("hidden");
    height(`${panel.scrollHeight}px`);
    return afterAnimations([panel], () => height("auto"));
  }
  height(`${panel.scrollHeight}px`);
  // Computes the style now, so the change to zero starts a transition.
  void getComputedStyle(panel).height;
  height("0px");
  return afterAnimations([panel], () => panel.setAttribute("hidden", "until-found"));
}
