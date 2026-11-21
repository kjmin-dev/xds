import { classes, dividerClass, rootPart } from "@acme/ui-core";
import type { RootProps } from "./root.ts";

export type DividerProps = RootProps;

/** A line between groups of content. Decorative lines use the low-contrast border color. */
export function Divider({ className, style }: DividerProps) {
  return <hr className={classes(rootPart("Divider"), dividerClass, className)} style={style} />;
}
