/** Dialog's props in every framework, short of `onClose`, its body and its actions. */
export type DialogBaseProps = {
  /** Whether the dialog is shown. It never closes itself: this decides. */
  open: boolean;
  title: string;
  description?: string;
  /**
   * Set it to false for a question that must be answered: Escape and a press outside then do
   * nothing, and only an action closes the dialog.
   */
  dismissible?: boolean;
};
