import { dividerClass } from "@acme/ui-core";

/** A line between groups of content. Decorative lines use the low-contrast border color. */
export function Divider() {
  return <hr className={dividerClass} />;
}
