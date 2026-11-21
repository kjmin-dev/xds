import { classes, dividerClass, rootPart } from "@acme/ui-core";
import type { RootProps } from "./root.ts";

export type DividerProps = RootProps;

const ROOT = rootPart("Divider");

/** A line between groups of content. Decorative lines use the low-contrast border color. */
export function Divider(props: DividerProps) {
  return <hr class={classes(ROOT, dividerClass, props.class)} style={props.style} />;
}
