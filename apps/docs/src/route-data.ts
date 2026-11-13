// Starlight makes every sidebar link a page in the "Previous" and "Next" sequence, including the
// one to the design preview, which is another site. A reader paging through the documentation
// should stay on it, so those two links skip external entries for the nearest page of this site.

// Starlight declares `locals.starlightRoute` from its main module, which the type checker does
// not otherwise see here: astro.config.mjs, which imports it, is outside the project.
/// <reference types="@astrojs/starlight" />

import { defineRouteMiddleware, type StarlightRouteData } from "@astrojs/starlight/route-data";

type Entry = StarlightRouteData["sidebar"][number];
type Link = Extract<Entry, { type: "link" }>;

const links = (entries: Entry[]): Link[] =>
  entries.flatMap((entry) => (entry.type === "group" ? links(entry.entries) : [entry]));

const isExternal = (link: Link | undefined) => link !== undefined && /^https?:\/\//.test(link.href);

export const onRequest = defineRouteMiddleware(({ locals }) => {
  const { sidebar, pagination } = locals.starlightRoute;
  if (!isExternal(pagination.prev) && !isExternal(pagination.next)) return;
  const pages = links(sidebar).filter((link) => !isExternal(link));
  const current = pages.findIndex((link) => link.isCurrent);
  if (current === -1) return;
  if (isExternal(pagination.prev)) pagination.prev = pages[current - 1];
  if (isExternal(pagination.next)) pagination.next = pages[current + 1];
});
