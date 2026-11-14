import { type ReactNode, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

// Nothing changes once the page is in the browser, so there is nothing to subscribe to.
const subscribe = () => () => {};

/**
 * Renders `children` at the end of the body, where an overlay is above the page. A page
 * rendered by a server has no body to render into, and the render that hydrates it must match
 * the server's, so there the overlay comes in the render after.
 */
export function Portal({ children }: { children: ReactNode }) {
  const client = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return client ? createPortal(children, document.body) : null;
}
