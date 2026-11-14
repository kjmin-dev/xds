/** Tooltip's props in every framework, short of the control it describes. */
export type TooltipBaseProps = {
  /** What the control is or does, in a word or two. */
  label: string;
  /** A key hint shown after the label, such as `⌘K`. */
  shortcut?: string;
  /** The side of the control the tooltip appears on. It flips when there is no room. */
  placement?: "top" | "bottom";
};

/**
 * The physical side a tooltip beside its control goes on: the end edge in the page's
 * direction. Zag places by physical side. A page rendered by a server, which has no document,
 * takes the right; the tooltip only shows in the browser, which reads the direction again.
 */
export function tooltipEndSide(): "left" | "right" {
  return globalThis.document?.documentElement.dir === "rtl" ? "left" : "right";
}
