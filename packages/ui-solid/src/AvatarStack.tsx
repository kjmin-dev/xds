import {
  type AvatarStackBaseProps,
  avatarStack,
  avatarStackClass,
  avatarStackItemClass,
  avatarStackRestClass,
} from "@acme/ui-core";
import { createMemo, For, Show } from "solid-js";
import { Avatar } from "./Avatar.tsx";

export type AvatarStackProps = AvatarStackBaseProps;

/**
 * Several people in the room of one. Assistive technology gets one image named after
 * everyone in it, including those who did not fit.
 */
export function AvatarStack(props: AvatarStackProps) {
  const stack = createMemo(() => avatarStack(props.people, props.max, props.label));
  return (
    <span role="img" aria-label={stack().name} class={avatarStackClass}>
      <For each={stack().shown}>
        {(person) => (
          <span aria-hidden="true" class={avatarStackItemClass(props.size)}>
            <Avatar name={person.name} src={person.src} size={props.size} />
          </span>
        )}
      </For>
      <Show when={stack().rest > 0}>
        <span aria-hidden="true" class={avatarStackRestClass(props.size)}>
          +{stack().rest}
        </span>
      </Show>
    </span>
  );
}
