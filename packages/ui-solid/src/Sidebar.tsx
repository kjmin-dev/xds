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
import type { JSX } from "@solidjs/web";
import { createMemo, createUniqueId, type Element, For, Show } from "solid-js";
import { Icon } from "./Icon.tsx";
import { PlaceRow } from "./ListRow.tsx";
import { TooltipBeside } from "./Tooltip.tsx";
import { withTrigger } from "./trigger.ts";

export type { SidebarItem, SidebarSection } from "@acme/ui-core";

export type SidebarProps<Value extends string = string> = SidebarBaseProps<Value> & {
  onChange: (value: Value) => void;
  /** At the top, such as the app's name. It has to fit the rail itself while collapsed. */
  header?: Element;
  /** At the bottom, such as an account row. It has to fit the rail itself while collapsed. */
  footer?: Element;
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
export function Sidebar<Value extends string = string>(props: SidebarProps<Value>) {
  const id = createUniqueId();
  const collapsed = () => props.collapsed ?? false;
  return (
    <nav aria-label={props.label} class={sidebarClass(collapsed())}>
      <Show when={props.header}>
        {(header) => <div class={SIDEBAR_PARTS.edge}>{header()}</div>}
      </Show>
      {/* The places scroll when there are more than fit; the header and footer stay. */}
      <div class={SIDEBAR_PARTS.places}>
        <For each={props.sections}>
          {(section, index) => {
            // A section has nothing but its position to tell it apart: titles are optional.
            const title = () => `${id}-${index()}`;
            return (
              <div class={sidebarSectionClass(index(), collapsed())}>
                <Show when={section.title}>
                  {(text) => (
                    <p id={title()} class={sidebarTitleClass(collapsed())}>
                      {text()}
                    </p>
                  )}
                </Show>
                <Show when={collapsed() && index() > 0}>
                  <div aria-hidden="true" class={SIDEBAR_PARTS.rule} />
                </Show>
                <ul
                  aria-labelledby={section.title ? title() : undefined}
                  class={SIDEBAR_PARTS.list}
                >
                  <For each={section.items}>
                    {(item) => {
                      const selected = () => item.value === props.value;
                      return (
                        <li class={SIDEBAR_PARTS.item}>
                          <Show
                            when={collapsed()}
                            fallback={
                              <PlaceRow
                                compact
                                current="page"
                                selected={selected()}
                                onPress={() => props.onChange(item.value)}
                                title={item.label}
                                leading={
                                  <Icon
                                    name={item.icon}
                                    size="md"
                                    filled={selected()}
                                    class={sidebarIconClass(selected())}
                                  />
                                }
                                trailing={
                                  <Show when={sidebarCount(item.count)}>
                                    {(count) => <span class={SIDEBAR_PARTS.count}>{count()}</span>}
                                  </Show>
                                }
                              />
                            }
                          >
                            <TooltipBeside label={item.label}>
                              <RailButton
                                label={item.label}
                                icon={item.icon}
                                selected={selected()}
                                onPress={() => props.onChange(item.value)}
                              />
                            </TooltipBeside>
                          </Show>
                        </li>
                      );
                    }}
                  </For>
                </ul>
              </div>
            );
          }}
        </For>
      </div>
      <Show when={props.footer}>
        {(footer) => <div class={SIDEBAR_PARTS.edge}>{footer()}</div>}
      </Show>
    </nav>
  );
}

/** A row of the collapsed rail. It is the trigger of the Tooltip that names it. */
function RailButton(props: {
  label: string;
  icon: IconName;
  selected: boolean;
  onPress: () => void;
}) {
  const attributes = withTrigger(
    createMemo((): JSX.ButtonHTMLAttributes<HTMLButtonElement> => ({
      type: "button",
      class: sidebarRailButtonClass(props.selected),
      "aria-label": props.label,
      "aria-current": props.selected ? "page" : undefined,
      onClick: () => props.onPress(),
    })),
  );
  return (
    <button {...attributes}>
      <Icon name={props.icon} size="md" filled={props.selected} />
    </button>
  );
}
