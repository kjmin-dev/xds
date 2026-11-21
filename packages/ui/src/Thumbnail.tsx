import {
  classes,
  pictureClass,
  rootPart,
  THUMBNAIL_PARTS,
  type ThumbnailBaseProps,
  thumbnailBadgeClass,
  thumbnailClass,
  thumbnailWatched,
} from "@acme/ui-core";
import { Badge } from "./Badge.tsx";
import { useDefaults } from "./Defaults.tsx";
import { Icon } from "./Icon.tsx";
import { usePicture } from "./picture.ts";
import type { RootProps } from "./root.ts";

export type { ThumbnailRatio } from "@acme/ui-core";

export type ThumbnailProps = ThumbnailBaseProps & RootProps;

/**
 * A picture in a fixed shape, for a video, an article or a product. It fills the width it is
 * given and takes its height from `ratio`, and crops the picture to fill it.
 */
export function Thumbnail(props: ThumbnailProps) {
  const defaults = useDefaults("Thumbnail");
  const { src, alt, ratio = defaults.ratio, badge, progress, className, style } = props;
  const picture = usePicture(src);
  const watched = thumbnailWatched(progress);
  return (
    <span
      className={classes(rootPart("Thumbnail"), thumbnailClass(ratio), className)}
      style={style}
    >
      {/* The placeholder is the picture's stand-in for assistive technology too, so the
          description is on the box that always shows, not on the picture that may not. */}
      <span
        className={THUMBNAIL_PARTS.placeholder}
        {...(alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true })}
      >
        {picture.loaded !== true && <Icon name="image" size="lg" />}
        {src && picture.loaded !== false && (
          <img
            src={src}
            alt=""
            aria-hidden="true"
            className={pictureClass(picture.loaded === true)}
            ref={picture.ref}
            onLoad={picture.onLoad}
            onError={picture.onError}
          />
        )}
      </span>
      {badge && (
        <span className={thumbnailBadgeClass(watched)}>
          <Badge tone="overlay">{badge}</Badge>
        </span>
      )}
      {watched > 0 && (
        // Decoration: what was watched is for the eye, and a list that needs it said says it
        // in words.
        <span aria-hidden="true" className={THUMBNAIL_PARTS.track}>
          <span className={THUMBNAIL_PARTS.fill} style={{ width: `${watched * 100}%` }} />
        </span>
      )}
    </span>
  );
}
