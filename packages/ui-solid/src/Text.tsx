import { type TextBaseProps, textClass } from "@acme/ui-core";
import { dynamic, type ValidComponent } from "@solidjs/web";
import type { Element } from "solid-js";

export type TextProps = TextBaseProps & {
  /** The element to render. Pick it for the document outline (`h1`, `h2`, `p`), not for looks. */
  as?: ValidComponent;
  class?: string;
  children: Element;
};

export function Text(props: TextProps) {
  const Tag = dynamic(() => props.as ?? "p");
  return (
    <Tag class={[textClass({ variant: props.variant, tone: props.tone }), props.class]}>
      {props.children}
    </Tag>
  );
}
