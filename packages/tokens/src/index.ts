// Acme design tokens for TypeScript. The values come from design/tokens; see
// tools/design-build. Web apps style with the CSS exports instead:
//
//   @import "@acme/tokens/theme.css";     custom properties
//   @import "@acme/tokens/tailwind.css";  Tailwind theme that points at them

import type { colors, defaultTheme } from "./generated/tokens.ts";

export * from "./generated/tokens.ts";

export type ColorMode = keyof typeof colors;
export type ColorName = keyof (typeof colors)["light"];

/** The weights a font has a face for, as React Native's text style takes them. */
export type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

/**
 * A type with the shape of `T` that takes any value where `T` has a particular one. A list of
 * names, such as font families, takes any number of them; a tuple of numbers, such as an
 * easing curve's, stays that long; a font weight is one of the weights a font has.
 */
type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends readonly string[]
      ? readonly string[]
      : { readonly [Key in keyof T]: Key extends "fontWeight" ? FontWeight : Widen<T[Key]> };

/**
 * A full set of token values: the colors of both modes, the sizes of both input devices and the
 * shared values, in the shape of `defaultTheme`. `xds export-theme --format react-native` writes
 * one from a theme file.
 */
export type Theme = Widen<typeof defaultTheme>;
