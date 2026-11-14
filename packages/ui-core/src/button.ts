import type { IconName } from "@acme/tokens";
import type { IconSize } from "./icon.ts";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ControlSize = "sm" | "md" | "lg";

/** Button's props in every framework, short of its label and its press handler. */
export type ButtonBaseProps = {
  /**
   * `primary` is the one action a view is for; use it once per view. `secondary` is any other
   * action, `ghost` an action that should stay out of the way, `danger` one that destroys.
   */
  variant?: ButtonVariant;
  size?: ControlSize;
  /** An icon in front of the label. */
  iconStart?: IconName;
  /** An icon after the label. */
  iconEnd?: IconName;
  /**
   * Makes the button a toggle: given at all, its state is reported to assistive technology.
   * While `true`, a `secondary` or a `ghost` button is drawn held down and its `iconStart` is
   * filled. `primary` and `danger` keep their look and only report the state.
   */
  selected?: boolean;
  disabled?: boolean;
  /**
   * Shows a spinner and ignores presses. The label stays, and the spinner stands where
   * `iconStart` was, so the button keeps its width.
   */
  loading?: boolean;
  fullWidth?: boolean;
  type?: "button" | "submit" | "reset";
  /** Names the button for assistive technology when it has no text, such as an icon button. */
  "aria-label"?: string;
};

/** IconButton's props in every framework, short of its press handler. */
export type IconButtonBaseProps = {
  icon: IconName;
  /** The accessible name: there is no visible text. Say what pressing it does. */
  label: string;
  /** As Button's. Defaults to `ghost`, since an icon button usually stays out of the way. */
  variant?: ButtonVariant;
  size?: ControlSize;
  /**
   * Makes the button a toggle: given at all, its state is reported to assistive technology.
   * While `true`, a `secondary` or a `ghost` button is drawn held down and its icon is filled.
   */
  selected?: boolean;
  disabled?: boolean;
  /** Shows a spinner in the icon's place and ignores presses. */
  loading?: boolean;
};

/**
 * The classes of a Button, or of an IconButton with `iconButton`. Part of the look comes from
 * attributes the button carries: `disabled`, `aria-pressed`, and `aria-disabled` with
 * `data-pending` while loading.
 */
export function buttonClass(options: {
  variant: ButtonVariant;
  size: ControlSize;
  /** A Button with icons and no label: as wide as it is tall. */
  iconOnly?: boolean;
  iconButton?: boolean;
  fullWidth?: boolean;
}): string {
  const { variant, size, iconOnly = false, iconButton = false, fullWidth = false } = options;
  let classes = `button button--${variant} button--${size}`;
  if (iconButton) classes += " icon-button";
  else if (iconOnly) classes += " button--icon-only";
  if (fullWidth) classes += " button--full-width";
  return classes;
}

/**
 * Only the two quiet variants change their look when selected, and a disabled button looks
 * disabled whatever its state, so the filled icon follows the same conditions.
 */
export function isHeld(options: {
  variant: ButtonVariant;
  selected?: boolean | undefined;
  disabled?: boolean | undefined;
}): boolean {
  const { variant, selected, disabled } = options;
  return selected === true && !disabled && (variant === "secondary" || variant === "ghost");
}

/**
 * The icons of a Button. A large button has larger text, so its icons are a step larger too.
 * The box is what a spinner is centered in while it stands in for an icon.
 */
export const BUTTON_ICON = {
  sm: { size: "sm", box: "inline-flex shrink-0 items-center justify-center size-acme-icon-sm" },
  md: { size: "sm", box: "inline-flex shrink-0 items-center justify-center size-acme-icon-sm" },
  lg: { size: "md", box: "inline-flex shrink-0 items-center justify-center size-acme-icon-md" },
} as const satisfies Record<ControlSize, { size: IconSize; box: string }>;

/** The box a spinner is centered in while it stands in for an IconButton's icon. */
export const ICON_BUTTON_BOX = {
  sm: "inline-flex shrink-0 items-center justify-center size-acme-icon-sm",
  md: "inline-flex shrink-0 items-center justify-center size-acme-icon-md",
  lg: "inline-flex shrink-0 items-center justify-center size-acme-icon-lg",
} as const satisfies Record<ControlSize, string>;
