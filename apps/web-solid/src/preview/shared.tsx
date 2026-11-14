// Pieces more than one section of the design preview uses.

import { Text } from "@acme/ui-solid";
import { createSignal, type Element } from "solid-js";

/** `backgroundBase` becomes `background-base`, as in the names of the CSS variables. */
export const kebab = (name: string) =>
  name.replace(/[A-Z0-9]+/g, (match) => `-${match.toLowerCase()}`);

/** The id of a section, for `/design#buttons`. */
export const anchor = (title: string) => title.toLowerCase().replace(/[^a-z]+/g, "-");

/** A labelled row of examples. */
export function Row(props: { label: string; children: Element }) {
  return (
    <div class="flex flex-wrap items-center gap-3">
      <Text variant="detail" tone="secondary" as="span" class="w-24 shrink-0">
        {props.label}
      </Text>
      {props.children}
    </div>
  );
}

// Shown by the switch under Selection and by the one in the list under List, which are the
// same setting.
export const [notifications, setNotifications] = createSignal(true);

// The pictures are drawn here and carried in the page, so the preview works offline. Their
// colors are the pictures' own, in both color modes, which is what `overlay` is tested on.
const picture = (width: number, height: number, shapes: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${shapes}</svg>`,
  )}`;
export const PORTRAIT = picture(
  96,
  96,
  '<rect width="96" height="96" fill="peachpuff"/><circle cx="48" cy="38" r="17" fill="sienna"/><path d="M14 96c0-21 15-33 34-33s34 12 34 33z" fill="sienna"/>',
);
export const NIGHT = picture(
  320,
  160,
  '<rect width="320" height="160" fill="midnightblue"/><circle cx="250" cy="44" r="18" fill="lemonchiffon"/><path d="M0 160 90 80l60 50 50-30 120 60z" fill="black"/>',
);
export const DAY = picture(
  320,
  160,
  '<rect width="320" height="160" fill="aliceblue"/><circle cx="70" cy="46" r="20" fill="khaki"/><path d="M0 160 110 90l60 40 60-50 90 80z" fill="lightsteelblue"/>',
);
// Not a picture, so it fails to load at once and without a request.
export const BROKEN = "data:image/png;base64,AAAA";
