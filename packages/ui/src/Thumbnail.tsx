import { useState } from "react";
import { Badge } from "./Badge.tsx";
import { Icon } from "./Icon.tsx";

// Written out in full: Tailwind only generates the classes it can find as whole strings.
const RATIO = {
  "16:9": "aspect-video",
  "1:1": "aspect-square",
  "4:3": "aspect-[4/3]",
  "9:16": "aspect-[9/16]",
} as const;

export type ThumbnailRatio = keyof typeof RATIO;

export type ThumbnailProps = {
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

/**
 * A picture in a fixed shape, for a video, an article or a product. It fills the width it is
 * given and takes its height from `ratio`, and crops the picture to fill it.
 */
export function Thumbnail({ src, alt, ratio = "16:9", badge, progress = 0 }: ThumbnailProps) {
  // Remembered with the address it belongs to, so a new `src` starts over without an effect.
  const [picture, setPicture] = useState<{ src: string; loaded: boolean }>();
  const state = picture?.src === src ? picture : undefined;
  const watched = Math.min(1, Math.max(0, progress));
  return (
    <span
      className={`relative block w-full overflow-hidden rounded-acme-md bg-acme-thumbnail-background ${RATIO[ratio]}`}
    >
      {/* The placeholder is the picture's stand-in for assistive technology too, so the
          description is on the box that always shows, not on the picture that may not. */}
      <span
        className="absolute inset-0 flex items-center justify-center text-acme-thumbnail-icon"
        {...(alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true })}
      >
        {!state?.loaded && <Icon name="image" size="lg" />}
        {src && state?.loaded !== false && (
          <img
            src={src}
            alt=""
            aria-hidden="true"
            // Not shown until it has loaded: a picture that is half there, or broken, would
            // cover the placeholder with nothing.
            className={`absolute inset-0 size-full object-cover ${state?.loaded ? "" : "invisible"}`}
            // On a page rendered by a server the picture can be complete before React listens.
            ref={(image) => {
              if (image?.complete && image.naturalWidth > 0 && !state) {
                setPicture({ src, loaded: true });
              }
            }}
            onLoad={() => setPicture({ src, loaded: true })}
            onError={() => setPicture({ src, loaded: false })}
          />
        )}
      </span>
      {badge && (
        // Above the progress bar when there is one, with the same space between them as
        // between the badge and the edges.
        <span
          className={`absolute end-2 ${watched > 0 ? "bottom-[calc(var(--acme-space-1)+var(--acme-space-2))]" : "bottom-2"}`}
        >
          <Badge tone="overlay">{badge}</Badge>
        </span>
      )}
      {watched > 0 && (
        // Decoration: what was watched is for the eye, and a list that needs it said says it
        // in words.
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-(--acme-space-1) bg-acme-overlay-background"
        >
          <span
            className="block h-full bg-acme-overlay-accent"
            style={{ width: `${watched * 100}%` }}
          />
        </span>
      )}
    </span>
  );
}
