import { type ReactNode, useId } from "react";
import { Thumbnail, type ThumbnailRatio } from "./Thumbnail.tsx";

export type MediaCardProps = {
  /** `vertical` puts the thumbnail on top; `horizontal` at the start, at 40% of the width. */
  layout?: "vertical" | "horizontal";
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
  const id = useId();
  const names = [`${id}-title`, ...meta.map((_, index) => `${id}-meta-${index}`)].join(" ");
  // On a pressable card the button says all of this, so the parts are hidden from assistive
  // technology and only the action is left beside it.
  const part = onPress ? ({ "aria-hidden": true } as const) : {};
  const horizontal = layout === "horizontal";
  const text = (
    <span {...part} className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span
        id={`${id}-title`}
        className="line-clamp-2 text-acme-body-strong text-acme-text-primary"
      >
        {title}
      </span>
      {meta.map((line, index) => (
        <span
          // Two details may read the same, so they are told apart by their position.
          key={index}
          id={`${id}-meta-${index}`}
          className="truncate text-acme-detail text-acme-text-secondary"
        >
          {line}
        </span>
      ))}
    </span>
  );
  const content = (
    <div
      // Above the button, which draws the fills under it, and see-through to the pointer, so a
      // press anywhere but on the action lands on the button.
      className={`relative flex gap-3 ${horizontal ? "items-start" : "flex-col"} ${onPress ? "pointer-events-none" : ""}`}
    >
      <span {...part} className={horizontal ? "w-2/5 shrink-0" : "block"}>
        <Thumbnail
          src={src}
          alt={alt}
          {...(ratio ? { ratio } : {})}
          {...(badge ? { badge } : {})}
          {...(progress === undefined ? {} : { progress })}
        />
      </span>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {!horizontal && leading != null && (
          <span {...part} className="flex shrink-0">
            {leading}
          </span>
        )}
        {text}
        {action != null && <div className="pointer-events-auto flex shrink-0">{action}</div>}
      </div>
    </div>
  );
  if (!onPress) {
    return (
      // biome-ignore lint/a11y/useSemanticElements: a fieldset groups form controls, and sizes itself to its content, which would undo the ellipses
      <div role="group" aria-labelledby={names} className="flex flex-col">
        {content}
      </div>
    );
  }
  return (
    <div className="relative flex flex-col rounded-acme-lg p-2">
      <button
        type="button"
        onClick={onPress}
        aria-labelledby={names}
        className="absolute inset-0 cursor-pointer rounded-acme-lg transition-colors duration-(--acme-motion-duration-fast) hover:bg-acme-card-background-hover focus-visible:outline-solid focus-visible:outline-(length:--acme-focus-width) focus-visible:outline-offset-(--acme-focus-offset) focus-visible:outline-acme-border-focus active:bg-acme-card-background-pressed"
      />
      {content}
    </div>
  );
}
