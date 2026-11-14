import { icons } from "@acme/tokens";
import { type IconBaseProps, iconClass } from "@acme/ui-core";
import { For } from "solid-js";

export type IconProps = IconBaseProps & {
  class?: string;
};

/**
 * An icon from design/icons. It takes the color of the text around it. An arrow or a chevron
 * mirrors itself in a right-to-left layout when given `rtl:-scale-x-100` in `class`.
 */
export function Icon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={props.filled ? "currentColor" : "none"}
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={[iconClass(props.size), props.class]}
      role={props.label ? "img" : undefined}
      aria-label={props.label || undefined}
      aria-hidden={props.label ? undefined : "true"}
    >
      <For each={icons[props.name]}>{(path) => <path d={path} />}</For>
    </svg>
  );
}
