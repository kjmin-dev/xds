// WCAG 2 contrast checks, run on every token build so an unreadable pairing cannot be committed.

import { MODES, type Mode, type Model, type Rgba } from "./model.ts";

type Pair = {
  foreground: string;
  background: string;
  /** Minimum contrast ratio: 4.5 for body text, 3 for large text and interface parts. */
  minimum: number;
  /**
   * Opaque colors to composite a translucent background over. A surface that sits on arbitrary
   * content has to hold up over both extremes: `over: [WHITE, BLACK]`.
   */
  over?: Rgba[];
};

const WHITE: Rgba = { r: 255, g: 255, b: 255, a: 1 };
const BLACK: Rgba = { r: 0, g: 0, b: 0, a: 1 };

/** Body text needs 4.5:1 (WCAG 1.4.3); interface parts and focus rings need 3:1 (1.4.11). */
const TEXT = 4.5;
const PART = 3;

const SURFACES = ["background.base", "background.surface", "background.raised"];
const STATES = ["default", "hover", "pressed"];
const STATUSES = ["danger", "success", "warning", "info"];

const on = (foreground: string, backgrounds: string[], minimum: number): Pair[] =>
  backgrounds.map((background) => ({ foreground, background, minimum }));

const PAIRS: Pair[] = [
  ...["text.primary", "text.secondary", "text.accent"].flatMap((text) => on(text, SURFACES, TEXT)),
  ...on(
    "text.on-accent",
    STATES.map((state) => `accent.${state}`),
    TEXT,
  ),
  ...on(
    "text.on-danger",
    STATES.map((state) => `danger.${state}`),
    TEXT,
  ),
  ...on(
    "text.primary",
    STATES.map((state) => `control.${state}`),
    TEXT,
  ),
  // Tertiary text is for the page and for surfaces on it, not for raised surfaces.
  ...on("text.tertiary", ["background.base", "background.surface"], TEXT),
  ...on("text.accent", ["accent.subtle"], TEXT),
  ...on("text.primary", ["accent.subtle", "accent.subtle-hover", "accent.subtle-pressed"], TEXT),
  // Secondary text reads on a selected surface at rest and under a pointer, not while pressed.
  ...on("text.secondary", ["accent.subtle", "accent.subtle-hover"], TEXT),
  ...on("text.on-inverse", ["background.inverse"], TEXT),
  // The overlay sits on pictures, so it has to carry its text over the lightest and the darkest.
  {
    foreground: "overlay.text",
    background: "overlay.background",
    minimum: TEXT,
    over: [WHITE, BLACK],
  },
  {
    foreground: "overlay.accent",
    background: "overlay.background",
    minimum: PART,
    over: [WHITE, BLACK],
  },
  ...STATUSES.flatMap((status) =>
    on(`status.${status}`, [...SURFACES, `status.${status}-subtle`], TEXT),
  ),
  ...on("border.strong", SURFACES, PART),
  ...on("border.focus", SURFACES, PART),
  ...on("accent.default", SURFACES, PART),

  // Components: the pairings a component actually draws, whatever they alias today.
  ...["primary", "secondary", "danger"].flatMap((variant) =>
    on(
      `button.${variant}.text`,
      ["background", "background-hover", "background-pressed"].map(
        (state) => `button.${variant}.${state}`,
      ),
      TEXT,
    ),
  ),
  ...on(
    "button.ghost.text",
    [...SURFACES, "button.ghost.background-hover", "button.ghost.background-pressed"],
    TEXT,
  ),
  ...on(
    "button.selected.text",
    ["background", "background-hover", "background-pressed"].map(
      (state) => `button.selected.${state}`,
    ),
    TEXT,
  ),
  // The outline is what tells a selected button from a tinted one without relying on hue.
  ...on("button.selected.border", ["button.selected.background", ...SURFACES], PART),
  ...on("field.text", ["field.background"], TEXT),
  ...on("field.placeholder", ["field.background"], TEXT),
  ...["border", "border-focus", "border-invalid"].flatMap((border) =>
    on(`field.${border}`, ["field.background"], PART),
  ),
  ...["neutral", "accent", "success", "warning", "danger"].flatMap((tone) =>
    on(`badge.${tone}.text`, [`badge.${tone}.background`], TEXT),
  ),
  {
    foreground: "badge.overlay.text",
    background: "badge.overlay.background",
    minimum: TEXT,
    over: [WHITE, BLACK],
  },
  ...on("badge.count.text", ["badge.count.background"], TEXT),
  ...STATUSES.flatMap((tone) => [
    ...on("banner.text", [`banner.${tone}.background`], TEXT),
    ...on(`banner.${tone}.accent`, [`banner.${tone}.background`], PART),
  ]),

  // A switch and a checkbox have to be visible when off, and their state has to be readable.
  ...on("switch.track", SURFACES, PART),
  ...on("switch.track-on", SURFACES, PART),
  ...on("switch.thumb", ["switch.track", "switch.track-on"], PART),
  ...on("checkbox.border", SURFACES, PART),
  ...on("checkbox.background-checked", SURFACES, PART),
  ...on("checkbox.mark", ["checkbox.background-checked"], PART),
  ...on("radio.border", SURFACES, PART),
  ...on("radio.border-checked", SURFACES, PART),
  ...on("radio.dot", SURFACES, PART),
  // A slider's value shows in the fill against the track, and its thumb by its outline.
  ...on("slider.fill", ["slider.track", ...SURFACES], PART),
  ...on("slider.thumb-border", ["slider.track", "slider.thumb", ...SURFACES], PART),
  ...on("thumbnail.icon", ["thumbnail.background"], PART),
  ...on("sidebar.section-title", ["sidebar.background"], TEXT),
  ...["text.primary", "text.secondary"].flatMap((text) => on(text, ["sidebar.background"], TEXT)),
  ...on("empty-state.icon", SURFACES, PART),
  ...["text.primary", "text.secondary"].flatMap((text) =>
    on(text, ["accordion.header-background-hover", "accordion.header-background-pressed"], TEXT),
  ),
  ...on(
    "accordion.icon",
    [...SURFACES, "accordion.header-background-hover", "accordion.header-background-pressed"],
    PART,
  ),
  ...on("segmented.text", ["segmented.track"], TEXT),
  ...on("segmented.selected-text", ["segmented.selected-background"], TEXT),
  ...on("avatar.text", ["avatar.background"], TEXT),
  ...on("avatar.overflow-text", ["avatar.overflow-background"], TEXT),
  ...on("progress.fill", ["progress.track"], PART),
  ...["text.primary", "text.secondary"].flatMap((text) =>
    on(
      text,
      [
        "list-row.background-hover",
        "list-row.background-pressed",
        "list-row.background-selected",
        "list-row.background-selected-hover",
        "card.background-hover",
        "card.background-pressed",
      ],
      TEXT,
    ),
  ),
  ...on("card.border-selected", SURFACES, PART),
  // A media card keeps its own action, usually a ghost icon button, on the card's hover fills.
  ...on("button.ghost.text", ["card.background-hover", "card.background-pressed"], TEXT),
  ...on("chip.text", ["chip.background", "chip.background-hover", "chip.background-pressed"], TEXT),
  ...on(
    "chip.selected-text",
    [
      "chip.selected-background",
      "chip.selected-background-hover",
      "chip.selected-background-pressed",
    ],
    TEXT,
  ),
  ...on("chip.selected-border", ["chip.selected-background", ...SURFACES], PART),
  ...["tabs.text", "tabs.text-hover", "tabs.text-selected"].flatMap((text) =>
    on(text, SURFACES, TEXT),
  ),
  ...on("tabs.indicator", SURFACES, PART),
  // A select option can carry a description in secondary text.
  ...["menu.text", "text.secondary"].flatMap((text) =>
    on(
      text,
      ["menu.background", "menu.item-background-hover", "menu.item-background-pressed"],
      TEXT,
    ),
  ),
  ...on(
    "menu.icon",
    ["menu.background", "menu.item-background-hover", "menu.item-background-pressed"],
    PART,
  ),
  ...on("menu.danger-text", ["menu.background", "menu.danger-background-hover"], TEXT),
  // On touch a menu is a bottom sheet, so its rows sit on the sheet's surface.
  ...on("menu.text", ["sheet.background"], TEXT),
  ...on("menu.danger-text", ["sheet.background"], TEXT),
  ...on("menu.icon", ["sheet.background"], PART),
  // The clear control of a search field is a ghost button inside the field.
  ...on("button.ghost.text", ["field.background"], TEXT),
  ...on("dialog.title", ["dialog.background"], TEXT),
  ...on("dialog.text", ["dialog.background"], TEXT),
  // A dialog's actions are buttons on its surface; the ghost one has no fill of its own.
  ...on("button.ghost.text", ["dialog.background"], TEXT),
  ...on("field.border", ["dialog.background"], PART),
  ...on("toast.text", ["toast.background"], TEXT),
  ...on("toast.action", ["toast.background"], TEXT),
  ...on("tooltip.text", ["tooltip.background"], TEXT),
  // A banner's dismiss control is a ghost button, and its action a secondary one, on the tint.
  ...on(
    "button.ghost.text",
    STATUSES.map((tone) => `banner.${tone}.background`),
    TEXT,
  ),
  ...on("top-bar.text", ["top-bar.background"], TEXT),
  ...on("top-bar.action", ["top-bar.background"], TEXT),
  ...on("top-bar.action", ["top-bar.action-background"], PART),
  ...on("tab-bar.text-selected", ["tab-bar.selected-background"], TEXT),
  ...on("tab-bar.text", ["tab-bar.background"], TEXT),
  ...on("tab-bar.text-selected", ["tab-bar.background"], TEXT),
  ...on("sheet.handle", ["sheet.background"], PART),
  ...["text.primary", "text.secondary"].flatMap((text) => on(text, ["sheet.background"], TEXT)),
];

