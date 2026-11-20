import {
  classes,
  rootPart,
  type SkeletonBaseProps,
  skeletonClass,
  skeletonSize,
} from "@acme/ui-core";
import { useDefaults } from "./Defaults.tsx";
import { layStyle, type RootProps } from "./root.ts";

export type SkeletonProps = SkeletonBaseProps & RootProps;

const ROOT = rootPart("Skeleton");

/**
 * Holds the place of content that is loading, in the shape the content will have. It pulses,
 * and stands still for people who ask for less motion.
 *
 * It is hidden from assistive technology: the screen that shows skeletons says that it is
 * loading, once, instead of every placeholder saying so.
 */
export function Skeleton(props: SkeletonProps) {
  const defaults = useDefaults("Skeleton");
  const shape = () => props.shape ?? defaults().shape;
  return (
    <span
      aria-hidden="true"
      class={classes(ROOT, skeletonClass(shape()), props.class)}
      style={layStyle(
        skeletonSize({ shape: shape(), width: props.width, height: props.height }),
        props.style,
      )}
    />
  );
}
