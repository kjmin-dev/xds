/**
 * Focuses a control that a press or a click has reached, unless it has the focus already,
 * without the keyboard's focus ring. The browser marks focus that a script moves with the ring,
 * as it marks keyboard focus. A control that Zag focuses from a script after a press, or that
 * must have the focus before Zag acts on its click, takes the focus here first, without it.
 */
export function focusWithoutRing(element: HTMLElement | null | undefined): void {
  if (element && document.activeElement !== element) {
    element.focus({ preventScroll: true, focusVisible: false });
  }
}
