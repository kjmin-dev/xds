// The design preview: every token group and every component in every variant and state, at
// `/design`. The React web app, the mobile app and the desktop app have the same screen. The
// sections are in ./preview, one file each, listed in ./preview/sections.ts.

import { Button, Text } from "@acme/ui-solid";
import { createSignal, For, onSettled } from "solid-js";
import { FIRST_SECTION } from "./preview/open.ts";
import { SECTIONS } from "./preview/sections.ts";
import { anchor } from "./preview/shared.tsx";

type Theme = "light" | "dark";

/** The links beside the mode switch. */
const LINKS: { label: string; href: string }[] = [{ label: "Back to the app", href: "/" }];

// With `?open=`, the sections before the overlay's are left out: see ./preview/open.ts.
const SHOWN = SECTIONS.slice(SECTIONS.findIndex((section) => section.title === FIRST_SECTION));

export function DesignPreview() {
  const [theme, setTheme] = createSignal(document.documentElement.dataset.theme as Theme);
  // The browser looks for the section an address names (`/design#buttons`) while the page loads,
  // before this screen has rendered any, and gives up; look again now that they are here.
  onSettled(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView();
  });
  const toggleTheme = () => {
    const next = theme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
  };
  return (
    <main class="mx-auto flex max-w-4xl flex-col gap-12 p-6">
      <header class="flex items-center justify-between">
        <Text variant="display" as="h1">
          Acme design system
        </Text>
        <div class="flex items-center gap-3">
          <For each={LINKS}>
            {(link) => (
              <a class="text-acme-detail text-acme-text-accent underline" href={link.href}>
                {link.label}
              </a>
            )}
          </For>
          <Button variant="ghost" size="sm" onPress={toggleTheme}>
            {theme() === "dark" ? "Light mode" : "Dark mode"}
          </Button>
        </div>
      </header>

      {/* Stays in view while the page scrolls, so any section is one press away. */}
      <nav
        aria-label="Sections"
        class="sticky top-0 z-10 -mx-6 flex gap-1 overflow-x-auto border-b border-acme-border-default bg-acme-background-base px-6 py-2"
      >
        <For each={SECTIONS}>
          {(section) => (
            <a
              href={`#${anchor(section.title)}`}
              class="rounded-full px-3 py-1 text-acme-label whitespace-nowrap text-acme-text-secondary transition-colors hover:bg-acme-control-default hover:text-acme-text-primary"
            >
              {section.title}
            </a>
          )}
        </For>
      </nav>

      <For each={SHOWN}>
        {(section) => (
          <section id={anchor(section.title)} class="flex scroll-mt-20 flex-col gap-4">
            <Text variant="title" as="h2">
              {section.title}
            </Text>
            <section.Content />
          </section>
        )}
      </For>
    </main>
  );
}
