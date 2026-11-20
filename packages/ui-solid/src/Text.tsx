import { classes, rootPart, type TextBaseProps, textClass } from "@acme/ui-core";
import { dynamic, type ValidComponent } from "@solidjs/web";
import type { Element } from "solid-js";
import { useDefaults } from "./Defaults.tsx";
import type { RootProps } from "./root.ts";

export type TextProps = TextBaseProps &
  RootProps & {
    /** The element to render. Pick it for the document outline (`h1`, `h2`, `p`), not for looks. */
    as?: ValidComponent;
    children: Element;
  };

const ROOT = rootPart("Text");

export function Text(props: TextProps) {
  const Tag = dynamic(() => props.as ?? "p");
  const defaults = useDefaults("Text");
  return (
    <Tag
      class={classes(
        ROOT,
        textClass({
          variant: props.variant ?? defaults().variant,
          tone: props.tone ?? defaults().tone,
        }),
        props.class,
      )}
      style={props.style}
    >
      {props.children}
    </Tag>
  );
}
