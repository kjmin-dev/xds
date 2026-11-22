import { defaultTheme, type Theme } from "@acme/tokens";
import { createContext, createElement, type ReactNode, useContext } from "react";
import { useColorScheme } from "react-native";
import { ColorSchemeOverride } from "./scheme.ts";

export type { Theme };

const ThemeContext = createContext<Theme>(defaultTheme);

/** The tokens in effect: the theme of the closest AcmeTheme, or the default one without one. */
export function useTheme(): Theme {
  return useContext(ThemeContext);
}

/**
 * Gives the components inside it a theme, a color scheme, or both: around the whole app, or
 * around a part of a screen. What it is not given comes from the AcmeTheme around it, so one
 * inside another can change the scheme alone. Without any, the components take the default
 * theme and the system's color scheme.
 */
export function AcmeTheme({
  theme,
  scheme,
  children,
}: {
  /** A full set of token values, such as one `xds export-theme --format react-native` writes. */
  theme?: Theme;
  /** Light or dark, whatever the system's setting. */
  scheme?: "light" | "dark";
  children?: ReactNode;
}) {
  const outer = useTheme();
  const themed = createElement(ThemeContext, { value: theme ?? outer }, children);
  return scheme ? createElement(ColorSchemeOverride, { value: scheme }, themed) : themed;
}

/**
 * A hook that gives what `make` builds from the theme in effect, such as a component's style
 * sheet. It is built once per theme, so a component that renders again gets the same object.
 */
export function themed<T>(make: (theme: Theme) => T): () => T {
  const built = new WeakMap<Theme, T>();
  return function useThemed() {
    const theme = useTheme();
    let value = built.get(theme);
    if (value === undefined) {
      value = make(theme);
      built.set(theme, value);
    }
    return value;
  };
}

/** The system's color scheme, or the one an AcmeTheme or a ColorSchemeOverride sets. */
export function useScheme(): "light" | "dark" {
  const forced = useContext(ColorSchemeOverride);
  const system = useColorScheme();
  return (forced ?? system) === "dark" ? "dark" : "light";
}

/** The color tokens of the theme in effect, for the color scheme in effect. */
export function useColors(): Colors {
  return useTheme().colors[useScheme()];
}

export type Colors = Theme["colors"]["light"];

/**
 * The color that icons and text take when they are given none. React Native hands no color down
 * from a view to what is inside it, so a container that tints its content says so here.
 */
export const ContentColor = createContext<string | undefined>(undefined);

/**
 * Whether the menu that a button opens is open. A Menu sets it around its trigger, and the
 * button says so to a screen reader; outside a Menu a button opens nothing and says nothing.
 */
export const MenuOpen = createContext<boolean | undefined>(undefined);

export type Control = Theme["size"]["touch"];

/** The control sizes of the theme in effect. Phones and tablets are used with fingers. */
export function useControl(): Control {
  return useTheme().size.touch;
}

export type ControlSize = "sm" | "md" | "lg";

/** The height of a control of a size. */
export function controlHeight(control: Control, size: ControlSize): number {
  switch (size) {
    case "sm":
      return control.controlSm;
    case "md":
      return control.controlMd;
    case "lg":
      return control.controlLg;
  }
}
