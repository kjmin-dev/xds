import {
  MEDIA_CARD_PARTS,
  type MediaCardBaseProps,
  mediaCardContentClass,
  mediaCardIds,
  mediaCardThumbnailClass,
} from "@acme/ui-core";
import { type ReactNode, useId } from "react";
import { Thumbnail } from "./Thumbnail.tsx";

export type MediaCardProps = MediaCardBaseProps & {
  /** Before the text in the vertical layout, such as an Avatar. */
  leading?: ReactNode;
  /** At the end of the text: an IconButton or a Menu. It stays a control of its own. */
  action?: ReactNode;
  /** Makes the whole card one button. */
  onPress?: () => void;
};

/**
 * A thumbnail with its title and details: a video in a feed, an article in a list.
 *
 * With `onPress` the whole card is one button with no surface at rest: under a pointer and
 * while pressed it takes the card's fills, and it has a focus ring. The button is named by the
 * title followed by the details. `action` is a separate control beside it, so pressing it does
 * not press the card.
 */
export function MediaCard({
  layout = "vertical",
  src,
  alt = "",
  ratio,
  badge,
  progress,
  title,
  meta = [],
  leading,
  action,
  onPress,
}: MediaCardProps) {
  const ids = mediaCardIds(useId(), meta);
  // On a pressable card the button says all of this, so the parts are hidden from assistive
  // technology and only the action is left beside it.
  const part = onPress ? ({ "aria-hidden": true } as const) : {};
  const horizontal = layout === "horizontal";
  const content = (
    <div className={mediaCardContentClass({ horizontal, pressable: onPress !== undefined })}>
      <span {...part} className={mediaCardThumbnailClass(horizontal)}>
        <Thumbnail src={src} alt={alt} ratio={ratio} badge={badge} progress={progress} />
      </span>
      <div className={MEDIA_CARD_PARTS.body}>
        {!horizontal && leading != null && (
          <span {...part} className={MEDIA_CARD_PARTS.leading}>
            {leading}
          </span>
        )}
        <span {...part} className={MEDIA_CARD_PARTS.text}>
          <span id={ids.title} className={MEDIA_CARD_PARTS.title}>
            {title}
          </span>
          {meta.map((line, index) => (
            // Two details may read the same, so they are told apart by their position.
            <span key={index} id={ids.details[index]} className={MEDIA_CARD_PARTS.meta}>
              {line}
            </span>
          ))}
        </span>
        {action != null && <div className={MEDIA_CARD_PARTS.action}>{action}</div>}
      </div>
    </div>
  );
  if (!onPress) {
    return (
      // A group, not a fieldset: a fieldset groups form controls, and sizes itself to its
      // content, which would undo the ellipses.
      <div role="group" aria-labelledby={ids.names} className={MEDIA_CARD_PARTS.group}>
        {content}
      </div>
    );
  }
  return (
    <div className={MEDIA_CARD_PARTS.pressable}>
      <button
        type="button"
        onClick={onPress}
        aria-labelledby={ids.names}
        className={MEDIA_CARD_PARTS.button}
      />
      {content}
    </div>
  );
}
