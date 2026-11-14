import { type DialogBaseProps, leaveEscapeToFields } from "@acme/ui-core";
import * as dialog from "@zag-js/dialog";
import { normalizeProps, useMachine } from "@zag-js/react";
import { type ReactNode, useId, useRef } from "react";
import { Portal } from "./portal.tsx";
import { usePresence } from "./presence.ts";
import { TriggerContext } from "./trigger.ts";

export type DialogProps = DialogBaseProps & {
  /** Called on Escape and on a press outside the dialog. Set `open` to false in it. */
  onClose: () => void;
  /** The body, between the description and the actions. It scrolls when it is too tall. */
  children?: ReactNode;
  /** Buttons, in a row at the end edge. Put the main action last. */
  actions?: ReactNode;
};

/**
 * A window that interrupts the screen for a confirmation or a short task. Everything behind it
 * is dimmed and cannot be reached until it closes.
 *
 * It is a modal dialog named by its title and described by its description. Focus moves into
 * it, stays inside it, and returns to where it was when it closes.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  actions,
  dismissible = true,
}: DialogProps) {
  const backdrop = useRef<HTMLDivElement>(null);
  const positioner = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLElement>(null);
  const service = useMachine(dialog.machine, {
    id: useId(),
    open,
    onOpenChange: (details) => {
      if (!details.open) onClose();
    },
    closeOnEscape: dismissible,
    closeOnInteractOutside: dismissible,
    onEscapeKeyDown: leaveEscapeToFields,
    // The dialog itself rather than its first field or button: a screen reader then reads the
    // title and the description first.
    initialFocusEl: () => content.current,
  });
  const api = dialog.connect(service, normalizeProps);
  const present = usePresence(api.open, () => [backdrop.current, positioner.current]);
  if (!present) return null;
  return (
    <Portal>
      {/* Nothing inside opens an overlay from a control outside it. */}
      <TriggerContext value={null}>
        {/* A press on the scrim keeps the focus in the dialog: a dialog that cannot be dismissed
          stays open, and the focus would go to the page. The backdrop and the dialog stay
          shown until their exit animation ends; Zag would hide them as the dialog closes. */}
        {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- not a control: the handler only keeps the focus where it is */}
        <div
          {...api.getBackdropProps()}
          ref={backdrop}
          hidden={false}
          onMouseDown={(event) => event.preventDefault()}
          className="dialog__backdrop"
        />
        <div {...api.getPositionerProps()} ref={positioner} className="dialog__positioner">
          <section {...api.getContentProps()} ref={content} hidden={false} className="dialog">
            <h2 {...api.getTitleProps()} className="dialog__title">
              {title}
            </h2>
            {description && (
              <p {...api.getDescriptionProps()} className="dialog__description">
                {description}
              </p>
            )}
            {children != null && <div className="dialog__body">{children}</div>}
            {actions != null && <div className="dialog__actions">{actions}</div>}
          </section>
        </div>
      </TriggerContext>
    </Portal>
  );
}
