import { EMPTY_STATE_PARTS, type EmptyStateBaseProps } from "@acme/ui-core";
import { type Element, Show } from "solid-js";
import { Icon } from "./Icon.tsx";

export type EmptyStateProps = EmptyStateBaseProps & {
  /** The one thing to do about it, usually a Button. */
  action?: Element;
};

/**
 * What a screen or a list says when it has nothing to show. It centers itself in its container,
 * also vertically when the container is a flex box with room to spare.
 */
export function EmptyState(props: EmptyStateProps) {
  return (
    <div class={EMPTY_STATE_PARTS.root}>
      <Icon name={props.icon} size="xl" class={EMPTY_STATE_PARTS.icon} />
      <p class={EMPTY_STATE_PARTS.title}>{props.title}</p>
      <Show when={props.description}>
        {(description) => <p class={EMPTY_STATE_PARTS.description}>{description()}</p>}
      </Show>
      <Show when={props.action}>
        {(action) => <div class={EMPTY_STATE_PARTS.action}>{action()}</div>}
      </Show>
    </div>
  );
}
