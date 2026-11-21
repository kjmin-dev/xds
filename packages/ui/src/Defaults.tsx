import { type ComponentDefaults, type DefaultedComponent, mergeDefaults } from "@acme/ui-core";
import { createContext, type ReactNode, useContext, useMemo } from "react";

export type { ComponentDefaults } from "@acme/ui-core";

export type DefaultsProps = {
  /** By component, what it takes for an option it is not given, such as Button's `variant`. */
  value: ComponentDefaults;
  children: ReactNode;
};

const DefaultsContext = createContext<ComponentDefaults>({});

/**
 * Gives the components inside it their defaults: a component takes the value for an option
 * the app leaves out from the closest Defaults around it, and its own built-in default when no
 * Defaults names one. A Defaults inside another keeps the outer one's values and replaces those
 * it names, option by option.
 */
export function Defaults({ value, children }: DefaultsProps) {
  const outer = useContext(DefaultsContext);
  // An app usually writes `value` inline, a new object on every render. Compared by what it
  // holds, it does not hand every component inside a new context value each time.
  const key = JSON.stringify(value);
  // oxlint-disable-next-line react/exhaustive-deps -- `key` stands for `value`, by content
  const merged = useMemo(() => mergeDefaults(outer, value), [outer, key]);
  return <DefaultsContext value={merged}>{children}</DefaultsContext>;
}

/** The defaults that the closest Defaults gives component `name`, or none. */
export function useDefaults<N extends DefaultedComponent>(
  name: N,
): NonNullable<ComponentDefaults[N]> {
  return useContext(DefaultsContext)[name] ?? {};
}
