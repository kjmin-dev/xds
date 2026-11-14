import { type SkeletonBaseProps, skeletonClass, skeletonSize } from "@acme/ui-core";

export type SkeletonProps = SkeletonBaseProps;

/**
 * Holds the place of content that is loading, in the shape the content will have. It pulses,
 * and stands still for people who ask for less motion.
 *
 * It is hidden from assistive technology: the screen that shows skeletons says that it is
 * loading, once, instead of every placeholder saying so.
 */
export function Skeleton(props: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      class={skeletonClass(props.shape)}
      style={skeletonSize({ shape: props.shape, width: props.width, height: props.height })}
    />
  );
}
