import { type TextBaseProps, textClass } from "@acme/ui-core";
import type { ElementType, ReactNode } from "react";

export type { TextTone, TextVariant } from "@acme/ui-core";

export type TextProps = TextBaseProps & {
  /** The element to render. Pick it for the document outline (`h1`, `h2`, `p`), not for looks. */
  as?: ElementType;
  className?: string;
  children: ReactNode;
};

export function Text({ variant, tone, as: Element = "p", className = "", children }: TextProps) {
  return <Element className={`${textClass({ variant, tone })} ${className}`}>{children}</Element>;
}
