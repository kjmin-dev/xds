import { motion } from "@acme/tokens";
import { TOAST_PARTS, type ToastBaseProps } from "@acme/ui-core";
import { useEffect, useRef, useState } from "react";

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
    <div ref={region} role="status" popover="manual" className={TOAST_PARTS.region}>
      {open && (
        // No role: hover and focus only pause the timer, and the action inside is a real button.
        <div
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={TOAST_PARTS.toast}
        >
          <span className={TOAST_PARTS.message}>{message}</span>
          {action && (
            <button
              type="button"
              onClick={() => {
                action.onPress();
                onClose();
              }}
              className={TOAST_PARTS.action}
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
