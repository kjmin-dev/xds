export type SkeletonProps = {
  /**
   * `text` is one line of body text, `rect` a block such as a picture, `circle` an avatar.
   * A `rect` needs a `height`, and a `circle` one of the two lengths.
   */
  shape?: "text" | "rect" | "circle";
  /** A number is in pixels; a string is any CSS length. A `text` line fills its row without it. */
  width?: number | string;
  height?: number | string;
};

const SHAPE = {
  text: "h-(--acme-typography-body-size) w-full rounded-acme-sm",
  rect: "w-full rounded-acme-md",
  circle: "rounded-acme-full",
} as const;

/**
 * Holds the place of content that is loading, in the shape the content will have. It pulses,
 * and stands still for people who ask for less motion.
 *
 * It is hidden from assistive technology: the screen that shows skeletons says that it is
 * loading, once, instead of every placeholder saying so.
 */
export function Skeleton({ shape = "text", width, height }: SkeletonProps) {
  // A circle is as wide as it is tall, whichever of the two it was given.
  const box = shape === "circle" ? { width: width ?? height, height: height ?? width } : {};
  return (
    <span
      aria-hidden="true"
      className={`block shrink-0 animate-[acme-skeleton-pulse_var(--acme-motion-duration-pulse)_var(--acme-motion-easing-standard)_infinite] bg-acme-skeleton-background motion-reduce:animate-none ${SHAPE[shape]}`}
      style={{ width, height, ...box }}
    />
  );
}
