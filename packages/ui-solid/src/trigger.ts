// Menu and Tooltip take the control that opens them as an element, as the React library does:
// `<Menu trigger={<Button>Actions</Button>} />`, `<Tooltip label="Search"><IconButton /></Tooltip>`.
// The overlay's machine has props for that control (its id, aria and event handlers), and they
// reach the Button or IconButton through this context, the way React Aria hands them to
// HeroUI's Button.

import { mergeProps } from "@zag-js/solid";
import { type Accessor, createContext, useContext } from "solid-js";

/** The props an overlay's machine has for the control that opens it. */
export type TriggerProps = Record<string, unknown>;

/** Not exported from the package: only this package's controls and overlays use it. */
export const TriggerContext = createContext<Accessor<TriggerProps> | null>(null);

/**
 * For an overlay: its trigger props, joined with those of any overlay around it, to provide
 * as `<TriggerContext value={...}>` around the control. A Tooltip around a Menu's button gives
 * the button both sets; the handlers of both run.
 */
export function provideTrigger(own: Accessor<TriggerProps>): Accessor<TriggerProps> {
  const outer = useContext(TriggerContext);
  const merged = mergeProps(() => outer?.() ?? {}, own) as TriggerProps;
  return () => merged;
}

/**
 * For a control that can open an overlay: its own props, after those of the overlays it opens.
 * Its own attributes win, its own handlers run first, and its class is added to theirs, so the
 * own class must be a string. While `inert` is true, as for a loading button, the overlays get
 * none of its events and so do not open. Spread the result on the element.
 */
export function withTrigger<T extends object>(own: Accessor<T>, inert?: Accessor<boolean>): T {
  const trigger = useContext(TriggerContext);
  const overlays = () => {
    const props = trigger?.() ?? {};
    if (!inert?.()) return props;
    return Object.fromEntries(Object.entries(props).filter(([key]) => !key.startsWith("on")));
  };
  return mergeProps(overlays, own) as T;
}
