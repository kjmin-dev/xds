import type { CSSProperties } from "react";

/**
 * What every component takes for its root element, its outermost one, or the surface of an
 * overlay: the panel of a Dialog, a Menu, a Tooltip or a Toast. The element always has its root
 * part `acme-<name>` as well, the stable handle for an app's own styles.
 */
export type RootProps = {
  /** Classes for the root element, after the component's own. */
  className?: string;
  /** An inline style for the root element. What it sets wins over the component's own. */
  style?: CSSProperties;
};
