<!--
  @component
  A thumbnail with its title and details: a video in a feed, an article in a list.

  With `onPress` the whole card is one button with no surface at rest: under a pointer and while
  pressed it takes the card's fills, and it has a focus ring. The button is named by the title
  followed by the details. `action` is a separate control beside it, so pressing it does not
  press the card.
-->
<script module lang="ts">
  import type { MediaCardBaseProps } from "@acme/ui-core";
  import type { Snippet } from "svelte";

  export type MediaCardProps = MediaCardBaseProps & {
    /** Before the text in the vertical layout, such as an Avatar. */
    leading?: Snippet;
    /** At the end of the text: an IconButton or a Menu. It stays a control of its own. */
    action?: Snippet;
    /** Makes the whole card one button. */
    onPress?: () => void;
  };
</script>

<script lang="ts">
  import {
    MEDIA_CARD_PARTS,
    mediaCardContentClass,
    mediaCardIds,
    mediaCardThumbnailClass,
  } from "@acme/ui-core";
  import Thumbnail from "./Thumbnail.svelte";

  let {
    layout,
    src,
    alt,
    ratio,
    badge,
    progress,
    title,
    meta,
    leading,
    action,
    onPress,
  }: MediaCardProps = $props();

  const id = $props.id();
  const ids = $derived(mediaCardIds(id, meta));
  const horizontal = $derived(layout === "horizontal");
  const pressable = $derived(onPress !== undefined);
  // On a pressable card the button says all of this, so the parts are hidden from assistive
  // technology and only the action is left beside it.
  const hidden = $derived(pressable ? "true" : undefined);
</script>

{#snippet content()}
  <div class={mediaCardContentClass({ horizontal, pressable })}>
    <span aria-hidden={hidden} class={mediaCardThumbnailClass(horizontal)}>
      <Thumbnail {src} alt={alt ?? ""} {ratio} {badge} {progress} />
    </span>
    <div class={MEDIA_CARD_PARTS.body}>
      {#if !horizontal && leading}
        <span aria-hidden={hidden} class={MEDIA_CARD_PARTS.leading}>{@render leading()}</span>
      {/if}
      <span aria-hidden={hidden} class={MEDIA_CARD_PARTS.text}>
        <span id={ids.title} class={MEDIA_CARD_PARTS.title}>{title}</span>
        <!-- Two details may read the same, so they are told apart by their position. -->
        {#each meta ?? [] as line, index (index)}
          <span id={ids.details[index]} class={MEDIA_CARD_PARTS.meta}>{line}</span>
        {/each}
      </span>
      {#if action}
        <div class={MEDIA_CARD_PARTS.action}>{@render action()}</div>
      {/if}
    </div>
  </div>
{/snippet}

{#if pressable}
  <div class={MEDIA_CARD_PARTS.pressable}>
    <button
      type="button"
      onclick={() => onPress?.()}
      aria-labelledby={ids.names}
      class={MEDIA_CARD_PARTS.button}
    ></button>
    {@render content()}
  </div>
{:else}
  <!-- A group, not a fieldset: a fieldset groups form controls, and sizes itself to its
       content, which would undo the ellipses. -->
  <div role="group" aria-labelledby={ids.names} class={MEDIA_CARD_PARTS.group}>
    {@render content()}
  </div>
{/if}
