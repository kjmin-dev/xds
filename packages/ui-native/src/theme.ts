import { colors, size } from "@acme/tokens";
import { createContext, useContext } from "react";
import { useColorScheme } from "react-native";
import { ColorSchemeOverride } from "./scheme.ts";

/** The system's color scheme, or the one a ColorSchemeOverride sets. */
export function useScheme(): "light" | "dark" {
  const forced = useContext(ColorSchemeOverride);
  const system = useColorScheme();
  return (forced ?? system) === "dark" ? "dark" : "light";
}

/** The color tokens for the system's color scheme, or for the one a ColorSchemeOverride sets. */
export function useColors() {
  return colors[useScheme()];
}

export type Colors = ReturnType<typeof useColors>;

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

/** Phones and tablets are used with fingers, so they take the touch sizes. */
export const control = size.touch;

export type ControlSize = "sm" | "md" | "lg";

export const CONTROL_HEIGHT: Record<ControlSize, number> = {
  sm: control.controlSm,
  md: control.controlMd,
  lg: control.controlLg,
};
