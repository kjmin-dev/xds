import { buttonClass, ICON_BUTTON_BOX, type IconButtonBaseProps, isHeld } from "@acme/ui-core";
import { Icon } from "./Icon.tsx";
import { Spinner } from "./Spinner.tsx";
import { useTrigger } from "./trigger.ts";

export type IconButtonProps = IconButtonBaseProps & {
  onPress?: () => void;
};

/**
 * A button that holds only an icon, in Button's variants, sizes and states. It is a square as
 * tall as a Button of its size, and its pressable area is never smaller than the minimum
 * target, even when the square is. Like Button, it opens a Menu or a Tooltip it is the trigger
 * of.
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
  const attributes = useTrigger(
    {
      className: buttonClass({ variant, size, iconButton: true }),
      disabled,
      "aria-disabled": loading || undefined,
      "data-pending": loading ? "" : undefined,
      "aria-pressed": selected,
      "aria-label": label,
      onClick: () => {
        if (!loading) onPress?.();
      },
    },
    loading,
  );
  return (
    <button {...attributes} type="button">
      {loading ? (
        <span className={ICON_BUTTON_BOX[size]}>
          <Spinner size="sm" />
        </span>
      ) : (
        <Icon name={icon} size={size} filled={isHeld({ variant, selected, disabled })} />
      )}
    </button>
  );
}
