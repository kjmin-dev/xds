import {
  ACCORDION_PARTS,
  type AccordionBaseProps,
  type AccordionItemBase,
  focusTitleOnClick,
  setPanelOpen,
} from "@acme/ui-core";
import * as accordion from "@zag-js/accordion";
import { mergeProps, normalizeProps, useMachine } from "@zag-js/react";
import {
  type HTMLAttributes,
  type ReactNode,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Icon } from "./Icon.tsx";

export type AccordionItem<Value extends string = string> = AccordionItemBase<Value> & {
  /** The body, shown under the title while the item is open. */
  content: ReactNode;
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
export function Accordion<Value extends string = string>({
  items,
  expanded,
  onChange,
  multiple = false,
}: AccordionProps<Value>) {
  const service = useMachine(accordion.machine, {
    id: useId(),
    value: [...expanded],
    onValueChange: (details) => onChange(details.value as Value[]),
    multiple,
    collapsible: true,
    hiddenUntilFound: true,
  });
  const api = accordion.connect(service, normalizeProps);
  return (
    <div {...api.getRootProps()} className="accordion">
      {items.map((item) => {
        // The panel hides itself once it has finished closing; see Panel.
        const { hidden: _hidden, ...body } = api.getItemContentProps({ value: item.value });
        return (
          <div
            key={item.value}
            {...api.getItemProps({ value: item.value })}
            className="accordion__item"
          >
            <h3 {...api.getItemHeaderProps({ value: item.value })} className="accordion__heading">
              <button
                {...mergeProps(api.getItemTriggerProps({ value: item.value }), {
                  // Runs before Zag's handler.
                  onClick: focusTitleOnClick,
                })}
                type="button"
                className="accordion__trigger group"
              >
                <span className={ACCORDION_PARTS.text}>
                  <span className={ACCORDION_PARTS.title}>{item.title}</span>
                  {item.description && (
                    <span className={ACCORDION_PARTS.description}>{item.description}</span>
                  )}
                </span>
                <Icon name="chevron-down" size="sm" className={ACCORDION_PARTS.chevron} />
              </button>
            </h3>
            <Panel open={api.value.includes(item.value)} attributes={body}>
              {item.content}
            </Panel>
          </div>
        );
      })}
    </div>
  );
}

/**
 * An item's body. Its height moves between zero and the height of what it holds, and it is
 * hidden only once it has finished closing.
 */
function Panel({
  open,
  attributes,
  children,
}: {
  open: boolean;
  attributes: HTMLAttributes<HTMLDivElement>;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  // What the panel was last set to. A change animates; the first setting, and the same one
  // again when StrictMode runs the effect twice, do not.
  const shown = useRef<boolean>(undefined);
  // A page rendered on the server shows the panel before the effect below can run, so a
  // closed one starts hidden. The value never changes, so React leaves the attribute to the
  // effect from then on.
  const [closedAtFirst] = useState(!open);
  // Before the browser paints, so a closed panel never shows for a frame.
  useLayoutEffect(() => {
    if (!panel.current) return;
    const stop = setPanelOpen(
      panel.current,
      open,
      shown.current !== undefined && shown.current !== open,
    );
    shown.current = open;
    // The next toggle takes over from this one.
    return stop;
  }, [open]);
  // A group: a region is a landmark, and a page of accordions would fill the list of
  // landmarks. A closed one is left out of the accessibility tree as soon as it starts closing;
  // `hidden="until-found"` alone leaves the empty group in it.
  return (
    // A group, not a fieldset: it is the body of a disclosure, not a set of form fields.
    <div
      {...attributes}
      ref={panel}
      hidden={closedAtFirst || undefined}
      role="group"
      aria-hidden={open ? undefined : true}
      className="accordion__panel"
    >
      <div className="accordion__body">{children}</div>
    </div>
  );
}
