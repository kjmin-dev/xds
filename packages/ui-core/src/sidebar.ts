import type { IconName } from "@acme/tokens";
import { PRESSABLE_ROW } from "./list-row.ts";

export type SidebarItem<Value extends string = string> = {
  value: Value;
  label: string;
  icon: IconName;
  /** How many things the place holds, at the end of the row. Zero or less shows none. */
  count?: number;
};

export type SidebarSection<Value extends string = string> = {
  /** Shown above the items; a hairline takes its place while the sidebar is collapsed. */
  title?: string;
  items: readonly SidebarItem<Value>[];
};

/** Sidebar's props in every framework, short of `onChange`, `header` and `footer`. */
export type SidebarBaseProps<Value extends string = string> = {
  sections: readonly SidebarSection<Value>[];
  /** The current place. */
  value: Value;
  /** Names the navigation for assistive technology, such as "Main". */
  label: string;
  /** A rail of icons, each named by a Tooltip. The app decides when, and holds the state. */
  collapsed?: boolean;
};

// The same number a CountBadge would show, without its red: this is how many things a place
// holds, not how many are waiting.
const MAX_COUNT = 99;

/** What the end of a row says about `count`, or nothing for zero or less. */
export function sidebarCount(count: number | undefined): string | undefined {
  if (count === undefined || count <= 0) return undefined;
  return count > MAX_COUNT ? `${MAX_COUNT}+` : String(count);
}

export function sidebarClass(collapsed = false): string {
  return `flex h-full shrink-0 flex-col gap-2 border-acme-sidebar-border border-e bg-acme-sidebar-background p-2 ${collapsed ? "w-acme-sidebar-rail" : "w-acme-sidebar"}`;
}

/** A section after the first is a gap away from the one before it. */
export function sidebarSectionClass(index: number, collapsed = false): string {
  return index === 0 ? "" : collapsed ? "mt-2" : "mt-4";
}

/** Still there while collapsed, for the list it names, but not shown. */
export function sidebarTitleClass(collapsed = false): string {
  return collapsed ? "sr-only" : "px-2 pb-1 text-acme-footnote text-acme-sidebar-section-title";
}

/** A row of the collapsed rail: an icon-only button with the fills of a pressable list row. */
export function sidebarRailButtonClass(selected = false): string {
  return `flex min-h-acme-list-row-compact w-full cursor-pointer items-center justify-center transition-colors duration-(--acme-motion-duration-fast) ${selected ? `bg-acme-list-row-background-selected text-acme-text-primary ${PRESSABLE_ROW.selected}` : `text-acme-text-secondary ${PRESSABLE_ROW.rest}`} ${PRESSABLE_ROW.focus}`;
}

/** The icon of an expanded row. */
export function sidebarIconClass(selected = false): string {
  return selected ? "text-acme-text-primary" : "text-acme-text-secondary";
}

export const SIDEBAR_PARTS = {
  /** The header and the footer stay; the places between them scroll. */
  edge: "shrink-0",
  places: "flex min-h-0 flex-1 flex-col overflow-y-auto",
  /** The hairline in place of a section's title while collapsed. */
  rule: "mx-2 mb-2 h-(--acme-border-width-thin) bg-acme-sidebar-border",
  list: "flex flex-col",
  /** The row is clipped to the rounded shape; its focus ring is inside it. */
  item: "overflow-hidden rounded-acme-md",
  count: "text-acme-detail text-acme-text-secondary tabular-nums",
} as const;
