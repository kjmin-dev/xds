import { afterAnimations } from "@acme/ui-core";
import { computed, type ComputedRef, ref, watch } from "vue";

/**
 * Whether an overlay is on the page: from when it opens until the exit animation that its
 * stylesheet starts on `[data-state="closed"]` has finished. Zag hides a closed part at once.
 * `parts` are the elements that animate.
 */
export function usePresence(
  open: () => boolean,
  parts: () => readonly (Element | null | undefined)[],
): ComputedRef<boolean> {
  const exited = ref(!open());
  watch(
    open,
    (isOpen, _, onCleanup) => {
      if (isOpen) {
        exited.value = false;
        return;
      }
      // Opening again before the animation ends stops the wait.
      onCleanup(afterAnimations(parts(), () => (exited.value = true)));
    },
    // Once the closed state is drawn, so that the animation has started.
    { flush: "post" },
  );
  return computed(() => open() || !exited.value);
}
