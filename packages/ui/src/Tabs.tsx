import { classes, type TabsBaseProps, tabStopIndex, tabsClass } from "@acme/ui-core";
import { mergeProps, normalizeProps, useMachine } from "@zag-js/react";
import * as tabs from "@zag-js/tabs";
import { useId } from "react";
import { Icon } from "./Icon.tsx";
import type { RootProps } from "./root.ts";

export type TabsProps<Value extends string> = TabsBaseProps<Value> &
  RootProps & {
    onChange: (value: Value) => void;
  };

/**
 * Switches between views inside one screen. For two to four short modes a SegmentedControl is
 * lighter; tabs are for more items, longer labels, or a row that may have to scroll.
 *
 * The selected tab is underlined as well as darker, so the choice does not depend on color.
 * This is only the row: the app shows the view that matches `value`. The arrow keys move
 * between tabs.
 */
export function Tabs<Value extends string>({
  items,
  value,
  onChange,
  label,
  fullWidth = false,
  className,
  style,
}: TabsProps<Value>) {
  const service = useMachine(tabs.machine, {
    id: useId(),
    value,
    onValueChange: (details) => onChange(details.value as Value),
  });
  const api = tabs.connect(service, normalizeProps);
  return (
    // The recipe's first class is the root part, `acme-tabs`.
    <div
      {...mergeProps(api.getRootProps(), {
        className: classes(tabsClass(fullWidth), className),
        style,
      })}
    >
      <div {...api.getListProps()} aria-label={label} className="acme-tabs__list">
        {items.map((item) => {
          const trigger = api.getTriggerProps({ value: item.value });
          return (
            <button
              key={item.value}
              {...trigger}
              tabIndex={tabStopIndex(api.focusedValue, item.value, trigger.tabIndex)}
              // Zag points the selected tab at its panel, which this row never renders: the app
              // shows the view. A reference to an element that does not exist is invalid.
              aria-controls={undefined}
              type="button"
              className="acme-tabs__tab"
            >
              {item.icon && <Icon name={item.icon} size="sm" />}
              {item.label}
            </button>
          );
        })}
        <div {...api.getIndicatorProps()} className="acme-tabs__indicator" />
      </div>
    </div>
  );
}
