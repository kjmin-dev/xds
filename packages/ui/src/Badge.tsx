import { type BadgeBaseProps, badgeClass, badgeDotClass, classes, rootPart } from "@acme/ui-core";
import type { ReactNode } from "react";
import { useDefaults } from "./Defaults.tsx";
import { Icon } from "./Icon.tsx";
import type { RootProps } from "./root.ts";

export type { BadgeTone } from "@acme/ui-core";

export type BadgeProps = BadgeBaseProps &
  RootProps & {
    children: ReactNode;
  };

/**
 * A short status or category. The words carry the meaning; the color only reinforces it, so a
 * badge still reads for someone who cannot tell the tones apart. `dot` adds a small mark for
 * live states such as "connected", and `icon` a drawing in front of the words.
 */
export function Badge(props: BadgeProps) {
  const defaults = useDefaults("Badge");
  const { tone = defaults.tone, dot = false, icon, className, style, children } = props;
  return (
    <span className={classes(rootPart("Badge"), badgeClass(tone), className)} style={style}>
      {dot && <span aria-hidden className={badgeDotClass} />}
      {icon && <Icon name={icon} size="xs" />}
      {children}
    </span>
  );
}
