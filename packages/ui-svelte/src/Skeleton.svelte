<!--
  @component
  Holds the place of content that is loading, in the shape the content will have. It pulses, and
  stands still for people who ask for less motion.

  It is hidden from assistive technology: the screen that shows skeletons says that it is
  loading, once, instead of every placeholder saying so.
-->
<script module lang="ts">
  import type { SkeletonBaseProps } from "@acme/ui-core";

  export type SkeletonProps = SkeletonBaseProps;
</script>

<script lang="ts">
  import { skeletonClass, skeletonSize } from "@acme/ui-core";

  let { shape, width, height }: SkeletonProps = $props();

  const box = $derived(skeletonSize({ shape, width, height }));
</script>

<span
  aria-hidden="true"
  class={skeletonClass(shape)}
  style:width={box.width}
  style:height={box.height}
></span>
