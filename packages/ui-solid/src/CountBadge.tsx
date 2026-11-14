import {
  type CountBadgeBaseProps,
  countBadgeAnchorClass,
  countBadgeClass,
  countBadgeText,
} from "@acme/ui-core";
import { children, type Element, Show } from "solid-js";

export type CountBadgeProps = CountBadgeBaseProps & {
  /** What the count belongs to: an icon, an avatar, a button. The badge sits on its corner. */
  children?: Element;
};

/**
 * A count of something waiting: unread messages, items in a cart. On its own it is laid out
 * inline; around a child it sits on the child's top end corner.
 */
export function CountBadge(props: CountBadgeProps) {
  // Read once: each read of a JSX prop creates its nodes again.
  const child = children(() => props.children);
  const badge = (onChild: boolean) => (
    <Show when={props.count > 0}>
      <span
        role={props.label ? "img" : undefined}
        aria-label={props.label || undefined}
        class={countBadgeClass(onChild)}
      >
        {countBadgeText(props.count, props.max)}
      </span>
    </Show>
  );
  return (
    <Show when={child() != null} fallback={badge(false)}>
      <span class={countBadgeAnchorClass}>
        {child()}
        {badge(true)}
      </span>
    </Show>
  );
}
