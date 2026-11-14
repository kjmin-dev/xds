import type { ThumbnailRatio } from "./thumbnail.ts";

export type MediaCardLayout = "vertical" | "horizontal";

/** MediaCard's props in every framework, short of `leading`, `action` and `onPress`. */
export type MediaCardBaseProps = {
  /** `vertical` puts the thumbnail on top; `horizontal` at the start, at 40% of the width. */
  layout?: MediaCardLayout;
  /** The picture, as a Thumbnail's. */
  src?: string | undefined;
  /** Describes the picture. Defaults to an empty string: the title already says what it is. */
  alt?: string;
  ratio?: ThumbnailRatio;
  /** Short text on the picture's bottom end corner, such as a duration. */
  badge?: string;
  /** How much was watched, from 0 to 1. */
  progress?: number;
  /** At most two lines, then an ellipsis. */
  title: string;
  /** Short details, one line each, such as a channel name and "3 days ago". */
  meta?: readonly string[];
};

/** The ids of the title and of each detail, which together name the card. */
export function mediaCardIds(id: string, meta: readonly string[] = []) {
  const title = `${id}-title`;
  const details = meta.map((_, index) => `${id}-meta-${index}`);
  return { title, details, names: [title, ...details].join(" ") };
}

/**
 * The thumbnail and the text. On a pressable card it sits above the button, which draws the
 * fills under it, and is see-through to the pointer, so a press anywhere but on the action
 * lands on the button.
 */
export function mediaCardContentClass(options: {
  horizontal: boolean;
  pressable: boolean;
}): string {
  const { horizontal, pressable } = options;
  return `relative flex gap-3 ${horizontal ? "items-start" : "flex-col"}${pressable ? " pointer-events-none" : ""}`;
}

export function mediaCardThumbnailClass(horizontal: boolean): string {
  return horizontal ? "w-2/5 shrink-0" : "block";
}

export const MEDIA_CARD_PARTS = {
  /** A card that is not pressable: a group named by its text. */
  group: "flex flex-col",
  /** A pressable card: the box around the button and the content. */
  pressable: "relative flex flex-col rounded-acme-lg p-2",
  /** Covers the whole pressable card, under the content. */
  button:
    "absolute inset-0 cursor-pointer rounded-acme-lg transition-colors duration-(--acme-motion-duration-fast) hover:bg-acme-card-background-hover focus-visible:outline-solid focus-visible:outline-(length:--acme-focus-width) focus-visible:outline-offset-(--acme-focus-offset) focus-visible:outline-acme-border-focus active:bg-acme-card-background-pressed",
  /** Beside the thumbnail, or under it: `leading`, the text and the action. */
  body: "flex min-w-0 flex-1 items-start gap-3",
  leading: "flex shrink-0",
  text: "flex min-w-0 flex-1 flex-col gap-0.5",
  title: "line-clamp-2 text-acme-body-strong text-acme-text-primary",
  meta: "truncate text-acme-detail text-acme-text-secondary",
  action: "pointer-events-auto flex shrink-0",
} as const;
