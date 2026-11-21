import {
  BANNER_PARTS,
  type BannerBaseProps,
  bannerClass,
  bannerIconClass,
  bannerIconPath,
  bannerRole,
  classes,
  rootPart,
} from "@acme/ui-core";
import type { ReactNode } from "react";
import { Button } from "./Button.tsx";
import { useDefaults } from "./Defaults.tsx";
import { IconButton } from "./IconButton.tsx";
import type { RootProps } from "./root.ts";

export type { BannerTone } from "@acme/ui-core";

export type BannerProps = BannerBaseProps &
  RootProps & {
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
export function Banner(props: BannerProps) {
  const defaults = useDefaults("Banner");
  const {
    tone = defaults.tone,
    title,
    action,
    onDismiss,
    dismissLabel = "Dismiss",
    className,
    style,
    children,
  } = props;
  return (
    <div
      role={bannerRole(tone)}
      className={classes(rootPart("Banner"), bannerClass(tone), className)}
      style={style}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className={bannerIconClass(tone)}>
        <path fill="currentColor" d={bannerIconPath(tone)} />
      </svg>
      <div className={BANNER_PARTS.body}>
        {title && <p className={BANNER_PARTS.title}>{title}</p>}
        <div>{children}</div>
        {/* Its controls name their variant and size: a Button or IconButton default that the
            app sets is for the app's own controls, not for the parts of a banner. */}
        {action && (
          <div className={BANNER_PARTS.action}>
            <Button variant="secondary" size="sm" onPress={action.onPress}>
              {action.label}
            </Button>
          </div>
        )}
      </div>
      {onDismiss && (
        <div className={BANNER_PARTS.dismiss}>
          <IconButton icon="x" label={dismissLabel} variant="ghost" size="sm" onPress={onDismiss} />
        </div>
      )}
    </div>
  );
}
