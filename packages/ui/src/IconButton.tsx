import {
  buttonClass,
  classes,
  ICON_BUTTON_BOX,
  type IconButtonBaseProps,
  isHeld,
} from "@acme/ui-core";
import { useDefaults } from "./Defaults.tsx";
import { Icon } from "./Icon.tsx";
import type { RootProps } from "./root.ts";
import { Spinner } from "./Spinner.tsx";
import { useTrigger } from "./trigger.ts";

export type IconButtonProps = IconButtonBaseProps &
  RootProps & {
    onPress?: () => void;
  };

/**
 * A button that holds only an icon, in Button's variants, sizes and states. It is a square as
 * tall as a Button of its size, and its pressable area is never smaller than the minimum
 * target, even when the square is. Like Button, it opens a Menu or a Tooltip it is the trigger
 * of.
 */
export function IconButton(props: IconButtonProps) {
  const defaults = useDefaults("IconButton");
  const {
    icon,
    label,
    variant = defaults.variant ?? "ghost",
    size = defaults.size ?? "md",
    selected,
    disabled = false,
    loading = false,
    onPress,
    className,
    style,
  } = props;
  const attributes = useTrigger(
    {
      // The recipe gives the root part, `acme-icon-button`.
      className: classes(buttonClass({ variant, size, iconButton: true }), className),
      style,
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
