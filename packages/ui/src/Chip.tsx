import { type ChipBaseProps, chipClass, chipIcon } from "@acme/ui-core";
import { Icon } from "./Icon.tsx";

export type ChipProps = ChipBaseProps & {
  onPress?: () => void;
};

/**
 * A choice that filters what is shown. Unlike a Badge it is pressed. A selected chip is tinted,
 * outlined and marked with a check, so the state does not depend on color.
 *
 * It is a toggle button: assistive technology hears whether it is pressed.
 */
export function Chip({ label, selected = false, onPress, iconStart, disabled = false }: ChipProps) {
  const icon = chipIcon({ selected, iconStart });
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onPress}
      className={chipClass(selected)}
    >
      {icon && <Icon name={icon} size="sm" />}
      {label}
    </button>
  );
}
