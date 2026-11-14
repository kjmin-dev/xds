import { Button as HeroButton } from "@heroui/react";
import type { ButtonVariant, ControlSize } from "./Button.tsx";
import { Icon, type IconName } from "./Icon.tsx";
import { Spinner } from "./Spinner.tsx";

export type IconButtonProps = {
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
  onPress?: () => void;
};

// The box is what a spinner is centered in while it stands in for the icon.
const BOX = {
  sm: "size-acme-icon-sm",
  md: "size-acme-icon-md",
  lg: "size-acme-icon-lg",
} as const;

/**
 * A button that holds only an icon, in Button's variants, sizes and states. It is a square as
 * tall as a Button of its size, and its pressable area is never smaller than the minimum
 * target, even when the square is.
 */
export function IconButton({
  icon,
  label,
  variant = "ghost",
  size = "md",
  selected,
  disabled = false,
  loading = false,
  onPress,
}: IconButtonProps) {
  // The same conditions as Button's: only the two quiet variants change their look.
  const held = selected === true && !disabled && (variant === "secondary" || variant === "ghost");
  return (
    <HeroButton
      className="icon-button"
      aria-label={label}
      variant={variant}
      size={size}
      isDisabled={disabled}
      isPending={loading}
      isIconOnly
      {...(selected === undefined ? {} : { "aria-pressed": selected })}
      {...(onPress ? { onPress } : {})}
    >
      {loading ? (
        <span className={`inline-flex shrink-0 items-center justify-center ${BOX[size]}`}>
          <Spinner size="sm" />
        </span>
      ) : (
        <Icon name={icon} size={size} filled={held} />
      )}
    </HeroButton>
  );
}
