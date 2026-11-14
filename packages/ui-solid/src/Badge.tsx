import { type BadgeBaseProps, badgeClass, badgeDotClass } from "@acme/ui-core";
import { type Element, Show } from "solid-js";
import { Icon } from "./Icon.tsx";

export type { BadgeTone } from "@acme/ui-core";

export type BadgeProps = BadgeBaseProps & {
  children: Element;
};

/**
 * A short status or category. The words carry the meaning; the color only reinforces it, so a
 * badge still reads for someone who cannot tell the tones apart. `dot` adds a small mark for
 * live states such as "connected", and `icon` a drawing in front of the words.
 */
export function Badge(props: BadgeProps) {
  return (
    <span class={badgeClass(props.tone)}>
      <Show when={props.dot}>
        <span aria-hidden="true" class={badgeDotClass} />
      </Show>
      <Show when={props.icon}>{(name) => <Icon name={name()} size="xs" />}</Show>
      {props.children}
    </span>
  );
}
