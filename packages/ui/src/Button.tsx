import { BUTTON_ICON, type ButtonBaseProps, buttonClass, classes, isHeld } from "@acme/ui-core";
import type { ReactNode } from "react";
import { useDefaults } from "./Defaults.tsx";
import { Icon } from "./Icon.tsx";
import type { RootProps } from "./root.ts";
import { Spinner } from "./Spinner.tsx";
import { useTrigger } from "./trigger.ts";

export type { ButtonVariant, ControlSize } from "@acme/ui-core";

export type ButtonProps = ButtonBaseProps &
  RootProps & {
    onPress?: () => void;
    /** Leave it out for a button that holds only an icon, and name that one with `aria-label`. */
    children?: ReactNode;
  };

/**
 * A native button. It also opens a Menu or a Tooltip it is the trigger of: their props reach
 * it through context.
 */
export function Button(props: ButtonProps) {
  const defaults = useDefaults("Button");
  const {
    variant = defaults.variant ?? "secondary",
    size = defaults.size ?? "md",
    iconStart,
    iconEnd,
    selected,
    disabled = false,
    loading = false,
    fullWidth = false,
    type = "button",
    onPress,
    "aria-label": label,
    className,
    style,
    children,
  } = props;
  const icon = BUTTON_ICON[size];
  const attributes = useTrigger(
    {
      // The recipe's first class is the root part, `acme-button`.
      className: classes(
        buttonClass({
          variant,
          size,
          iconOnly: children == null && (iconStart !== undefined || iconEnd !== undefined),
          fullWidth,
        }),
        className,
      ),
      style,
      disabled,
      // Loading keeps the button focusable, so focus is not lost while it waits.
      "aria-disabled": loading || undefined,
      "data-pending": loading ? "" : undefined,
      "aria-pressed": selected,
      "aria-label": label,
      onClick: () => {
        // The press was taken already.
        if (!loading) onPress?.();
      },
    },
    loading,
  );
  return (
    // oxlint-disable-next-line react/button-has-type -- one of the three types, from the props
    <button {...attributes} type={type}>
      {loading &&
        (iconStart ? (
          // Where the icon was, so the button keeps its width.
          <span className={icon.box}>
            <Spinner size="sm" />
          </span>
        ) : (
          <Spinner size="sm" />
        ))}
      {iconStart && !loading && (
        <Icon name={iconStart} size={icon.size} filled={isHeld({ variant, selected, disabled })} />
      )}
      {children}
      {iconEnd && <Icon name={iconEnd} size={icon.size} />}
    </button>
  );
}
