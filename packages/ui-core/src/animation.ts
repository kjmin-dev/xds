/**
 * Calls `done` once the animations and transitions running on the elements themselves have
 * finished, or in a microtask when none is running, as under reduced motion. An overlay marked
 * closed leaves the page this way only after its exit animation, which the stylesheet starts
 * on `[data-state="closed"]`, and an accordion panel is hidden only once it has closed.
 *
 * Returns the function that stops waiting: call it when the next change takes over, since the
 * animation it cuts short counts as finished.
 */
export function afterAnimations(
  elements: readonly (Element | null | undefined)[],
  done: () => void,
): () => void {
  let waiting = true;
  // Reading the animations computes the style, so one the last change started is among them.
  const running = elements.flatMap((element) => element?.getAnimations() ?? []);
  void Promise.allSettled(running.map((animation) => animation.finished)).then(() => {
    if (waiting) done();
  });
  return () => {
    waiting = false;
  };
}
