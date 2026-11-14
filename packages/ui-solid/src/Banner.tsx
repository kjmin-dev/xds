import {
  BANNER_PARTS,
  type BannerBaseProps,
  bannerClass,
  bannerIconClass,
  bannerIconPath,
  bannerRole,
} from "@acme/ui-core";
import { type Element, Show } from "solid-js";
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
  children: Element;
};

/**
 * A message about the whole view or a section of it. Each tone has its own icon shape, so the
 * tone does not depend on color. Problems (`warning`, `danger`) interrupt a screen reader;
 * `info` and `success` wait their turn.
 */
export function Banner(props: BannerProps) {
  return (
    <div role={bannerRole(props.tone)} class={bannerClass(props.tone)}>
      <svg viewBox="0 0 24 24" aria-hidden="true" class={bannerIconClass(props.tone)}>
        <path fill="currentColor" d={bannerIconPath(props.tone)} />
      </svg>
      <div class={BANNER_PARTS.body}>
        <Show when={props.title}>{(title) => <p class={BANNER_PARTS.title}>{title()}</p>}</Show>
        <div>{props.children}</div>
        <Show when={props.action}>
          {(action) => (
            <div class={BANNER_PARTS.action}>
              <Button size="sm" onPress={() => action().onPress()}>
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
            size="sm"
            onPress={() => props.onDismiss?.()}
          />
        </div>
      </Show>
    </div>
  );
}
