import type { IconName } from "@acme/tokens";

/** Tabs' props in every framework, short of `onChange`. */
export type TabsBaseProps<Value extends string> = {
  items: readonly { value: Value; label: string; icon?: IconName }[];
  /** The selected tab. */
  value: Value;
  /** Says what the tabs switch between, for assistive technology. */
  label: string;
  /** The tabs share the width equally instead of being as wide as their labels. */
  fullWidth?: boolean;
};

/** The classes of the row's root, which is what scrolls. */
export function tabsClass(fullWidth = false): string {
  return fullWidth ? "tabs tabs--full-width" : "tabs";
}
