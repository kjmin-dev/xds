import { Accordion as HeroAccordion } from "@heroui/react";
import type { ReactNode } from "react";
import { Icon } from "./Icon.tsx";

export type AccordionItem<Value extends string = string> = {
  value: Value;
  title: string;
  /** A line under the title, shown whether the item is open or not. */
  description?: string;
  /** The body, shown under the title while the item is open. */
  content: ReactNode;
};

export type AccordionProps<Value extends string = string> = {
  items: readonly AccordionItem<Value>[];
  /** The values of the open items. */
  expanded: readonly Value[];
  onChange: (expanded: Value[]) => void;
  /** Lets several items be open at once. Without it, opening one closes the others. */
  multiple?: boolean;
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
  return (
    <HeroAccordion
      expandedKeys={expanded}
      onExpandedChange={(keys) => onChange([...keys] as Value[])}
      allowsMultipleExpanded={multiple}
    >
      {items.map((item) => (
        <HeroAccordion.Item key={item.value} id={item.value}>
          <HeroAccordion.Heading>
            <HeroAccordion.Trigger className="group">
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-acme-body-strong text-acme-text-primary">{item.title}</span>
                {item.description && (
                  <span className="text-acme-detail text-acme-text-secondary">
                    {item.description}
                  </span>
                )}
              </span>
              <Icon
                name="chevron-down"
                size="sm"
                className="text-acme-accordion-icon transition-transform duration-(--acme-motion-duration-normal) ease-(--acme-motion-easing-standard) group-aria-expanded:rotate-180 motion-reduce:transition-none"
              />
            </HeroAccordion.Trigger>
          </HeroAccordion.Heading>
          <HeroAccordion.Panel>
            <HeroAccordion.Body>{item.content}</HeroAccordion.Body>
          </HeroAccordion.Panel>
        </HeroAccordion.Item>
      ))}
    </HeroAccordion>
  );
}
