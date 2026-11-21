<!--
  @component
  A message about the whole view or a section of it. Each tone has its own icon shape, so the tone
  does not depend on color. Problems (`warning`, `danger`) interrupt a screen reader; `info` and
  `success` wait their turn.
-->
<script module lang="ts">
  import type { BannerBaseProps } from "@acme/ui-core";
  import type { Snippet } from "svelte";
  import type { RootProps } from "./root.ts";

  export type { BannerTone } from "@acme/ui-core";

  export type BannerProps = BannerBaseProps &
    RootProps & {
      /** What the person can do about the message. Drawn under it as a small secondary button. */
      action?: { label: string; onPress: () => void };
      /**
       * Shows a close control. The banner does not hide itself: the handler decides what happens
       * to it.
       */
      onDismiss?: () => void;
      children: Snippet;
    };
</script>

<script lang="ts">
  import {
    BANNER_PARTS,
    bannerClass,
    bannerIconClass,
    bannerIconPath,
    bannerRole,
    classes,
    rootPart,
  } from "@acme/ui-core";
  import Button from "./Button.svelte";
  import { useDefaults } from "./defaults.svelte.ts";
  import IconButton from "./IconButton.svelte";

  let {
    tone: ownTone,
    title,
    dismissLabel,
    action,
    onDismiss,
    class: className,
    style,
    children,
  }: BannerProps = $props();

  const defaults = useDefaults("Banner");
  const tone = $derived(ownTone ?? defaults().tone);
</script>

<div
  role={bannerRole(tone)}
  class={classes(rootPart("Banner"), bannerClass(tone), className)}
  {style}
>
  <svg viewBox="0 0 24 24" aria-hidden="true" class={bannerIconClass(tone)}>
    <path fill="currentColor" d={bannerIconPath(tone)} />
  </svg>
  <div class={BANNER_PARTS.body}>
    {#if title}
      <p class={BANNER_PARTS.title}>{title}</p>
    {/if}
    <div>{@render children()}</div>
    {#if action}
      <div class={BANNER_PARTS.action}>
        <Button variant="secondary" size="sm" onPress={() => action.onPress()}
          >{action.label}</Button
        >
      </div>
    {/if}
  </div>
  {#if onDismiss}
    <div class={BANNER_PARTS.dismiss}>
      <IconButton
        icon="x"
        label={dismissLabel ?? "Dismiss"}
        variant="ghost"
        size="sm"
        onPress={() => onDismiss()}
      />
    </div>
  {/if}
</div>
