import { type ChipBaseProps, chipClass, chipIcon, classes, rootPart } from "@acme/ui-core";
import { Icon } from "./Icon.tsx";
import type { RootProps } from "./root.ts";

export type ChipProps = ChipBaseProps &
  RootProps & {
    onPress?: () => void;
  };

/**
 * A choice that filters what is shown. Unlike a Badge it is pressed. A selected chip is tinted,
 * outlined and marked with a check, so the state does not depend on color.
 *
 * It is a toggle button: assistive technology hears whether it is pressed.
 */
export function Chip({
  label,
  selected = false,
  onPress,
  iconStart,
  disabled = false,
  className,
  style,
}: ChipProps) {
  const icon = chipIcon({ selected, iconStart });
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onPress}
      className={classes(rootPart("Chip"), chipClass(selected), className)}
      style={style}
    >
      {icon && <Icon name={icon} size="sm" />}
      {label}
    </button>
  );
}
