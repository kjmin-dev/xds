import { type SkeletonBaseProps, skeletonClass, skeletonSize } from "@acme/ui-core";

export type SkeletonProps = SkeletonBaseProps;

/**
 * Holds the place of content that is loading, in the shape the content will have. It pulses,
 * and stands still for people who ask for less motion.
 *
 * It is hidden from assistive technology: the screen that shows skeletons says that it is
 * loading, once, instead of every placeholder saying so.
 */
export function Skeleton({ shape, width, height }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={skeletonClass(shape)}
      style={skeletonSize({ shape, width, height })}
    />
  );
}
