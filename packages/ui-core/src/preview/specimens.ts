// The sections that show the design tokens, built from the token data: a token added to
// design/tokens shows up here without a change to this file.

import { colors, type IconName, icons, radius, size, space, typography } from "@acme/tokens";
import type { IconSize } from "../icon.ts";
import type { TextVariant } from "../text.ts";
import { el, kebab, row, ui } from "./kit.ts";

/** Semantic colors by group. Component colors are shown by the components that use them. */
const COMPONENT_COLORS =
  /^(button|field|badge|banner|card|switch|checkbox|radio|segmented|avatar|progress|slider|listRow|topBar|tabBar|sheet|chip|tabs|menu|datePicker|dialog|toast|tooltip|skeleton|thumbnail|sidebar|emptyState|accordion)/;

const COLOR_GROUPS = Object.entries(
  Object.groupBy(
    Object.keys(colors.light).filter((name) => !COMPONENT_COLORS.test(name)),
    (name) => kebab(name).split("-")[0] ?? name,
  ),
);

const ICON_SIZES: IconSize[] = ["xs", "sm", "md", "lg", "xl"];
/** Icons made of closed shapes, which is what `filled` is for. */
const FILLABLE_ICONS: IconName[] = ["heart", "star", "bookmark", "thumbs-up", "bell"];

export const colorSpecimens = () =>
  COLOR_GROUPS.map(([group, names]) =>
    el(
      "div",
      { class: "flex flex-col gap-2" },
      ui.Text({ variant: "label", tone: "secondary" }, group),
      el(
        "div",
        { class: "grid grid-cols-2 gap-2 sm:grid-cols-4" },
        ...(names ?? []).map((name) =>
          el(
            "div",
            { class: "flex items-center gap-2" },
            el("span", {
              class: "size-8 shrink-0 rounded-acme-sm border border-acme-border-default",
              style: { background: `var(--acme-color-${kebab(name)})` },
            }),
            ui.Text(
              { variant: "footnote", tone: "secondary", as: "span", class: "break-all" },
              kebab(name),
            ),
          ),
        ),
      ),
    ),
  );

export const typographySpecimens = () =>
  (Object.keys(typography) as (keyof typeof typography)[]).map((name) =>
    row(
      `${kebab(name)} ${typography[name].fontSize}`,
      ui.Text(
        { variant: kebab(name) as TextVariant, as: "span" },
        "다람쥐 헌 쳇바퀴에 타고파. The quick brown fox 123",
      ),
    ),
  );

export const spaceSpecimens = () => [
  row(
    "space",
    ...Object.entries(space)
      .sort(([, a], [, b]) => a - b)
      .map(([name, px]) =>
        el(
          "span",
          { class: "flex flex-col items-center gap-1" },
          el("span", {
            class: "bg-acme-accent-default",
            style: { width: `${px}px`, height: `${px}px` },
          }),
          ui.Text({ variant: "footnote", tone: "secondary", as: "span" }, name.replace("_", ".")),
        ),
      ),
  ),
  row(
    "radius",
    ...Object.entries(radius).map(([name, px]) =>
      el(
        "span",
        {
          class: "flex size-12 items-center justify-center border border-acme-border-strong",
          style: { "border-radius": `${px}px` },
        },
        ui.Text({ variant: "footnote", tone: "secondary", as: "span" }, name),
      ),
    ),
  ),
  row(
    "control",
    ui.Text(
      { variant: "detail", tone: "secondary", as: "span" },
      "Pointer ",
      size.pointer.controlSm,
      "/",
      size.pointer.controlMd,
      "/",
      size.pointer.controlLg,
      ", touch ",
      size.touch.controlSm,
      "/",
      size.touch.controlMd,
      "/",
      size.touch.controlLg,
      ". This page uses the sizes of the input device it is viewed with.",
    ),
  ),
];

export const iconSpecimens = () => [
  el(
    "div",
    { class: "grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-3" },
    ...(Object.keys(icons) as IconName[]).map((name) =>
      el(
        "span",
        { class: "flex items-center gap-2 text-acme-text-primary" },
        ui.Icon({ name }),
        ui.Text({ variant: "detail", tone: "secondary", as: "span" }, name),
      ),
    ),
  ),
  row(
    "Sizes",
    el(
      "span",
      { class: "flex items-end gap-3 text-acme-text-primary" },
      ...ICON_SIZES.map((iconSize) =>
        ui.Icon({ name: "house", size: iconSize, label: `house, ${iconSize}` }),
      ),
    ),
  ),
  row(
    "Filled",
    el(
      "span",
      { class: "flex items-center gap-3 text-acme-text-primary" },
      ...FILLABLE_ICONS.map((name) =>
        el(
          "span",
          { class: "flex items-center gap-1" },
          ui.Icon({ name }),
          ui.Icon({ name, filled: true, label: `${name}, filled` }),
        ),
      ),
    ),
  ),
];
