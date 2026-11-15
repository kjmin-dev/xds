import { ariaHidden } from "@zag-js/aria-hidden";
import { preventBodyScroll } from "@zag-js/remove-scroll";
import { watch } from "vue";

/**
 * Makes an open Menu or Select list modal while `open()` is true: the rest of the page is
 * hidden from assistive technology, so a screen reader's cursor stays in the popup, where the
 * focus is held too, and the page does not scroll. The popup's underlay keeps the pointer off
 * the page. Zag does all of this around a dialog, but not around a menu or a select.
 */
export function useModalPopover(open: () => boolean, popup: () => HTMLElement | null): void {
  watch(open, (isOpen, _, onCleanup) => {
    if (!isOpen) return;
    const unlock = preventBodyScroll(document);
    // A frame later, once the popup is shown.
    const reveal = ariaHidden(() => [popup()], { defer: true });
    onCleanup(() => {
      reveal();
      unlock();
    });
  });
}
