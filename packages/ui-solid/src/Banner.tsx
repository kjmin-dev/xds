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
import { type Element, Show } from "solid-js";
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
    children: Element;
  };

const ROOT = rootPart("Banner");

/**
 * A message about the whole view or a section of it. Each tone has its own icon shape, so the
 * tone does not depend on color. Problems (`warning`, `danger`) interrupt a screen reader;
 * `info` and `success` wait their turn.
 */
export function Banner(props: BannerProps) {
  const defaults = useDefaults("Banner");
  const tone = () => props.tone ?? defaults().tone;
  return (
    <div
      role={bannerRole(tone())}
      class={classes(ROOT, bannerClass(tone()), props.class)}
      style={props.style}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" class={bannerIconClass(tone())}>
        <path fill="currentColor" d={bannerIconPath(tone())} />
      </svg>
      <div class={BANNER_PARTS.body}>
        <Show when={props.title}>{(title) => <p class={BANNER_PARTS.title}>{title()}</p>}</Show>
        <div>{props.children}</div>
        <Show when={props.action}>
          {(action) => (
            <div class={BANNER_PARTS.action}>
              {/* Its variant is the banner's, not one the app gives its own buttons. */}
              <Button variant="secondary" size="sm" onPress={() => action().onPress()}>
                {action().label}
              </Button>
            </div>
          )}
        </Show>
      </div>
      <Show when={props.onDismiss}>
        <div class={BANNER_PARTS.dismiss}>
          <IconButton
            icon="x"
            label={props.dismissLabel ?? "Dismiss"}
            variant="ghost"
            size="sm"
            onPress={() => props.onDismiss?.()}
          />
        </div>
      </Show>
    </div>
  );
}
