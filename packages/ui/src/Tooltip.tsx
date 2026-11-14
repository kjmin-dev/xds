import { motion, space } from "@acme/tokens";
import { Tooltip as HeroTooltip } from "@heroui/react";
import type { ReactNode } from "react";

export type TooltipProps = {
  /** What the control is or does, in a word or two. */
  label: string;
  /** A key hint shown after the label, such as `⌘K`. */
  shortcut?: string;
  /** The side of the control the tooltip appears on. It flips when there is no room. */
  placement?: "top" | "bottom";
  /** The control it describes: a Button or an IconButton. */
  children: ReactNode;
};

/**
 * Names a control when the pointer rests on it or the keyboard focuses it. It appears after a
 * short wait under a pointer and at once on keyboard focus, and goes when the pointer leaves,
 * focus leaves, or Escape is pressed.
 *
 * It describes the control and is not its name: an IconButton still needs its `label`. It
 * never holds anything pressable, and touch input has no hover, so nothing may depend on it.
 */
export function Tooltip({ label, shortcut, placement = "top", children }: TooltipProps) {
  return (
    <HeroTooltip delay={motion.duration.tooltipDelay} closeDelay={0}>
      {children}
      <HeroTooltip.Content placement={placement} offset={space[1]}>
        {label}
        {shortcut && <kbd className="tooltip__shortcut">{shortcut}</kbd>}
      </HeroTooltip.Content>
    </HeroTooltip>
  );
}

/**
 * A Tooltip at the end edge of its control instead of above or below it: a collapsed Sidebar
 * names its icons on the side of the content, where they do not cover their neighbours. Only
 * for this package's own components: the index does not export it.
 */
export function TooltipBeside({ label, children }: { label: string; children: ReactNode }) {
  return (
    <HeroTooltip delay={motion.duration.tooltipDelay} closeDelay={0}>
      {children}
      <HeroTooltip.Content placement="end" offset={space[1]}>
        {label}
      </HeroTooltip.Content>
    </HeroTooltip>
  );
}
