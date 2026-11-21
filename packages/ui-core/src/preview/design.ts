// The design preview of every web app, at `/design`: every token group and every component in
// every variant and state. The mobile app has the same screen at `/design`, and the desktop app
// opens it with `acme --design`.

import { type DesignState, el, screen, ui } from "./kit.ts";
import type { Child, Screen } from "./model.ts";
import { anchor, openOnLoad, type Overlay, OVERLAYS, overlayParam, scrollToHash } from "./page.ts";
import {
  accordion,
  badges,
  banners,
  buttons,
  card,
  chips,
  controls,
  dialog,
  emptyState,
  list,
  media,
  menu,
  selection,
  sidebar,
  skeleton,
  tabs,
  textFields,
  toast,
} from "./sections.ts";
import { colorSpecimens, iconSpecimens, spaceSpecimens, typographySpecimens } from "./specimens.ts";

type Content = (open: Overlay | undefined) => readonly Child<DesignState>[];

// The titles keep their literal types here, so that page.ts can only name a section that exists.
const sections = [
  ["Colors", colorSpecimens],
  ["Typography", typographySpecimens],
  ["Space, radius, size", spaceSpecimens],
  ["Icons", iconSpecimens],
  ["Buttons", buttons],
  ["Text fields", textFields],
  ["Selection", selection],
  ["Controls", controls],
  ["Chips", chips],
  ["Tabs", tabs],
  ["Badges", badges],
  ["Banners", banners],
  ["Card", card],
  ["Media", media],
  ["List", list],
  ["Sidebar", sidebar],
  ["Accordion", accordion],
  ["Menu", menu],
  ["Dialog", dialog],
  ["Toast", toast],
  ["Skeleton", skeleton],
  ["Empty state", emptyState],
] as const satisfies readonly (readonly [string, Content])[];

/** The title of a section, which `?open=` names in page.ts. */
export type SectionTitle = (typeof sections)[number][0];

/** The sections in order, by title. Each title is also the section's anchor: `#text-fields`. */
export const SECTIONS: readonly (readonly [title: SectionTitle, content: Content])[] = sections;

export type DesignPreviewOptions = {
  /** More links beside the mode switch, after the one back to the app. */
  links?: readonly { label: string; href: string }[];
  /** The query of the page's address, which `?open=` is read from. */
  search?: string;
};

export function designPreview(options: DesignPreviewOptions = {}): Screen {
  const open = overlayParam(options.search ?? location.search);
  const links = [{ label: "Back to the app", href: "/" }, ...(options.links ?? [])];
  // With `?open=` for an overlay beside its control, the page starts at the control's section.
  const first = SECTIONS.findIndex(([title]) => title === (open && OVERLAYS[open].section));
  const shown = SECTIONS.slice(Math.max(first, 0));
  const state: DesignState = {
    theme: document.documentElement.dataset.theme,
    liked: true,
    saved: true,
    pinned: true,
    email: "",
    query: "",
    secret: "correct horse",
    revealed: false,
    notes:
      "Ship the weekly report on Monday.\nAsk Grace about the numbers for March.\nBook the room.\nSend the agenda.",
    bio: "Writes programs for machines that do not exist yet.",
    search: "",
    submitted: "",
    notifications: true,
    agreed: true,
    view: "week",
    delivery: "standard",
    shirt: undefined,
    plan: "team",
    country: undefined,
    timeZone: undefined,
    volume: 60,
    fontSize: 16,
    dueDate: "2026-03-10",
    startDate: undefined,
    stay: { start: "2026-03-10", end: "2026-03-14" },
    leave: undefined,
    filters: ["open", "review"],
    page: "overview",
    dismissed: false,
    picked: true,
    opened: "Nothing opened yet.",
    place: "messages",
    question: ["seats"],
    preferences: ["notifications", "language"],
    chosen: "Nothing chosen yet.",
    density: "comfortable",
    confirming: open === "dialog",
    asking: false,
    copyName: "Weekly report, my copy",
    toast: open === "toast",
    deleted: open === "toast",
  };
  const page = el(
    "main",
    { class: "acme-preview mx-auto flex max-w-4xl flex-col gap-12 p-6" },
    el(
      "header",
      { class: "flex items-center justify-between" },
      ui.Text({ variant: "display", as: "h1" }, "Acme design system"),
      el(
        "div",
        { class: "flex items-center gap-3" },
        ...links.map(({ label, href }) =>
          el("a", { class: "text-acme-detail text-acme-text-accent underline", href }, label),
        ),
        ui.Button(
          {
            variant: "ghost",
            size: "sm",
            onPress: ({ theme }) => {
              const next = theme === "dark" ? "light" : "dark";
              document.documentElement.dataset.theme = next;
              return { theme: next };
            },
          },
          ({ theme }) => (theme === "dark" ? "Light mode" : "Dark mode"),
        ),
      ),
    ),
    // Stays in view while the page scrolls, so any section is one press away.
    el(
      "nav",
      {
        "aria-label": "Sections",
        class:
          "sticky top-0 z-10 -mx-6 flex gap-1 overflow-x-auto border-b border-acme-border-default bg-acme-background-base px-6 py-2",
      },
      ...SECTIONS.map(([title]) =>
        el(
          "a",
          {
            href: `#${anchor(title)}`,
            class:
              "rounded-full px-3 py-1 text-acme-label whitespace-nowrap text-acme-text-secondary transition-colors hover:bg-acme-control-default hover:text-acme-text-primary",
          },
          title,
        ),
      ),
    ),
    ...shown.map(([title, content]) =>
      el(
        "section",
        { id: anchor(title), class: "flex scroll-mt-20 flex-col gap-4" },
        ui.Text({ variant: "title", as: "h2" }, title),
        ...content(open),
      ),
    ),
  );
  return screen(state, page, () => {
    scrollToHash();
    return openOnLoad(open);
  });
}
