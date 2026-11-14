// Written out in full: Tailwind only generates the classes it can find as whole strings.
const RATIO = {
  "16:9": "aspect-video",
  "1:1": "aspect-square",
  "4:3": "aspect-[4/3]",
  "9:16": "aspect-[9/16]",
} as const;

export type ThumbnailRatio = keyof typeof RATIO;

/** Thumbnail's props in every framework. */
export type ThumbnailBaseProps = {
  /** The URL of the picture. While it loads, when it fails and without one, a placeholder shows. */
  src?: string | undefined;
  /** Describes the picture. An empty string makes it decoration, skipped by screen readers. */
  alt: string;
  /** Width to height. Defaults to `16:9`. */
  ratio?: ThumbnailRatio;
  /** Short text on the bottom end corner, such as a duration. */
  badge?: string;
  /** How much was watched, from 0 to 1, as a bar across the bottom edge. 0 draws none. */
  progress?: number;
};

export function thumbnailClass(ratio: ThumbnailRatio = "16:9"): string {
  return `relative block w-full overflow-hidden rounded-acme-md bg-acme-thumbnail-background ${RATIO[ratio]}`;
}

/** The share of the progress bar that is filled, from 0 to 1. */
export function thumbnailWatched(progress = 0): number {
  return Math.min(1, Math.max(0, progress));
}

/** Where the badge sits: above the progress bar when there is one. */
export function thumbnailBadgeClass(watched: number): string {
  // With the same space between the badge and the bar as between the badge and the edges.
  return watched > 0
    ? "absolute end-2 bottom-[calc(var(--acme-space-1)+var(--acme-space-2))]"
    : "absolute end-2 bottom-2";
}

export const THUMBNAIL_PARTS = {
  /** The box that always shows: the icon, and the picture over it. */
  placeholder: "absolute inset-0 flex items-center justify-center text-acme-thumbnail-icon",
  track: "absolute inset-x-0 bottom-0 h-(--acme-space-1) bg-acme-overlay-background",
  /** Takes its width from the progress, as a percentage. */
  fill: "block h-full bg-acme-overlay-accent",
} as const;
