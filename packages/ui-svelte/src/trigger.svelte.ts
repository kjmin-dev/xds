// Menu and Tooltip take the control that opens them as a snippet, as in every web library:
// `<Menu>{#snippet trigger()}<Button>Actions</Button>{/snippet}</Menu>`, `<Tooltip label="Search">
// <IconButton … /></Tooltip>`. The overlay's machine has props for that control (its id, aria
// and event handlers), and they reach the Button or IconButton through this context, so an app
// never wires them up itself.

import { mergeProps } from "@zag-js/svelte";
import { createContext } from "svelte";

/** The props an overlay's machine has for the control that opens it. */
export type TriggerProps = Record<string, unknown>;

type Trigger = (() => TriggerProps) | null;

// Not exported from the package: only this package's controls and overlays use it.
const [getTrigger, setTrigger, hasTrigger] = createContext<Trigger>();

/** The trigger props of the overlays around the component being set up, if any. */
function outerTrigger(): Trigger {
  return hasTrigger() ? getTrigger() : null;
}

/**
 * For an overlay: gives the control it draws its trigger props, joined with those of any
 * overlay around this one. A Tooltip around a Menu's button gives the button both sets; the
 * handlers of both run. Call it while the component is set up.
 */
export function provideTrigger(own: () => TriggerProps): void {
  const outer = outerTrigger();
  const merged = $derived(mergeProps(outer?.() ?? {}, own()) as TriggerProps);
  setTrigger(() => merged);
}

/**
 * For an overlay's own content, such as a Dialog's buttons: nothing inside it opens an overlay
 * from a control outside it.
 */
export function resetTrigger(): void {
  setTrigger(null);
}

/**
 * For a control that can open an overlay: its own props, after those of the overlays it opens.
 * Its own attributes win, its own handlers run first, and its class is added to theirs. While
 * `inert` is true, as for a loading button, the overlays get none of its events and so do not
 * open. Call it while the component is set up, and spread what the result returns on the
 * element.
 */
export function withTrigger<T extends object>(own: () => T, inert?: () => boolean): () => T {
  const trigger = outerTrigger();
  const merged = $derived.by(() => {
    let overlays = trigger?.() ?? {};
    if (inert?.()) {
      overlays = Object.fromEntries(
        Object.entries(overlays).filter(([key]) => !key.startsWith("on")),
      );
    }
    return mergeProps(overlays, own()) as T;
  });
  return () => merged;
}
