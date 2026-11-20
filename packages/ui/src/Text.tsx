import { classes, rootPart, type TextBaseProps, textClass } from "@acme/ui-core";
import type { ElementType, ReactNode } from "react";
import { useDefaults } from "./Defaults.tsx";
import type { RootProps } from "./root.ts";

export type { TextTone, TextVariant } from "@acme/ui-core";

export type TextProps = TextBaseProps &
  RootProps & {
    /** The element to render. Pick it for the document outline (`h1`, `h2`, `p`), not for looks. */
    as?: ElementType;
    children: ReactNode;
  };

export function Text(props: TextProps) {
  const defaults = useDefaults("Text");
  const {
    variant = defaults.variant,
    tone = defaults.tone,
    as: Element = "p",
    className,
    style,
    children,
  } = props;
  return (
    <Element
      className={classes(rootPart("Text"), textClass({ variant, tone }), className)}
      style={style}
    >
      {children}
    </Element>
  );
}
