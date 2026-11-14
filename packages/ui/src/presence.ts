import { afterAnimations } from "@acme/ui-core";
import { useEffect, useState } from "react";

/**
 * Whether an overlay is on the page: from when it opens until the exit animation that its
 * stylesheet starts on `[data-state="closed"]` has finished. Zag hides a closed part at once.
 * `parts` returns the elements that animate; it is read once the closed state is rendered.
 */
export function usePresence(
  open: boolean,
  parts: () => readonly (Element | null | undefined)[],
): boolean {
  const [exited, setExited] = useState(!open);
  // Set while rendering, so that an overlay that opens is on the page in the same commit.
  if (open && exited) setExited(false);
  useEffect(() => {
    if (open) return;
    // Opening again before the animation ends stops the wait.
    return afterAnimations(parts(), () => setExited(true));
    // `parts` reads refs, which hold the elements of the render this effect follows.
    // oxlint-disable-next-line react/exhaustive-deps
  }, [open]);
  return open || !exited;
}
