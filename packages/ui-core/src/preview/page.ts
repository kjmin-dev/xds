// What the design preview does with its address, the same in every web app. `?theme=` is read
// earlier, by the inline script of each app's index.html, so that the first paint is already
// in the right mode; the preview starts from the data-theme it set.

import type { SectionTitle } from "./design.ts";

/** The overlays `?open=` can name. */
export type Overlay = "menu" | "select" | "datepicker" | "tooltip" | "dialog" | "toast";

/**
 * The overlays `?open=` shows as soon as the page loads, so that they can be captured without
 * a hand on the page. A menu, a select's list, a date picker's calendar and a tooltip open
 * beside their control, so for those the page starts at the control's section: a capture of
 * the top of the page then has the overlay in it, and focusing the control does not scroll the
 * page. The scripted mode works that control the way a person would: `press` clicks the
 * section's first button, or its first element that matches `control`, and `focus` gives it
 * keyboard focus. A dialog and a toast start open instead. The section is named by its title,
 * so renaming a section without changing it here is a type error.
 */
export const OVERLAYS: {
  readonly [O in Overlay]: {
    readonly section: SectionTitle | undefined;
    readonly press: "click" | "focus" | undefined;
    readonly control?: string;
  };
} = {
  menu: { section: "Menu", press: "click" },
  select: { section: "Controls", press: "click" },
  // The first date picker's field, after the section's selects.
  datepicker: { section: "Controls", press: "click", control: ".date-picker__trigger" },
  tooltip: { section: "Buttons", press: "focus" },
  dialog: { section: undefined, press: undefined },
  toast: { section: undefined, press: undefined },
};

/** The overlay `?open=` names in `search`, if any. */
export function overlayParam(search: string): Overlay | undefined {
  const open = new URLSearchParams(search).get("open");
  return open !== null && open in OVERLAYS ? (open as Overlay) : undefined;
}

/** The id of a section, for `/design#text-fields`. */
export const anchor = (title: string) => title.toLowerCase().replace(/[^a-z]+/g, "-");

/**
 * The browser looks for the section an address names (`/design#buttons`) while the page loads,
 * before the preview has drawn any, and gives up. This looks again once they are there.
 */
export function scrollToHash(): void {
  const id = decodeURIComponent(location.hash.slice(1));
  if (id) document.getElementById(id)?.scrollIntoView();
}

/**
 * Works the control `?open=` names once the page is drawn, and returns what cancels it. In the
 * frame after the first, once the machines behind the controls have started.
 */
export function openOnLoad(overlay: Overlay | undefined): (() => void) | undefined {
  const target = overlay && OVERLAYS[overlay];
  const section = target?.section && document.getElementById(anchor(target.section));
  const control = section?.querySelector<HTMLElement>(target?.control ?? "button");
  if (!control) return undefined;
  const frame = requestAnimationFrame(() => {
    if (target?.press === "focus") {
      // A tooltip shows on keyboard focus only, which is told by a key pressed before it.
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
      control.focus();
    } else control.click();
  });
  return () => cancelAnimationFrame(frame);
}
