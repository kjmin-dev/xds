import { Tabs as HeroTabs } from "@heroui/react";
import { useLayoutEffect, useRef } from "react";
import { Icon, type IconName } from "./Icon.tsx";

export type TabsProps<Value extends string> = {
  items: readonly { value: Value; label: string; icon?: IconName }[];
  /** The selected tab. */
  value: Value;
  onChange: (value: Value) => void;
  /** Says what the tabs switch between, for assistive technology. */
  label: string;
  /** The tabs share the width equally instead of being as wide as their labels. */
  fullWidth?: boolean;
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
}: TabsProps<Value>) {
  const root = useRef<HTMLDivElement>(null);
  // React Aria points the selected tab at a tab panel, which this row never renders: the app
  // shows the view. A reference to an element that does not exist is invalid, so it is taken
  // off whenever React Aria writes it, which can happen in a render of its own after this one.
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const strip = () => {
      for (const tab of element.querySelectorAll("[aria-controls]")) {
        tab.removeAttribute("aria-controls");
      }
    };
    strip();
    const observer = new MutationObserver(strip);
    observer.observe(element, {
      subtree: true,
      childList: true,
      attributeFilter: ["aria-controls"],
    });
    return () => observer.disconnect();
  }, []);
  return (
    <HeroTabs
      ref={root}
      selectedKey={value}
      onSelectionChange={(key) => onChange(key as Value)}
      {...(fullWidth ? { className: "tabs--full-width" } : {})}
    >
      <HeroTabs.List aria-label={label}>
        {items.map((item) => (
          <HeroTabs.Tab key={item.value} id={item.value}>
            {item.icon && <Icon name={item.icon} size="sm" />}
            {item.label}
            <HeroTabs.Indicator />
          </HeroTabs.Tab>
        ))}
      </HeroTabs.List>
    </HeroTabs>
  );
}
