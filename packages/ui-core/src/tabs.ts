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

/**
 * A tab's tabindex. Zag makes the selected tab the row's one stop for Tab and Shift+Tab. A tab
 * can have the focus without being selected, after a press that ended off it or from a script,
 * and the stop would then be another tab of the same row. While a tab has the focus it is the
 * stop, so that Tab and Shift+Tab leave the row from it.
 */
export function tabStopIndex<ZagTabIndex>(
  focusedValue: string | null,
  value: string,
  zagTabIndex: ZagTabIndex,
): ZagTabIndex | 0 | -1 {
  if (focusedValue === null) return zagTabIndex;
  return focusedValue === value ? 0 : -1;
}
