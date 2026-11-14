import { afterAnimations } from "@acme/ui-core";
import { type Accessor, createEffect, createMemo, createSignal } from "solid-js";

/**
 * Whether an overlay is on the page: from when it opens until the exit animation that its
 * stylesheet starts on `[data-state="closed"]` has finished. Zag hides a closed part at once.
 * `parts` are the elements that animate.
 */
export function createPresence(
  open: Accessor<boolean>,
  parts: () => readonly (Element | undefined)[],
): Accessor<boolean> {
  const [exited, setExited] = createSignal(true);
  createEffect(open, (isOpen) => {
    if (isOpen) {
      setExited(false);
      return;
    }
    // Opening again before the animation ends stops the wait.
    return afterAnimations(parts(), () => setExited(true));
  });
  return createMemo(() => open() || !exited());
}
