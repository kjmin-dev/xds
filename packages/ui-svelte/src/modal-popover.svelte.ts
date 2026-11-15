import { ariaHidden } from "@zag-js/aria-hidden";
import { preventBodyScroll } from "@zag-js/remove-scroll";

/**
 * Makes an open Menu or Select list modal while `open()` is true: the rest of the page is
 * hidden from assistive technology, so a screen reader's cursor stays in the popup, where the
 * focus is held too, and the page does not scroll. The popup's underlay keeps the pointer off
 * the page. Zag does all of this around a dialog, but not around a menu or a select. Call it
 * while the component is set up.
 */
export function modalPopover(open: () => boolean, popup: () => HTMLElement | undefined): void {
  $effect(() => {
    if (!open()) return;
    const unlock = preventBodyScroll(document);
    // A frame later, once the popup is shown.
    const reveal = ariaHidden(() => [popup() ?? null], { defer: true });
    return () => {
      reveal();
      unlock();
    };
  });
}
