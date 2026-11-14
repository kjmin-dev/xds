/** One thing the person can do about a toast's message, such as undoing it. */
export type ToastAction = { label: string; onPress: () => void };

/** Toast's props in every framework, short of `onClose`. */
export type ToastBaseProps = {
  /** Whether the toast is shown. It never closes itself: this decides. */
  open: boolean;
  message: string;
  /** One thing the person can do about the message, such as undoing it. */
  action?: ToastAction;
  /** How long it stays, in milliseconds. 0 keeps it until it is closed. */
  duration?: number;
};

export const TOAST_PARTS = {
  // `manual` popover: nothing but the component shows or hides it, and it does not close other
  // popovers. The region itself is see-through to the pointer; only the toast is not. On a
  // phone the bottom inset keeps it clear of the home indicator.
  region:
    "pointer-events-none fixed inset-x-0 top-auto bottom-0 m-0 w-full max-w-none justify-center overflow-visible border-0 bg-transparent p-4 pb-[calc(var(--acme-space-4)+env(safe-area-inset-bottom))] [&:popover-open]:flex",
  toast:
    "pointer-events-auto flex max-w-acme-toast animate-[acme-toast-enter_var(--acme-motion-duration-normal)_var(--acme-motion-easing-enter)] items-center gap-4 rounded-acme-md bg-acme-toast-background px-4 py-3 text-acme-toast-text shadow-acme-raised motion-reduce:animate-none",
  message: "min-w-0 text-acme-detail",
  // Pulled into the toast's padding, so a pressable area of the minimum size does not make a
  // one-line toast taller.
  action:
    "-my-2 min-h-acme-target-min min-w-acme-target-min shrink-0 cursor-pointer rounded-acme-sm text-acme-label text-acme-toast-action hover:underline focus-visible:outline-solid focus-visible:outline-(length:--acme-focus-width) focus-visible:outline-offset-(--acme-focus-offset) focus-visible:outline-current",
} as const;
