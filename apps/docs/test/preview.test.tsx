// The preview tabs of the component pages that have pictures from the real clients, checked in
// the browser as Astro renders them (render-previews.ts): the keyboard, the selection, the choice
// kept for the next page, and the picture of the site's mode.

import "../src/components/preview.css";
import { afterEach, describe, expect, inject, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { setUpPreview, STORAGE_KEY } from "../src/components/preview.ts";

const previews = inject("previews");

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
  delete document.documentElement.dataset.theme;
  localStorage.removeItem(STORAGE_KEY);
});

// Each page's pictures get addresses of their own, so that what one test fetched does not count
// for the next, and nothing comes from the browser's cache.
let visit = 0;

/** Opens a page's preview tabs as the browser meets them: the inline script, then preview.ts. */
function open(name: string) {
  visit++;
  document.body.innerHTML = (previews[name] ?? "").replaceAll("/fixture/", `/fixture/${visit}/`);
  for (const old of document.body.querySelectorAll("script")) {
    // The page's module script, which only calls setUpPreview.
    if (old.type === "module") {
      old.remove();
      continue;
    }
    // Inserted as markup, a script does not run; the parser runs it where it stands.
    const script = document.createElement("script");
    script.textContent = old.textContent;
    old.replaceWith(script);
  }
  for (const block of document.querySelectorAll<HTMLElement>("[data-preview]")) setUpPreview(block);
}

const tab = (name: string) => page.getByRole("tab", { name, exact: true });
const tabs = () => page.getByRole("tab").elements();
const selected = () =>
  tabs()
    .filter((each) => each.getAttribute("aria-selected") === "true")
    .map((each) => each.textContent);
const shown = () =>
  [...document.querySelectorAll<HTMLElement>('[role="tabpanel"]')]
    .filter((panel) => !panel.hidden)
    .map((panel) => panel.dataset.panel);

describe("tabs", () => {
  test("Live comes first and is selected, then each platform with pictures, in order", async () => {
    open("TopBar");
    await expect.element(page.getByRole("tablist", { name: "Preview" })).toBeVisible();
    expect(tabs().map((each) => each.textContent)).toEqual(["Live", "iOS", "Android", "Compose"]);
    expect(selected()).toEqual(["Live"]);
    expect(shown()).toEqual(["live"]);
    const live = page.getByRole("tabpanel", { name: "Live" });
    await expect.element(live.getByText("The live example")).toBeVisible();
  });

  test("the arrow keys, Home and End move the selection and the focus, and go round", async () => {
    open("TopBar");
    (tab("Live").element() as HTMLElement).focus();
    const steps: [string, string][] = [
      ["{ArrowRight}", "iOS"],
      ["{ArrowRight}", "Android"],
      ["{End}", "Compose"],
      ["{ArrowRight}", "Live"],
      ["{ArrowLeft}", "Compose"],
      ["{Home}", "Live"],
    ];
    for (const [key, name] of steps) {
      await userEvent.keyboard(key);
      await expect.element(tab(name)).toHaveFocus();
      await expect.element(tab(name)).toHaveAttribute("aria-selected", "true");
      expect(selected()).toEqual([name]);
      // A roving tabindex: Tab enters the row at the selected tab and leaves it after.
      expect(tabs().filter((each) => each.tabIndex === 0)).toEqual([tab(name).element()]);
      await expect.element(page.getByRole("tabpanel", { name })).toBeVisible();
    }
    await userEvent.keyboard("{End}");
    await userEvent.keyboard("{Tab}");
    await expect.element(page.getByRole("tabpanel", { name: "Compose" })).toHaveFocus();
  });

  test("the choice holds on the next page, and a page without that platform opens on Live", async () => {
    open("TopBar");
    await tab("Android").click();
    expect(selected()).toEqual(["Android"]);

    open("BottomSheet");
    expect(selected()).toEqual(["Android"]);
    expect(shown()).toEqual(["android"]);
    expect(tabs().filter((each) => each.tabIndex === 0)).toEqual([tab("Android").element()]);

    open("TabBar");
    expect(selected()).toEqual(["Live"]);
    expect(shown()).toEqual(["live"]);

    await tab("Compose").click();
    open("TopBar");
    expect(selected()).toEqual(["Compose"]);
  });

  test("without storage, a page opens on Live and its tabs still work", async () => {
    localStorage.setItem(STORAGE_KEY, "ios");
    const blocked = () => {
      throw new DOMException("The storage is turned off.", "SecurityError");
    };
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(blocked);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(blocked);
    const errors: unknown[] = [];
    const listener = (event: ErrorEvent) => errors.push(event.error);
    window.addEventListener("error", listener);
    try {
      open("TopBar");
      expect(selected()).toEqual(["Live"]);
      await tab("iOS").click();
      expect(selected()).toEqual(["iOS"]);
      expect(errors).toEqual([]);
    } finally {
      window.removeEventListener("error", listener);
    }
  });
});

