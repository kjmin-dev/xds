import { type DialogBaseProps, leaveEscapeToFields } from "@acme/ui-core";
import { Portal } from "@solidjs/web";
import * as dialog from "@zag-js/dialog";
import { normalizeProps, useMachine } from "@zag-js/solid";
import { createMemo, createUniqueId, type Element, Show } from "solid-js";
import { createPresence } from "./presence.ts";
import { TriggerContext } from "./trigger.ts";

export type DialogProps = DialogBaseProps & {
  /** Called on Escape and on a press outside the dialog. Set `open` to false in it. */
  onClose: () => void;
  /** The body, between the description and the actions. It scrolls when it is too tall. */
  children?: Element;
  /** Buttons, in a row at the end edge. Put the main action last. */
  actions?: Element;
};

/**
 * A window that interrupts the screen for a confirmation or a short task. Everything behind it
 * is dimmed and cannot be reached until it closes.
 *
 * It is a modal dialog named by its title and described by its description. Focus moves into
 * it, stays inside it, and returns to where it was when it closes.
 */
export function Dialog(props: DialogProps) {
  const id = createUniqueId();
  let backdrop: HTMLDivElement | undefined;
  let positioner: HTMLDivElement | undefined;
  let content: HTMLElement | undefined;
  const service = useMachine(dialog.machine, () => ({
    id,
    open: props.open,
    onOpenChange: (details: dialog.OpenChangeDetails) => {
      if (!details.open) props.onClose();
    },
    closeOnEscape: props.dismissible ?? true,
    closeOnInteractOutside: props.dismissible ?? true,
    onEscapeKeyDown: leaveEscapeToFields,
    // The dialog itself, as in the React library, rather than its first field or button: a
    // screen reader then reads the title and the description first.
    initialFocusEl: () => content ?? null,
  }));
  const api = createMemo(() => dialog.connect(service, normalizeProps));
  const present = createPresence(
    () => api().open,
    () => [backdrop, positioner],
  );
  return (
    <Show when={present()}>
      <Portal>
        {/* Nothing inside opens an overlay from a control outside it. */}
        <TriggerContext value={null}>
          {/* A press on the scrim keeps the focus in the dialog, as in the React library: a
              dialog that cannot be dismissed stays open, and the focus would go to the page.
              The backdrop and the dialog stay shown until their exit animation ends; Zag
              would hide them as the dialog closes. */}
          {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- not a control: the handler only keeps the focus where it is */}
          <div
            {...api().getBackdropProps()}
            ref={(element) => (backdrop = element)}
            hidden={false}
            onMouseDown={(event) => event.preventDefault()}
            class="dialog__backdrop"
          />
          <div
            {...api().getPositionerProps()}
            ref={(element) => (positioner = element)}
            class="dialog__positioner"
          >
            <section
              {...api().getContentProps()}
              ref={(element) => (content = element)}
              hidden={false}
              class="dialog"
            >
              <h2 {...api().getTitleProps()} class="dialog__title">
                {props.title}
              </h2>
              <Show when={props.description}>
                <p {...api().getDescriptionProps()} class="dialog__description">
                  {props.description}
                </p>
              </Show>
              {/* `when` reads each slot once, and the accessor hands back those same nodes. */}
              <Show when={props.children}>
                {(body) => <div class="dialog__body">{body()}</div>}
              </Show>
              <Show when={props.actions}>
                {(actions) => <div class="dialog__actions">{actions()}</div>}
              </Show>
            </section>
          </div>
        </TriggerContext>
      </Portal>
    </Show>
  );
}
