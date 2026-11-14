import { Modal } from "@heroui/react";
import { type ReactNode, useId } from "react";

export type DialogProps = {
  /** Whether the dialog is shown. It never closes itself: this decides. */
  open: boolean;
  /** Called on Escape and on a press outside the dialog. Set `open` to false in it. */
  onClose: () => void;
  title: string;
  description?: string;
  /** The body, between the description and the actions. It scrolls when it is too tall. */
  children?: ReactNode;
  /** Buttons, in a row at the end edge. Put the main action last. */
  actions?: ReactNode;
  /**
   * Set it to false for a question that must be answered: Escape and a press outside then do
   * nothing, and only an action closes the dialog.
   */
  dismissible?: boolean;
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
  const describedBy = useId();
  return (
    <Modal.Backdrop
      isOpen={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      isDismissable={dismissible}
      isKeyboardDismissDisabled={!dismissible}
    >
      <Modal.Container placement="center" scroll="inside">
        <Modal.Dialog {...(description ? { "aria-describedby": describedBy } : {})}>
          <Modal.Heading>{title}</Modal.Heading>
          {description && (
            <p id={describedBy} className="text-acme-body text-acme-dialog-text">
              {description}
            </p>
          )}
          {children != null && <Modal.Body>{children}</Modal.Body>}
          {actions != null && <Modal.Footer>{actions}</Modal.Footer>}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
