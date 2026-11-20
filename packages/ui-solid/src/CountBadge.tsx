import {
  type CountBadgeBaseProps,
  countBadgeAnchorClass,
  countBadgeClass,
  countBadgeText,
  classes,
  rootPart,
} from "@acme/ui-core";
import { children, type Element, Show } from "solid-js";
import type { RootProps } from "./root.ts";

export type CountBadgeProps = CountBadgeBaseProps &
  RootProps & {
    /** What the count belongs to: an icon, an avatar, a button. The badge sits on its corner. */
    children?: Element;
  };

const ROOT = rootPart("CountBadge");

/**
 * A count of something waiting: unread messages, items in a cart. On its own it is laid out
 * inline; around a child it sits on the child's top end corner.
 */
export function CountBadge(props: CountBadgeProps) {
  // Read once: each read of a JSX prop creates its nodes again.
  const child = children(() => props.children);
  // The root is the anchor around a child, and the badge itself without one.
  const badge = (onChild: boolean) => (
    <Show when={props.count > 0}>
      <span
        role={props.label ? "img" : undefined}
        aria-label={props.label || undefined}
        class={classes(!onChild && ROOT, countBadgeClass(onChild), !onChild && props.class)}
        style={onChild ? undefined : props.style}
      >
        {countBadgeText(props.count, props.max)}
      </span>
    </Show>
  );
  return (
    <Show when={child() != null} fallback={badge(false)}>
      <span class={classes(ROOT, countBadgeAnchorClass, props.class)} style={props.style}>
        {child()}
        {badge(true)}
      </span>
    </Show>
  );
}
