import {
  ACCORDION_PARTS,
  type AccordionBaseProps,
  type AccordionItemBase,
  focusTitleOnClick,
  setPanelOpen,
} from "@acme/ui-core";
import type { JSX } from "@solidjs/web";
import * as accordion from "@zag-js/accordion";
import { mergeProps, normalizeProps, useMachine } from "@zag-js/solid";
import { createEffect, createMemo, createUniqueId, type Element, For, Show } from "solid-js";
import { Icon } from "./Icon.tsx";

export type AccordionItem<Value extends string = string> = AccordionItemBase<Value> & {
  /** The body, shown under the title while the item is open. */
  content: Element;
};

export type AccordionProps<Value extends string = string> = AccordionBaseProps<Value> & {
  items: readonly AccordionItem<Value>[];
  onChange: (expanded: Value[]) => void;
};

/**
 * Items whose bodies open and close under their titles, separated by hairlines. The chevron
 * turns over when an item is open, so the state does not depend on color. Opening and closing
 * animate the height, and do not for people who ask for less motion.
 *
 * Each title is a heading holding a button that says whether its body is expanded and which
 * body it controls. A closed body is hidden, but the browser's find in page still opens it.
 */
export function Accordion<Value extends string = string>(props: AccordionProps<Value>) {
  const id = createUniqueId();
  const service = useMachine(accordion.machine, () => ({
    id,
    value: [...props.expanded],
    onValueChange: (details: accordion.ValueChangeDetails) =>
      props.onChange(details.value as Value[]),
    multiple: props.multiple ?? false,
    collapsible: true,
    hiddenUntilFound: true,
  }));
  const api = createMemo(() => accordion.connect(service, normalizeProps));
  const body = (value: Value) => {
    // The panel hides itself once it has finished closing; see Panel.
    const { hidden: _hidden, ...attributes } = api().getItemContentProps({ value });
    return attributes as JSX.HTMLAttributes<HTMLDivElement>;
  };
  return (
    <div {...api().getRootProps()} class="accordion">
      <For each={props.items}>
        {(item) => (
          <div {...api().getItemProps({ value: item.value })} class="accordion__item">
            <h3 {...api().getItemHeaderProps({ value: item.value })} class="accordion__heading">
              <button
                {...mergeProps(() => api().getItemTriggerProps({ value: item.value }), {
                  // Runs before Zag's handler.
                  onClick: focusTitleOnClick,
                })}
                class="accordion__trigger group"
              >
                <span class={ACCORDION_PARTS.text}>
                  <span class={ACCORDION_PARTS.title}>{item.title}</span>
                  <Show when={item.description}>
                    {(description) => (
                      <span class={ACCORDION_PARTS.description}>{description()}</span>
                    )}
                  </Show>
                </span>
                <Icon name="chevron-down" size="sm" class={ACCORDION_PARTS.chevron} />
              </button>
            </h3>
            <Panel open={api().value.includes(item.value)} attributes={body(item.value)}>
              {item.content}
            </Panel>
          </div>
        )}
      </For>
    </div>
  );
}

/**
 * An item's body. Its height moves between zero and the height of what it holds, and it is
 * hidden only once it has finished closing.
 */
function Panel(props: {
  open: boolean;
  attributes: JSX.HTMLAttributes<HTMLDivElement>;
  children: Element;
}) {
  let panel!: HTMLDivElement;
  let rendered = false;
  createEffect(
    () => props.open,
    (open) => {
      const stop = setPanelOpen(panel, open, rendered);
      rendered = true;
      // The next toggle takes over from this one.
      return stop;
    },
  );
  // A group: a region is a landmark, and a page of accordions would fill the list of
  // landmarks. A closed one is left out of the accessibility tree as soon as it starts closing;
  // `hidden="until-found"` alone leaves the empty group in it.
  return (
    // A group, not a fieldset: it is the body of a disclosure, not a set of form fields.
    <div
      {...props.attributes}
      ref={(element) => (panel = element)}
      role="group"
      aria-hidden={props.open ? undefined : "true"}
      class="accordion__panel"
    >
      <div class="accordion__body">{props.children}</div>
    </div>
  );
}
