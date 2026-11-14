import { type BadgeBaseProps, badgeClass, badgeDotClass } from "@acme/ui-core";
import type { ReactNode } from "react";
import { Icon } from "./Icon.tsx";

export type { BadgeTone } from "@acme/ui-core";

export type BadgeProps = BadgeBaseProps & {
  children: ReactNode;
};

/**
 * A short status or category. The words carry the meaning; the color only reinforces it, so a
 * badge still reads for someone who cannot tell the tones apart. `dot` adds a small mark for
 * live states such as "connected", and `icon` a drawing in front of the words.
 */
export function Badge({ tone, dot = false, icon, children }: BadgeProps) {
  return (
    <span className={badgeClass(tone)}>
      {dot && <span aria-hidden className={badgeDotClass} />}
      {icon && <Icon name={icon} size="xs" />}
      {children}
    </span>
  );
}
