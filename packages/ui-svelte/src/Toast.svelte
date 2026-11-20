<!--
  @component
  A short message about what just happened, which leaves on its own. It sits at the bottom center
  of the window, above everything else, and is announced politely without taking focus. The time
  does not run while the pointer is over it or focus is inside it.

  Do not put the only way to do something in a toast: it is gone in a few seconds.
-->
<script module lang="ts">
  import type { ToastBaseProps } from "@acme/ui-core";
  import type { RootProps } from "./root.ts";

  /** Its root is the toast, while it is open, not the region it appears in. */
  export type ToastProps = ToastBaseProps &
    RootProps & {
      /** Called when the time is up and after the action. Set `open` to false in it. */
      onClose: () => void;
    };
</script>

<script lang="ts">
  import { motion } from "@acme/tokens";
  import { classes, rootPart, TOAST_PARTS } from "@acme/ui-core";
  import type { Attachment } from "svelte/attachments";

  let {
    open,
    message,
    action,
    duration = motion.duration.toast,
    onClose,
    class: className,
    style,
  }: ToastProps = $props();

  // The toast the pointer is over and the one focus is in. A toast that closed under the pointer
  // gets no event to say that the pointer left, so only one still in the page counts.
  let hovered = $state<Element>();
  let focused = $state<Element>();
  const inPage = (toast: Element | undefined) => toast?.isConnected === true;

  // The region is in the top layer for as long as the component is mounted, empty or not: a
  // screen reader only announces what is added to a region it already knows.
  const showRegion: Attachment<HTMLDivElement> = (region) => {
    if (!region.showPopover) return;
    region.showPopover();
    return () => region.hidePopover();
  };

  $effect(() => {
    if (!open || inPage(hovered) || inPage(focused) || duration <= 0) return;
    // `onClose` is read when the time is up, so a new function does not restart it.
    const timer = setTimeout(() => onClose(), duration);
    return () => clearTimeout(timer);
  });
</script>

<div {@attach showRegion} role="status" popover="manual" class={TOAST_PARTS.region}>
  {#if open}
    <!-- Hover and focus only pause the timer; the action inside is a real button. -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      onpointerenter={(event) => (hovered = event.currentTarget)}
      onpointerleave={() => (hovered = undefined)}
      onfocusin={(event) => (focused = event.currentTarget)}
      onfocusout={() => (focused = undefined)}
      class={classes(rootPart("Toast"), TOAST_PARTS.toast, className)}
      {style}
    >
      <span class={TOAST_PARTS.message}>{message}</span>
      {#if action}
        <button
          type="button"
          onclick={() => {
            action.onPress();
            onClose();
          }}
          class={TOAST_PARTS.action}>{action.label}</button
        >
      {/if}
    </div>
  {/if}
</div>
