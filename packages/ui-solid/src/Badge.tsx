import { type BadgeBaseProps, badgeClass, badgeDotClass, classes, rootPart } from "@acme/ui-core";
import { type Element, Show } from "solid-js";
import { useDefaults } from "./Defaults.tsx";
import { Icon } from "./Icon.tsx";
import type { RootProps } from "./root.ts";

export type { BadgeTone } from "@acme/ui-core";

export type BadgeProps = BadgeBaseProps &
  RootProps & {
    children: Element;
  };

const ROOT = rootPart("Badge");

/**
 * A short status or category. The words carry the meaning; the color only reinforces it, so a
 * badge still reads for someone who cannot tell the tones apart. `dot` adds a small mark for
 * live states such as "connected", and `icon` a drawing in front of the words.
 */
export function Badge(props: BadgeProps) {
  const defaults = useDefaults("Badge");
  return (
    <span
      class={classes(ROOT, badgeClass(props.tone ?? defaults().tone), props.class)}
      style={props.style}
    >
      <Show when={props.dot}>
        <span aria-hidden="true" class={badgeDotClass} />
      </Show>
      <Show when={props.icon}>{(name) => <Icon name={name()} size="xs" />}</Show>
      {props.children}
    </span>
  );
}
