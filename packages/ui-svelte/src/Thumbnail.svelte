<!--
  @component
  A picture in a fixed shape, for a video, an article or a product. It fills the width it is
  given and takes its height from `ratio`, and crops the picture to fill it.
-->
<script module lang="ts">
  import type { ThumbnailBaseProps } from "@acme/ui-core";
  import type { RootProps } from "./root.ts";

  export type { ThumbnailRatio } from "@acme/ui-core";

  export type ThumbnailProps = ThumbnailBaseProps & RootProps;
</script>

<script lang="ts">
  import {
    classes,
    pictureClass,
    rootPart,
    THUMBNAIL_PARTS,
    thumbnailBadgeClass,
    thumbnailClass,
    thumbnailWatched,
  } from "@acme/ui-core";
  import Badge from "./Badge.svelte";
  import { useDefaults } from "./defaults.svelte.ts";
  import Icon from "./Icon.svelte";
  import { createPicture } from "./picture.svelte.ts";

  let {
    src,
    alt,
    ratio: ownRatio,
    badge,
    progress,
    class: className,
    style,
  }: ThumbnailProps = $props();

  const defaults = useDefaults("Thumbnail");
  const ratio = $derived(ownRatio ?? defaults().ratio);

  const picture = createPicture(() => src);
  const watched = $derived(thumbnailWatched(progress));
</script>

<span class={classes(rootPart("Thumbnail"), thumbnailClass(ratio), className)} {style}>
  <!-- The placeholder is the picture's stand-in for assistive technology too, so the description
       is on the box that always shows, not on the picture that may not. -->
  <span
    class={THUMBNAIL_PARTS.placeholder}
    role={alt ? "img" : undefined}
    aria-label={alt || undefined}
    aria-hidden={alt ? undefined : "true"}
  >
    {#if picture.loaded() !== true}
      <Icon name="image" size="lg" />
    {/if}
    {#if picture.loaded() !== false && src}
      {@const address = src}
      <img
        src={address}
        alt=""
        aria-hidden="true"
        class={pictureClass(picture.loaded() === true)}
        onload={() => picture.onLoad(address)}
        onerror={() => picture.onError(address)}
      />
    {/if}
  </span>
  {#if badge}
    <span class={thumbnailBadgeClass(watched)}><Badge tone="overlay">{badge}</Badge></span>
  {/if}
  {#if watched > 0}
    <!-- Decoration: what was watched is for the eye, and a list that needs it said says it in
         words. -->
    <span aria-hidden="true" class={THUMBNAIL_PARTS.track}>
      <span class={THUMBNAIL_PARTS.fill} style:width="{watched * 100}%"></span>
    </span>
  {/if}
</span>
