export type SkeletonShape = "text" | "rect" | "circle";

/** Skeleton's props in every framework. */
export type SkeletonBaseProps = {
  /**
   * `text` is one line of body text, `rect` a block such as a picture, `circle` an avatar.
   * A `rect` needs a `height`, and a `circle` one of the two lengths.
   */
  shape?: SkeletonShape;
  /** A number is in pixels; a string is any CSS length. A `text` line fills its row without it. */
  width?: number | string;
  height?: number | string;
};

const SHAPE = {
  text: "h-(--acme-typography-body-size) w-full rounded-acme-sm",
  rect: "w-full rounded-acme-md",
  circle: "rounded-acme-full",
} as const;

// The pulse is `acme-skeleton-pulse` in the stylesheet. People who ask for less motion get a
// placeholder that stands still.
export function skeletonClass(shape: SkeletonShape = "text"): string {
  return `block shrink-0 animate-[acme-skeleton-pulse_var(--acme-motion-duration-pulse)_var(--acme-motion-easing-standard)_infinite] bg-acme-skeleton-background motion-reduce:animate-none ${SHAPE[shape]}`;
}

/**
 * The width and height to set on the placeholder, as CSS lengths. A circle is as wide as it is
 * tall, whichever of the two it was given.
 */
export function skeletonSize(options: SkeletonBaseProps): { width?: string; height?: string } {
  const width = cssLength(options.width);
  const height = cssLength(options.height);
  const box =
    options.shape === "circle"
      ? { width: width ?? height, height: height ?? width }
      : { width, height };
  const size: { width?: string; height?: string } = {};
  if (box.width !== undefined) size.width = box.width;
  if (box.height !== undefined) size.height = box.height;
  return size;
}

// React adds `px` to a number in a style; other frameworks set the bare number, which the
// browser ignores.
function cssLength(value: number | string | undefined): string | undefined {
  return typeof value === "number" ? `${value}px` : value;
}