function composite(top: Rgba, bottom: Rgba): Rgba {
  const mix = (a: number, b: number) => a * top.a + b * (1 - top.a);
  return { r: mix(top.r, bottom.r), g: mix(top.g, bottom.g), b: mix(top.b, bottom.b), a: 1 };
}

function luminance({ r, g, b }: Rgba): number {
  const linear = (channel: number) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

export function contrastRatio(foreground: Rgba, background: Rgba): number {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort(
    (a, b) => b - a,
  ) as [number, number];
  return (lighter + 0.05) / (darker + 0.05);
}

/** Returns one message per failing pair. An empty list means every pair passes. */
export function checkContrast(model: Model): string[] {
  const byPath = new Map(model.colors.map((token) => [token.path.join("."), token]));
  const color = (path: string, mode: Mode): Rgba => {
    const token = byPath.get(path);
    if (!token) throw new Error(`contrast check refers to the unknown color "${path}"`);
    return token[mode];
  };

  const failures: string[] = [];
  for (const pair of PAIRS) {
    for (const mode of MODES) {
      for (const backdrop of pair.over ?? [WHITE]) {
        const background = composite(color(pair.background, mode), backdrop);
        const foreground = composite(color(pair.foreground, mode), background);
        const ratio = contrastRatio(foreground, background);
        if (ratio < pair.minimum) {
          const where = pair.over ? ` over rgb(${backdrop.r} ${backdrop.g} ${backdrop.b})` : "";
          failures.push(
            `${pair.foreground} on ${pair.background}${where} (${mode}): ` +
              `${ratio.toFixed(2)}:1, needs ${pair.minimum}:1`,
          );
        }
      }
    }
  }
  return failures;
}
