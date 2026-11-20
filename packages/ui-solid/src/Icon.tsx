import { icons } from "@acme/tokens";
import { classes, type IconBaseProps, iconClass, rootPart } from "@acme/ui-core";
import { For } from "solid-js";
import { useDefaults } from "./Defaults.tsx";
import type { RootProps } from "./root.ts";

export type IconProps = IconBaseProps & RootProps;

const ROOT = rootPart("Icon");

/**
 * An icon from design/icons. It takes the color of the text around it. An arrow or a chevron
 * mirrors itself in a right-to-left layout when given `rtl:-scale-x-100` in `class`.
 */
export function Icon(props: IconProps) {
  const defaults = useDefaults("Icon");
  return (
    <svg
      viewBox="0 0 24 24"
      fill={props.filled ? "currentColor" : "none"}
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={classes(ROOT, iconClass(props.size ?? defaults().size), props.class)}
      style={props.style}
      role={props.label ? "img" : undefined}
      aria-label={props.label || undefined}
      aria-hidden={props.label ? undefined : "true"}
    >
      <For each={icons[props.name]}>{(path) => <path d={path} />}</For>
    </svg>
  );
}
