import { motion, space } from "@acme/tokens";
import { type TooltipBaseProps, tooltipEndSide } from "@acme/ui-core";
import { normalizeProps, useMachine } from "@zag-js/react";
import * as tooltip from "@zag-js/tooltip";
import { type ReactNode, useId, useRef } from "react";
import { Portal } from "./portal.tsx";
import { usePresence } from "./presence.ts";
import { TriggerContext, useProvideTrigger } from "./trigger.ts";

export type TooltipProps = TooltipBaseProps & {
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
    <Overlay label={label} shortcut={shortcut} placement={placement}>
      {children}
    </Overlay>
  );
}

/**
 * A Tooltip at the end edge of its control instead of above or below it: a collapsed Sidebar
 * names its icons on the side of the content, where they do not cover their neighbours. Only
 * for this package's own components: the index does not export it.
 */
export function TooltipBeside({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Overlay label={label} placement={tooltipEndSide()}>
      {children}
    </Overlay>
  );
}

function Overlay({
  label,
  shortcut,
  placement,
  children,
}: {
  label: string;
  shortcut?: string | undefined;
  placement: tooltip.Placement;
  children: ReactNode;
}) {
  const service = useMachine(tooltip.machine, {
    id: useId(),
    openDelay: motion.duration.tooltipDelay,
    closeDelay: 0,
    // It stays and follows its control when the page scrolls, for as long as the control keeps
    // focus or the pointer. Tabbing to a control out of view scrolls the page, and a tooltip
    // closed by that scroll would never show for it.
    closeOnScroll: false,
    positioning: { placement, gutter: space[1] },
  });
  const api = tooltip.connect(service, normalizeProps);
  const trigger = useProvideTrigger(api.getTriggerProps());
  const content = useRef<HTMLDivElement>(null);
  const present = usePresence(api.open, () => [content.current]);
  return (
    <>
      <TriggerContext value={trigger}>{children}</TriggerContext>
      {present && (
        <Portal>
          <TriggerContext value={null}>
            <div {...api.getPositionerProps()} className="tooltip__positioner">
              {/* Shown until its exit animation ends; Zag would hide it as it closes. */}
              <div {...api.getContentProps()} ref={content} hidden={false} className="tooltip">
                {label}
                {shortcut && <kbd className="tooltip__shortcut">{shortcut}</kbd>}
              </div>
            </div>
          </TriggerContext>
        </Portal>
      )}
    </>
  );
}
