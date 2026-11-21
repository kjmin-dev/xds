<!--
  @component
  A window that interrupts the screen for a confirmation or a short task. Everything behind it is
  dimmed and cannot be reached until it closes.

  It is a modal dialog named by its title and described by its description. Focus moves into it,
  stays inside it, and returns to where it was when it closes.
-->
<script module lang="ts">
  import type { DialogBaseProps } from "@acme/ui-core";
  import type { Snippet } from "svelte";
  import type { RootProps } from "./root.ts";

  /** Its root is the dialog itself, while it is open, not the scrim around it. */
  export type DialogProps = DialogBaseProps &
    RootProps & {
      /** Called on Escape and on a press outside the dialog. Set `open` to false in it. */
      onClose: () => void;
      /** The body, between the description and the actions. It scrolls when it is too tall. */
      children?: Snippet;
      /** Buttons, in a row at the end edge. Put the main action last. */
      actions?: Snippet;
    };
</script>

<script lang="ts">
  import { classes, leaveEscapeToFields } from "@acme/ui-core";
  import * as dialog from "@zag-js/dialog";
  import { mergeProps, normalizeProps, useMachine } from "@zag-js/svelte";
  import Portal from "./Portal.svelte";
  import { createPresence } from "./presence.svelte.ts";
  import { resetTrigger } from "./trigger.svelte.ts";

  let {
    open,
    title,
    description,
    dismissible,
    onClose,
    class: className,
    style,
    children,
    actions,
  }: DialogProps = $props();

  const id = $props.id();
  let backdrop = $state<HTMLDivElement>();
  let positioner = $state<HTMLDivElement>();
  let content = $state<HTMLElement>();
  const service = useMachine(dialog.machine, () => ({
    id,
    open,
    onOpenChange: (details: dialog.OpenChangeDetails) => {
      if (!details.open) onClose();
    },
    closeOnEscape: dismissible ?? true,
    closeOnInteractOutside: dismissible ?? true,
    onEscapeKeyDown: leaveEscapeToFields,
    // The dialog itself rather than its first field or button: a screen reader then reads the
    // title and the description first.
    initialFocusEl: () => content ?? null,
  }));
  const api = $derived(dialog.connect(service, normalizeProps));
  const present = createPresence(
    () => api.open,
    () => [backdrop, positioner],
  );
  // Nothing inside opens an overlay from a control outside it.
  resetTrigger();
</script>

{#if present()}
  <Portal>
    <!-- A press on the scrim keeps the focus in the dialog: a dialog that cannot be dismissed stays
       open, and the focus would go to the page. The backdrop and the dialog stay shown until
       their exit animation ends; Zag would hide them as the dialog closes. -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      {...api.getBackdropProps()}
      bind:this={backdrop}
      hidden={false}
      onmousedown={(event) => event.preventDefault()}
      class="acme-dialog__backdrop"
    ></div>
    <div {...api.getPositionerProps()} bind:this={positioner} class="acme-dialog__positioner">
      <section
        {...mergeProps(api.getContentProps(), { class: classes("acme-dialog", className), style })}
        bind:this={content}
        hidden={false}
      >
        <h2 {...api.getTitleProps()} class="acme-dialog__title">{title}</h2>
        {#if description}
          <p {...api.getDescriptionProps()} class="acme-dialog__description">{description}</p>
        {/if}
        {#if children}
          <div class="acme-dialog__body">{@render children()}</div>
        {/if}
        {#if actions}
          <div class="acme-dialog__actions">{@render actions()}</div>
        {/if}
      </section>
    </div>
  </Portal>
{/if}
