import { motion } from "@acme/tokens";
import { useEffect, useRef, useState } from "react";

export type ToastProps = {
  /** Whether the toast is shown. It never closes itself: this decides. */
  open: boolean;
  /** Called when the time is up and after the action. Set `open` to false in it. */
  onClose: () => void;
  message: string;
  /** One thing the person can do about the message, such as undoing it. */
  action?: { label: string; onPress: () => void };
  /** How long it stays, in milliseconds. 0 keeps it until it is closed. */
  duration?: number;
};

/**
 * A short message about what just happened, which leaves on its own. It sits at the bottom
 * center of the window, above everything else, and is announced politely without taking
 * focus. The time does not run while the pointer is over it or focus is inside it.
 *
 * Do not put the only way to do something in a toast: it is gone in a few seconds.
 */
export function Toast({
  open,
  onClose,
  message,
  action,
  duration = motion.duration.toast,
}: ToastProps) {
  const region = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const held = hovered || focused;
  // The timer must not start over because the app handed over a new function on a render.
  const close = useRef(onClose);
  close.current = onClose;

  // The region is in the top layer for as long as the component is mounted, empty or not: a
  // screen reader only announces what is added to a region it already knows.
  useEffect(() => {
    const element = region.current;
    if (!element?.showPopover) return;
    element.showPopover();
    return () => element.hidePopover();
  }, []);

  useEffect(() => {
    // A toast that closed under the pointer gets no event to say that the pointer left.
    if (!open) {
      setHovered(false);
      setFocused(false);
    }
    if (!open || held || duration <= 0) return;
    const timer = setTimeout(() => close.current(), duration);
    return () => clearTimeout(timer);
  }, [open, held, duration]);

  return (
    <div
      ref={region}
      role="status"
      // `manual`: nothing but this component shows or hides it, and it does not close other
      // popovers. The region itself is see-through to the pointer; only the toast is not. On a
      // phone the bottom inset keeps it clear of the home indicator.
      popover="manual"
      className="pointer-events-none fixed inset-x-0 top-auto bottom-0 m-0 w-full max-w-none justify-center overflow-visible border-0 bg-transparent p-4 pb-[calc(var(--acme-space-4)+env(safe-area-inset-bottom))] [&:popover-open]:flex"
    >
      {open && (
        // biome-ignore lint/a11y/noStaticElementInteractions: hover and focus only pause the timer; the action inside is a real button
        <div
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="pointer-events-auto flex max-w-acme-toast animate-[acme-toast-enter_var(--acme-motion-duration-normal)_var(--acme-motion-easing-enter)] items-center gap-4 rounded-acme-md bg-acme-toast-background px-4 py-3 text-acme-toast-text shadow-acme-raised motion-reduce:animate-none"
        >
          <span className="min-w-0 text-acme-detail">{message}</span>
          {action && (
            <button
              type="button"
              onClick={() => {
                action.onPress();
                onClose();
              }}
              // Pulled into the toast's padding, so a pressable area of the minimum size does
              // not make a one-line toast taller.
              className="-my-2 min-h-acme-target-min min-w-acme-target-min shrink-0 cursor-pointer rounded-acme-sm text-acme-label text-acme-toast-action hover:underline focus-visible:outline-solid focus-visible:outline-(length:--acme-focus-width) focus-visible:outline-offset-(--acme-focus-offset) focus-visible:outline-current"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
