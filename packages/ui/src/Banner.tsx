import {
  BANNER_PARTS,
  type BannerBaseProps,
  bannerClass,
  bannerIconClass,
  bannerIconPath,
  bannerRole,
} from "@acme/ui-core";
import type { ReactNode } from "react";
import { Button } from "./Button.tsx";
import { IconButton } from "./IconButton.tsx";

export type { BannerTone } from "@acme/ui-core";

export type BannerProps = BannerBaseProps & {
  /** What the person can do about the message. Drawn under it as a small secondary button. */
  action?: { label: string; onPress: () => void };
  /**
   * Shows a close control. The banner does not hide itself: the handler decides what happens
   * to it.
   */
  onDismiss?: () => void;
  children: ReactNode;
};

/**
 * A message about the whole view or a section of it. Each tone has its own icon shape, so the
 * tone does not depend on color. Problems (`warning`, `danger`) interrupt a screen reader;
 * `info` and `success` wait their turn.
 */
export function Banner({
  tone,
  title,
  action,
  onDismiss,
  dismissLabel = "Dismiss",
  children,
}: BannerProps) {
  return (
    <div role={bannerRole(tone)} className={bannerClass(tone)}>
      <svg viewBox="0 0 24 24" aria-hidden="true" className={bannerIconClass(tone)}>
        <path fill="currentColor" d={bannerIconPath(tone)} />
      </svg>
      <div className={BANNER_PARTS.body}>
        {title && <p className={BANNER_PARTS.title}>{title}</p>}
        <div>{children}</div>
        {action && (
          <div className={BANNER_PARTS.action}>
            <Button size="sm" onPress={action.onPress}>
              {action.label}
            </Button>
          </div>
        )}
      </div>
      {onDismiss && (
        <div className={BANNER_PARTS.dismiss}>
          <IconButton icon="x" label={dismissLabel} size="sm" onPress={onDismiss} />
        </div>
      )}
    </div>
  );
}
