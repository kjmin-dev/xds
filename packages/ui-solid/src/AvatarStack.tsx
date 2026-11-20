import {
  type AvatarStackBaseProps,
  avatarStack,
  avatarStackClass,
  avatarStackItemClass,
  avatarStackRestClass,
  classes,
  rootPart,
} from "@acme/ui-core";
import { createMemo, For, Show } from "solid-js";
import { Avatar } from "./Avatar.tsx";
import { useDefaults } from "./Defaults.tsx";
import type { RootProps } from "./root.ts";

export type AvatarStackProps = AvatarStackBaseProps & RootProps;

const ROOT = rootPart("AvatarStack");

/**
 * Several people in the room of one. Assistive technology gets one image named after
 * everyone in it, including those who did not fit.
 */
export function AvatarStack(props: AvatarStackProps) {
  const defaults = useDefaults("AvatarStack");
  // Handed to every avatar, so that an Avatar default cannot make them a size the stack is not.
  const size = () => props.size ?? defaults().size ?? "md";
  const stack = createMemo(() => avatarStack(props.people, props.max, props.label));
  return (
    <span
      role="img"
      aria-label={stack().name}
      class={classes(ROOT, avatarStackClass, props.class)}
      style={props.style}
    >
      <For each={stack().shown}>
        {(person) => (
          <span aria-hidden="true" class={avatarStackItemClass(size())}>
            <Avatar name={person.name} src={person.src} size={size()} />
          </span>
        )}
      </For>
      <Show when={stack().rest > 0}>
        <span aria-hidden="true" class={avatarStackRestClass(size())}>
          +{stack().rest}
        </span>
      </Show>
    </span>
  );
}
