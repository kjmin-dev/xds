// `?open=menu`, `?open=select`, `?open=dialog`, `?open=toast` or `?open=tooltip` shows that
// overlay as soon as the page loads, so that it can be captured without a hand on the page. A
// menu, a select's list and a tooltip open beside their control, so for those the page starts
// at that control's section, and the tooltip's row moves to the top of it: a capture of the top
// of the page then has the overlay in it, and focusing the control does not scroll the page.

import { onSettled } from "solid-js";

export type Overlay = "menu" | "select" | "dialog" | "toast" | "tooltip";

/** The overlay named by `?open=`, if any. A dialog's or a toast's section starts open with it. */
export const OPEN = new URLSearchParams(location.search).get("open") as Overlay | null;

/** The title of the first section the page shows. */
export const FIRST_SECTION =
  OPEN === "menu"
    ? "Menu"
    : OPEN === "select"
      ? "Controls"
      : OPEN === "tooltip"
        ? "Buttons"
        : "Colors";

/**
 * Call it in a section's body. When the page was opened with `?open=<overlay>`, it works the
 * first button inside `container` the way a person would, once the section is on the page: a
 * press for a menu and a select's list, keyboard focus for a tooltip.
 */
export function openOnLoad(
  overlay: "menu" | "select" | "tooltip",
  container: () => HTMLElement | undefined,
): void {
  onSettled(() => {
    if (OPEN !== overlay) return;
    const control = container()?.querySelector("button");
    if (!control) return;
    if (overlay === "tooltip") {
      // Zag shows a tooltip on keyboard focus only, which it tells by a key pressed before the
      // focus, and only once its machine has started, in the frame after the first.
      const frame = requestAnimationFrame(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
        control.focus();
      });
      return () => cancelAnimationFrame(frame);
    }
    // A press in the frame after the first lets the machine finish setting up.
    const frame = requestAnimationFrame(() => control.click());
    return () => cancelAnimationFrame(frame);
  });
}
