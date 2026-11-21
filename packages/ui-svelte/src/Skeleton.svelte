<!--
  @component
  Holds the place of content that is loading, in the shape the content will have. It pulses, and
  stands still for people who ask for less motion.

  It is hidden from assistive technology: the screen that shows skeletons says that it is
  loading, once, instead of every placeholder saying so.
-->
<script module lang="ts">
  import type { SkeletonBaseProps } from "@acme/ui-core";
  import type { RootProps } from "./root.ts";

  export type SkeletonProps = SkeletonBaseProps & RootProps;
</script>

<script lang="ts">
  import { classes, rootPart, skeletonClass, skeletonSize } from "@acme/ui-core";
  import { useDefaults } from "./defaults.svelte.ts";

  let { shape: ownShape, width, height, class: className, style }: SkeletonProps = $props();

  const defaults = useDefaults("Skeleton");
  const shape = $derived(ownShape ?? defaults().shape);

  const box = $derived(skeletonSize({ shape, width, height }));
</script>

<span
  aria-hidden="true"
  class={classes(rootPart("Skeleton"), skeletonClass(shape), className)}
  {style}
  style:width={box.width}
  style:height={box.height}
></span>
