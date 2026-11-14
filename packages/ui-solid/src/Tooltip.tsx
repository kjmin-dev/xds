import { motion, space } from "@acme/tokens";
import type { TooltipBaseProps } from "@acme/ui-core";
import { Portal } from "@solidjs/web";
import { normalizeProps, useMachine } from "@zag-js/solid";
import * as tooltip from "@zag-js/tooltip";
import { createMemo, createUniqueId, type Element, Show } from "solid-js";
import { createPresence } from "./presence.ts";
import { provideTrigger, TriggerContext, type TriggerProps } from "./trigger.ts";

export type TooltipProps = TooltipBaseProps & {
  /** The control it describes: a Button or an IconButton. */
  children: Element;
};

/**
 * Names a control when the pointer rests on it or the keyboard focuses it. It appears after a
 * short wait under a pointer and at once on keyboard focus, and goes when the pointer leaves,
 * focus leaves, or Escape is pressed.
 *
 * It describes the control and is not its name: an IconButton still needs its `label`. It
 * never holds anything pressable, and touch input has no hover, so nothing may depend on it.
 */
export function Tooltip(props: TooltipProps) {
  return (
    <Overlay
      label={props.label}
      shortcut={props.shortcut}
      placement={() => props.placement ?? "top"}
    >
      {props.children}
    </Overlay>
  );
}

/**
 * A Tooltip at the end edge of its control instead of above or below it: a collapsed Sidebar
 * names its icons on the side of the content, where they do not cover their neighbours. Only
 * for this package's own components: the index does not export it.
 */
export function TooltipBeside(props: { label: string; children: Element }) {
  // Zag places by physical side, so the end edge is read from the page's direction.
  const end = () => (document.documentElement.dir === "rtl" ? "left" : "right");
  return (
    <Overlay label={props.label} placement={end}>
      {props.children}
    </Overlay>
  );
}

function Overlay(props: {
  label: string;
  shortcut?: string | undefined;
  placement: () => tooltip.Placement;
  children: Element;
}) {
  const id = createUniqueId();
  const service = useMachine(tooltip.machine, () => ({
    id,
    openDelay: motion.duration.tooltipDelay,
    closeDelay: 0,
    // It stays and follows its control when the page scrolls, for as long as the control keeps
    // focus or the pointer. Tabbing to a control out of view scrolls the page, and a tooltip
    // closed by that scroll would never show for it. The React library closes it on any scroll.
    closeOnScroll: false,
    positioning: { placement: props.placement(), gutter: space[1] },
  }));
  const api = createMemo(() => tooltip.connect(service, normalizeProps));
  const trigger = provideTrigger(() => api().getTriggerProps() as TriggerProps);
  let content: HTMLDivElement | undefined;
  const present = createPresence(
    () => api().open,
    () => [content],
  );
  return (
    <>
      <TriggerContext value={trigger}>{props.children}</TriggerContext>
      <Show when={present()}>
        <Portal>
          <TriggerContext value={null}>
            <div {...api().getPositionerProps()} class="tooltip__positioner">
              {/* Shown until its exit animation ends; Zag would hide it as it closes. */}
              <div
                {...api().getContentProps()}
                ref={(element) => (content = element)}
                hidden={false}
                class="tooltip"
              >
                {props.label}
                <Show when={props.shortcut}>
                  {(shortcut) => <kbd class="tooltip__shortcut">{shortcut()}</kbd>}
                </Show>
              </div>
            </div>
          </TriggerContext>
        </Portal>
      </Show>
    </>
  );
}
