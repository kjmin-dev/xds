import type { IconName } from "@acme/tokens";
import {
  SIDEBAR_PARTS,
  type SidebarBaseProps,
  sidebarClass,
  sidebarCount,
  sidebarIconClass,
  sidebarRailButtonClass,
  sidebarSectionClass,
  sidebarTitleClass,
} from "@acme/ui-core";
import { type ReactNode, useId } from "react";
import { Icon } from "./Icon.tsx";
import { PlaceRow } from "./ListRow.tsx";
import { TooltipBeside } from "./Tooltip.tsx";
import { useTrigger } from "./trigger.ts";

export type { SidebarItem, SidebarSection } from "@acme/ui-core";

export type SidebarProps<Value extends string = string> = SidebarBaseProps<Value> & {
  onChange: (value: Value) => void;
  /** At the top, such as the app's name. It has to fit the rail itself while collapsed. */
  header?: ReactNode;
  /** At the bottom, such as an account row. It has to fit the rail itself while collapsed. */
  footer?: ReactNode;
};

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
    <nav aria-label={label} className={sidebarClass(collapsed)}>
      {header != null && <div className={SIDEBAR_PARTS.edge}>{header}</div>}
      {/* The places scroll when there are more than fit; the header and footer stay. */}
      <div className={SIDEBAR_PARTS.places}>
        {sections.map((section, index) => {
          const title = `${id}-${index}`;
          return (
            // A section has nothing but its position to tell it apart: titles are optional.
            <div key={index} className={sidebarSectionClass(index, collapsed)}>
              {section.title && (
                <p id={title} className={sidebarTitleClass(collapsed)}>
                  {section.title}
                </p>
              )}
              {collapsed && index > 0 && <div aria-hidden="true" className={SIDEBAR_PARTS.rule} />}
              <ul
                {...(section.title ? { "aria-labelledby": title } : {})}
                className={SIDEBAR_PARTS.list}
              >
                {section.items.map((item) => {
                  const selected = item.value === value;
                  const count = sidebarCount(item.count);
                  return (
                    <li key={item.value} className={SIDEBAR_PARTS.item}>
                      {collapsed ? (
                        <TooltipBeside label={item.label}>
                          <RailButton
                            label={item.label}
                            icon={item.icon}
                            selected={selected}
                            onPress={() => onChange(item.value)}
                          />
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
                              className={sidebarIconClass(selected)}
                            />
                          }
                          trailing={
                            count !== undefined && (
                              <span className={SIDEBAR_PARTS.count}>{count}</span>
                            )
                          }
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
      {footer != null && <div className={SIDEBAR_PARTS.edge}>{footer}</div>}
    </nav>
  );
}

/** A row of the collapsed rail. It is the trigger of the Tooltip that names it. */
function RailButton({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: IconName;
  selected: boolean;
  onPress: () => void;
}) {
  const attributes = useTrigger({
    className: sidebarRailButtonClass(selected),
    "aria-label": label,
    "aria-current": selected ? ("page" as const) : undefined,
    onClick: onPress,
  });
  return (
    <button {...attributes} type="button">
      <Icon name={icon} size="md" filled={selected} />
    </button>
  );
}
