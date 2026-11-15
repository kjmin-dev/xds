// The live examples of the touch-only components, checked the way a reader meets them in the
// frame: by role, accessible name, ARIA state and the keyboard. They are React Native components
// that react-native-web draws, and what it turns their props into is what a reader gets, so a
// change on either side that loses a role, a state or the focus trap fails here.

import { colors } from "@acme/tokens";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import type { NativeDemoName } from "../src/demos/native-names.ts";
import { NativeDemo } from "../src/demos/native.tsx";

let root: Root | undefined;

afterEach(() => {
  root?.unmount();
  root = undefined;
  document.body.replaceChildren();
  delete document.documentElement.dataset.theme;
});

function mount(name: NativeDemoName) {
  const screen = document.body.appendChild(document.createElement("main"));
  // The frame's page fills the frame; here the screen fills the viewport.
  screen.style.cssText = "position: fixed; inset: 0;";
  root = createRoot(screen);
  flushSync(() => root?.render(<NativeDemo name={name} />));
}

const focused = () => document.activeElement;

describe("TopBar", () => {
  test("Tab goes to the back button, the trailing action, then the screen", async () => {
    mount("top-bar");
    await userEvent.keyboard("{Tab}");
    await expect.element(page.getByRole("button", { name: "Back" })).toHaveFocus();
    await userEvent.keyboard("{Tab}");
    await expect.element(page.getByRole("button", { name: "Edit" })).toHaveFocus();
    await userEvent.keyboard("{Tab}");
    await expect.element(page.getByRole("button", { name: "Notifications" })).toHaveFocus();
  });

  test("the title is a heading", async () => {
    mount("top-bar");
    await expect.element(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  });

  test("the colors follow the site's mode, not the system's", async () => {
    mount("top-bar");
    const title = () =>
      getComputedStyle(page.getByRole("heading", { name: "Settings" }).element()).color;
    document.documentElement.dataset.theme = "light";
    await expect.poll(title).toBe(hexToRgb(colors.light.topBarText));
    document.documentElement.dataset.theme = "dark";
    await expect.poll(title).toBe(hexToRgb(colors.dark.topBarText));
  });
});

describe("TabBar", () => {
  test("its tabs are tabs, and aria-selected follows the selection", async () => {
    mount("tab-bar");
    const home = page.getByRole("tab", { name: "Home" });
    const search = page.getByRole("tab", { name: "Search" });
    await expect.element(page.getByRole("tablist")).toBeVisible();
    await expect.element(page.getByRole("tab")).toHaveLength(3);
    await expect.element(home).toHaveAttribute("aria-selected", "true");
    await expect.element(search).toHaveAttribute("aria-selected", "false");

    await search.click();
    await expect.element(search).toHaveAttribute("aria-selected", "true");
    await expect.element(home).toHaveAttribute("aria-selected", "false");
    await expect.element(page.getByRole("heading", { name: "Search" })).toBeVisible();
  });

  test("Enter on a tab selects it", async () => {
    mount("tab-bar");
    const profile = page.getByRole("tab", { name: "Profile" });
    (profile.element() as HTMLElement).focus();
    await expect.element(profile).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect.element(profile).toHaveAttribute("aria-selected", "true");
  });

  test("it casts a shadow", async () => {
    mount("tab-bar");
    const shadow = getComputedStyle(page.getByRole("tablist").element()).boxShadow;
    // react-native-web builds a box-shadow from the shadow props only when they are in one
    // style object; split across two, it writes a shadow with no offset and no blur.
    const lengths = [...shadow.matchAll(/(-?[\d.]+)px/g)].map(([, value]) => Number(value));
    expect(shadow).not.toBe("none");
    expect(lengths.slice(0, 3).some((value) => value !== 0)).toBe(true);
  });
});

describe("BottomSheet", () => {
  test("Enter on the trigger opens a modal dialog that keeps focus inside it", async () => {
    mount("bottom-sheet");
    const share = page.getByRole("button", { name: "Share" });
    await userEvent.keyboard("{Tab}");
    await expect.element(share).toHaveFocus();
    await userEvent.keyboard("{Enter}");

    const dialog = page.getByRole("dialog");
    await expect.element(dialog).toBeVisible();
    await expect.element(dialog).toHaveAttribute("aria-modal", "true");
    await expect.element(page.getByRole("heading", { name: "Share report" })).toBeVisible();

    // More presses than the sheet has stops, so focus would have left it if it could.
    const visited = new Set<string>();
    for (let press = 0; press < 6; press++) {
      await userEvent.keyboard("{Tab}");
      await expect.poll(() => dialog.element().contains(focused())).toBe(true);
      visited.add(focused()?.getAttribute("aria-label") ?? focused()?.textContent ?? "");
    }
    expect(visited).toContain("Copy link");
  });

  test("Escape closes it, and focus goes back to the trigger", async () => {
    mount("bottom-sheet");
    const share = page.getByRole("button", { name: "Share" });
    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{Enter}");
    await expect.element(page.getByRole("dialog")).toBeVisible();

    await userEvent.keyboard("{Escape}");
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    await expect.element(share).toHaveFocus();
  });
});

/** `#rrggbb` as getComputedStyle writes it. */
function hexToRgb(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
}
