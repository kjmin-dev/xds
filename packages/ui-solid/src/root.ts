import type { JSX } from "@solidjs/web";
import { mergeProps } from "@zag-js/solid";

/**
 * What every component takes for its root element, beside its root part (`acme-<name>`): the
 * app's own handle on it.
 */
export type RootProps = {
  /** Added to the classes of the component's root element. */
  class?: string;
  /** Inline style on the component's root element, laid over any it sets itself. */
  style?: JSX.CSSProperties | string;
};

type Style = JSX.CSSProperties | string | undefined;

const css = (style: JSX.CSSProperties | string) =>
  typeof style === "string"
    ? style
    : Object.entries(style)
        .filter(([, value]) => value !== undefined)
        .map(([property, value]) => `${property}:${String(value)}`)
        .join(";");

/**
 * The style of a root element that sets one of its own: the app's comes after it, so that it
 * wins property by property. A string cannot be merged into an object without parsing it, so a
 * string on either side makes both into one declaration list.
 */
export function layStyle(own: Style, app: Style): Style {
  if (app === undefined) return own;
  if (own === undefined) return app;
  if (typeof own === "string" || typeof app === "string") return `${css(own)};${css(app)}`;
  return { ...own, ...app };
}

/**
 * The props Zag gives a component's root element, with the app's style laid over the one Zag
 * sets: Zag's mergeProps merges the two, where a `style` after the spread would replace Zag's.
 * Spread the result on the element.
 */
export function withStyle<T extends object>(zag: () => T, style: () => Style): T {
  return mergeProps(zag, () => ({ style: style() })) as T;
}
