<!--
  @component
  A message about the whole view or a section of it. Each tone has its own icon shape, so the tone
  does not depend on color. Problems (`warning`, `danger`) interrupt a screen reader; `info` and
  `success` wait their turn.
-->
<script module lang="ts">
  import type { BannerBaseProps } from "@acme/ui-core";
  import type { Snippet } from "svelte";

  export type { BannerTone } from "@acme/ui-core";

  export type BannerProps = BannerBaseProps & {
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
  } from "@acme/ui-core";
  import Button from "./Button.svelte";
  import IconButton from "./IconButton.svelte";

  let { tone, title, dismissLabel, action, onDismiss, children }: BannerProps = $props();
</script>

<div role={bannerRole(tone)} class={bannerClass(tone)}>
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
        <Button size="sm" onPress={() => action.onPress()}>{action.label}</Button>
      </div>
    {/if}
  </div>
  {#if onDismiss}
    <div class={BANNER_PARTS.dismiss}>
      <IconButton
        icon="x"
        label={dismissLabel ?? "Dismiss"}
        size="sm"
        onPress={() => onDismiss()}
      />
    </div>
  {/if}
</div>
