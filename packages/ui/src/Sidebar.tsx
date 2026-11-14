import { Focusable } from "@heroui/react";
import { type ReactNode, useId } from "react";
import { Icon, type IconName } from "./Icon.tsx";
import { PlaceRow, PRESSABLE_ROW } from "./ListRow.tsx";
import { TooltipBeside } from "./Tooltip.tsx";

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

export type SidebarProps<Value extends string = string> = {
  sections: readonly SidebarSection<Value>[];
  /** The current place. */
  value: Value;
  onChange: (value: Value) => void;
  /** Names the navigation for assistive technology, such as "Main". */
  label: string;
  /** A rail of icons, each named by a Tooltip. The app decides when, and holds the state. */
  collapsed?: boolean;
  /** At the top, such as the app's name. It has to fit the rail itself while collapsed. */
  header?: ReactNode;
  /** At the bottom, such as an account row. It has to fit the rail itself while collapsed. */
  footer?: ReactNode;
};

// The same number a CountBadge would show, without its red: this is how many things a place
// holds, not how many are waiting.
const MAX_COUNT = 99;

/**
 * The top-level places of an app used with a pointer: the counterpart of TabBar on touch. Each
 * row is a compact list row; the current one is selected, its title heavier and its icon
 * filled, so the place does not depend on the tint alone.
 *
 * It is navigation named by `label`, and the current row says it is the current page.
 * Collapsed, the rows keep their names, and show them in a Tooltip under a pointer and on
 * keyboard focus.
 */
export function Sidebar<Value extends string = string>({
  sections,
  value,
  onChange,
  label,
  collapsed = false,
  header,
  footer,
}: SidebarProps<Value>) {
  const id = useId();
  return (
    <nav
      aria-label={label}
      className={`flex h-full shrink-0 flex-col gap-2 border-acme-sidebar-border border-e bg-acme-sidebar-background p-2 ${collapsed ? "w-acme-sidebar-rail" : "w-acme-sidebar"}`}
    >
      {header != null && <div className="shrink-0">{header}</div>}
      {/* The places scroll when there are more than fit; the header and footer stay. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {sections.map((section, index) => {
          const title = `${id}-${index}`;
          return (
            // A section has nothing but its position to tell it apart: titles are optional.
            <div key={index} className={index === 0 ? "" : collapsed ? "mt-2" : "mt-4"}>
              {section.title && (
                // Still there while collapsed, for the list it names, but not shown.
                <p
                  id={title}
                  className={
                    collapsed
                      ? "sr-only"
                      : "px-2 pb-1 text-acme-footnote text-acme-sidebar-section-title"
                  }
                >
                  {section.title}
                </p>
              )}
              {collapsed && index > 0 && (
                <div
                  aria-hidden="true"
                  className="mx-2 mb-2 h-(--acme-border-width-thin) bg-acme-sidebar-border"
                />
              )}
              <ul
                {...(section.title ? { "aria-labelledby": title } : {})}
                className="flex flex-col"
              >
                {section.items.map((item) => {
                  const selected = item.value === value;
                  const count = item.count ?? 0;
                  return (
                    // The row is clipped to the rounded shape; its focus ring is inside it.
                    <li key={item.value} className="overflow-hidden rounded-acme-md">
                      {collapsed ? (
                        <TooltipBeside label={item.label}>
                          <Focusable>
                            <button
                              type="button"
                              aria-label={item.label}
                              {...(selected ? { "aria-current": "page" as const } : {})}
                              onClick={() => onChange(item.value)}
                              className={`flex min-h-acme-list-row-compact w-full cursor-pointer items-center justify-center transition-colors duration-(--acme-motion-duration-fast) ${selected ? `bg-acme-list-row-background-selected text-acme-text-primary ${PRESSABLE_ROW.selected}` : `text-acme-text-secondary ${PRESSABLE_ROW.rest}`} ${PRESSABLE_ROW.focus}`}
                            >
                              <Icon name={item.icon} size="md" filled={selected} />
                            </button>
                          </Focusable>
                        </TooltipBeside>
                      ) : (
                        <PlaceRow
                          compact
                          current="page"
                          selected={selected}
                          onPress={() => onChange(item.value)}
                          title={item.label}
                          leading={
                            <Icon
                              name={item.icon}
                              size="md"
                              filled={selected}
                              className={
                                selected ? "text-acme-text-primary" : "text-acme-text-secondary"
                              }
                            />
                          }
                          {...(count > 0
                            ? {
                                trailing: (
                                  <span className="text-acme-detail text-acme-text-secondary tabular-nums">
                                    {count > MAX_COUNT ? `${MAX_COUNT}+` : count}
                                  </span>
                                ),
                              }
                            : {})}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
      {footer != null && <div className="shrink-0">{footer}</div>}
    </nav>
  );
}
