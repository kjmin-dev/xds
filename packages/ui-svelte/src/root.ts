/**
 * Layer 7 of the library's customization: what an app adds to a component's root element, the
 * one with its root part (`acme-<name>`). For an overlay that is its surface: the menu, the
 * tooltip, the dialog or the toast, while it is open.
 */
export type RootProps = {
  /** Classes added to the root element's own. */
  class?: string;
  /** Inline style for the root element. */
  style?: string;
};
