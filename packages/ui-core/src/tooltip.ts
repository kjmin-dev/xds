/** Tooltip's props in every framework, short of the control it describes. */
export type TooltipBaseProps = {
  /** What the control is or does, in a word or two. */
  label: string;
  /** A key hint shown after the label, such as `⌘K`. */
  shortcut?: string;
  /** The side of the control the tooltip appears on. It flips when there is no room. */
  placement?: "top" | "bottom";
};
