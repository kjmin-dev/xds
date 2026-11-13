import { Button as HeroButton } from "@heroui/react";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon.tsx";
import { Spinner } from "./Spinner.tsx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ControlSize = "sm" | "md" | "lg";

export type ButtonProps = {
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
  onPress?: () => void;
  /** Names the button for assistive technology when it has no text, such as an icon button. */
  "aria-label"?: string;
  /** Leave it out for a button that holds only an icon, and name that one with `aria-label`. */
  children?: ReactNode;
};

// A large button has larger text, so its icons are a step larger too. The box is what a
// spinner is centered in while it stands in for an icon.
const ICON = {
  sm: { size: "sm", box: "size-acme-icon-sm" },
  md: { size: "sm", box: "size-acme-icon-sm" },
  lg: { size: "md", box: "size-acme-icon-md" },
} as const;

export function Button({
  variant = "secondary",
  size = "md",
  iconStart,
  iconEnd,
  selected,
  disabled = false,
  loading = false,
  fullWidth = false,
  type = "button",
  onPress,
  children,
  ...aria
}: ButtonProps) {
  const icon = ICON[size];
  // Only the two quiet variants change their look when selected, and a disabled button looks
  // disabled whatever its state, so the filled icon follows the same conditions.
  const held = selected === true && !disabled && (variant === "secondary" || variant === "ghost");
  const iconOnly = children == null && (iconStart !== undefined || iconEnd !== undefined);
  return (
    <HeroButton
      {...aria}
      variant={variant}
      size={size}
      type={type}
      isDisabled={disabled}
      isPending={loading}
      isIconOnly={iconOnly}
      fullWidth={fullWidth}
      {...(selected === undefined ? {} : { "aria-pressed": selected })}
      {...(onPress ? { onPress } : {})}
    >
      {loading &&
        (iconStart ? (
          <span className={`inline-flex shrink-0 items-center justify-center ${icon.box}`}>
            <Spinner size="sm" />
          </span>
        ) : (
          <Spinner size="sm" />
        ))}
      {iconStart && !loading && <Icon name={iconStart} size={icon.size} filled={held} />}
      {children}
      {iconEnd && <Icon name={iconEnd} size={icon.size} />}
    </HeroButton>
  );
}
