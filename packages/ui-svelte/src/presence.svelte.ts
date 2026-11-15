import { afterAnimations } from "@acme/ui-core";

/**
 * Whether an overlay is on the page: from when it opens until the exit animation that its
 * stylesheet starts on `[data-state="closed"]` has finished. Zag hides a closed part at once.
 * `parts` are the elements that animate. Call it while the component is set up.
 */
export function createPresence(
  open: () => boolean,
  parts: () => readonly (Element | undefined)[],
): () => boolean {
  let exited = $state(true);
  $effect(() => {
    if (open()) {
      exited = false;
      return;
    }
    // Opening again before the animation ends stops the wait.
    return afterAnimations(parts(), () => (exited = true));
  });
  const present = $derived(open() || !exited);
  return () => present;
}
