import {
  pictureClass,
  THUMBNAIL_PARTS,
  type ThumbnailBaseProps,
  thumbnailBadgeClass,
  thumbnailClass,
  thumbnailWatched,
} from "@acme/ui-core";
import { Show } from "solid-js";
import { Badge } from "./Badge.tsx";
import { Icon } from "./Icon.tsx";
import { createPicture } from "./picture.ts";

export type { ThumbnailRatio } from "@acme/ui-core";

export type ThumbnailProps = ThumbnailBaseProps;

/**
 * A picture in a fixed shape, for a video, an article or a product. It fills the width it is
 * given and takes its height from `ratio`, and crops the picture to fill it.
 */
export function Thumbnail(props: ThumbnailProps) {
  const picture = createPicture(() => props.src);
  const watched = () => thumbnailWatched(props.progress);
  return (
    <span class={thumbnailClass(props.ratio)}>
      {/* The placeholder is the picture's stand-in for assistive technology too, so the
          description is on the box that always shows, not on the picture that may not. */}
      <span
        class={THUMBNAIL_PARTS.placeholder}
        role={props.alt ? "img" : undefined}
        aria-label={props.alt || undefined}
        aria-hidden={props.alt ? undefined : "true"}
      >
        <Show when={picture.loaded() !== true}>
          <Icon name="image" size="lg" />
        </Show>
        <Show when={picture.loaded() !== false && props.src}>
          {(src) => (
            <img
              src={src()}
              alt=""
              aria-hidden="true"
              class={pictureClass(picture.loaded() === true)}
              onLoad={() => picture.onLoad(src())}
              onError={() => picture.onError(src())}
            />
          )}
        </Show>
      </span>
      <Show when={props.badge}>
        {(badge) => (
          <span class={thumbnailBadgeClass(watched())}>
            <Badge tone="overlay">{badge()}</Badge>
          </span>
        )}
      </Show>
      <Show when={watched() > 0}>
        {/* Decoration: what was watched is for the eye, and a list that needs it said says it
            in words. */}
        <span aria-hidden="true" class={THUMBNAIL_PARTS.track}>
          <span class={THUMBNAIL_PARTS.fill} style={{ width: `${watched() * 100}%` }} />
        </span>
      </Show>
    </span>
  );
}