describe("pictures", () => {
  const requested = (path: string) =>
    performance
      .getEntriesByType("resource")
      .some((entry) => entry.name.endsWith(`/fixture/${visit}/${path}`));
  const visibleMedia = () =>
    [...document.querySelectorAll<HTMLElement>(".capture__media")]
      .filter((media) => media.checkVisibility())
      .map((media) => `${media.tagName.toLowerCase()} ${media.dataset.mode}`);

  test("the site's mode picks the still, and the other one is not fetched", async () => {
    document.documentElement.dataset.theme = "light";
    open("TopBar");
    await tab("iOS").click();
    expect(visibleMedia()).toEqual(["img light"]);
    await expect.poll(() => requested("navigation/ios-light.webp")).toBe(true);
    expect(requested("navigation/ios-dark.webp")).toBe(false);
    // Neither still of a tab that is not open.
    expect(requested("navigation/android-light.webp")).toBe(false);

    document.documentElement.dataset.theme = "dark";
    expect(visibleMedia()).toEqual(["img dark"]);
    await expect.poll(() => requested("navigation/ios-dark.webp")).toBe(true);
    const still = page.getByRole("img", { name: "The navigation capture on ios." });
    await expect.element(still).toHaveAttribute("data-mode", "dark");
    // The size it will have, before it has loaded.
    expect((still.element() as HTMLImageElement).getBoundingClientRect().height).toBeGreaterThan(0);
  });

  test("a picture taken before the latest change says so in its caption", async () => {
    open("TopBar");
    await tab("Compose").click();
    // A figure is named by its caption.
    const caption =
      "Captured from Compose, in a Release build in the iOS 26.5 Simulator (iPhone 17 Pro), 2026-11-15. A picture of the real component, not a live example. Captured before the latest change to this component.";
    await expect.element(page.getByRole("figure", { name: caption, exact: true })).toBeVisible();
    await tab("iOS").click();
    await expect.element(page.getByRole("tabpanel", { name: "iOS" })).toBeVisible();
    expect(page.getByRole("tabpanel", { name: "iOS" }).element().textContent).not.toContain(
      "latest change",
    );
  });

  test("a clip plays only when asked, in the site's mode, and stops when its tab is left", async () => {
    // The fixture has no clips to play, so playing is taken as having started.
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    document.documentElement.dataset.theme = "light";
    open("BottomSheet");
    await tab("iOS").click();
    const button = page.getByRole("button", { name: "Play" });
    await expect.element(button).toHaveAttribute("aria-pressed", "false");
    expect(visibleMedia()).toEqual(["img light"]);
    expect(play).not.toHaveBeenCalled();
    // No poster until it plays: a browser fetches the poster of a hidden video too.
    expect(document.querySelectorAll("video[poster]")).toHaveLength(0);

    await button.click();
    await expect.element(button).toHaveAttribute("aria-pressed", "true");
    expect(visibleMedia()).toEqual(["video light"]);
    const light = document.querySelector<HTMLVideoElement>('video[data-mode="light"]');
    expect(play.mock.contexts).toEqual([light]);
    expect(light?.getAttribute("poster")).toBe(`/fixture/${visit}/sheet/ios-light.webp`);

    // The reader turns the site dark while it plays.
    document.documentElement.dataset.theme = "dark";
    await expect.poll(visibleMedia).toEqual(["video dark"]);
    const dark = document.querySelector<HTMLVideoElement>('video[data-mode="dark"]');
    expect(play.mock.contexts.at(-1)).toBe(dark);
    expect(dark?.getAttribute("poster")).toBe(`/fixture/${visit}/sheet/ios-dark.webp`);

    await button.click();
    await expect.element(button).toHaveAttribute("aria-pressed", "false");
    expect(visibleMedia()).toEqual(["img dark"]);

    await button.click();
    dark?.dispatchEvent(new Event("ended"));
    await expect.element(button).toHaveAttribute("aria-pressed", "false");

    await button.click();
    await tab("Android").click();
    await tab("iOS").click();
    await expect.element(button).toHaveAttribute("aria-pressed", "false");
    expect(visibleMedia()).toEqual(["img dark"]);
  });
});
