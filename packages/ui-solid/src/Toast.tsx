import { motion } from "@acme/tokens";
import { TOAST_PARTS, type ToastBaseProps } from "@acme/ui-core";
import { createEffect, createSignal, onSettled, Show } from "solid-js";

export type ToastProps = ToastBaseProps & {
  /** Called when the time is up and after the action. Set `open` to false in it. */
  onClose: () => void;
};

/**
 * A short message about what just happened, which leaves on its own. It sits at the bottom
 * center of the window, above everything else, and is announced politely without taking
 * focus. The time does not run while the pointer is over it or focus is inside it.
 *
 * Do not put the only way to do something in a toast: it is gone in a few seconds.
 */
export function Toast(props: ToastProps) {
  let region!: HTMLDivElement;
  // The toast the pointer is over and the one focus is in. A toast that closed under the
  // pointer gets no event to say that the pointer left, so only one still in the page counts.
  const [hovered, setHovered] = createSignal<Element>();
  const [focused, setFocused] = createSignal<Element>();
  const inPage = (toast: Element | undefined) => toast?.isConnected === true;

  // The region is in the top layer for as long as the component is mounted, empty or not: a
  // screen reader only announces what is added to a region it already knows.
  onSettled(() => {
    if (!region.showPopover) return;
    region.showPopover();
    return () => region.hidePopover();
  });

  createEffect(
    () => ({
      open: props.open,
      held: inPage(hovered()) || inPage(focused()),
      duration: props.duration ?? motion.duration.toast,
    }),
    ({ open, held, duration }) => {
      if (!open || held || duration <= 0) return;
      // `props.onClose` is read when the time is up, so a new function does not restart it.
      const timer = setTimeout(() => props.onClose(), duration);
      return () => clearTimeout(timer);
    },
  );

  return (
    <div
      ref={(element) => (region = element)}
      role="status"
      popover="manual"
      class={TOAST_PARTS.region}
    >
      <Show when={props.open}>
        {/* Hover and focus only pause the timer; the action inside is a real button. */}
        <div
          onPointerEnter={(event) => setHovered(event.currentTarget)}
          onPointerLeave={() => setHovered(undefined)}
          onFocusIn={(event) => setFocused(event.currentTarget)}
          onFocusOut={() => setFocused(undefined)}
          class={TOAST_PARTS.toast}
        >
          <span class={TOAST_PARTS.message}>{props.message}</span>
          <Show when={props.action}>
            {(action) => (
              <button
                type="button"
                onClick={() => {
                  action().onPress();
                  props.onClose();
                }}
                class={TOAST_PARTS.action}
              >
                {action().label}
              </button>
            )}
          </Show>
        </div>
      </Show>
    </div>
  );
}
