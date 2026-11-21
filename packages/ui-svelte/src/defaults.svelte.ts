// The defaults that a Defaults provider gives the components inside it. They reach a component
// through context, so that a provider far up the tree applies without each screen passing them
// along, and each provider merges its own over the ones around it.

import { type ComponentDefaults, type DefaultedComponent, mergeDefaults } from "@acme/ui-core";
import { createContext } from "svelte";

type Defaults = () => ComponentDefaults;

// Not exported from the package: apps give defaults with the Defaults component.
const [getDefaults, setDefaults, hasDefaults] = createContext<Defaults>();

/**
 * For Defaults: gives the components inside it the defaults around it, with those of `own`
 * replaced, option by option. Call it while the component is set up.
 */
export function provideDefaults(own: () => ComponentDefaults): void {
  const outer = hasDefaults() ? getDefaults() : undefined;
  const merged = $derived(mergeDefaults(outer?.(), own()));
  setDefaults(() => merged);
}

/**
 * For a component with defaultable options: what the closest Defaults gives it, which it takes
 * for each option its own props leave out, before its built-in default. Call it while the
 * component is set up; the result follows the providers' values.
 */
export function useDefaults<N extends DefaultedComponent>(
  component: N,
): () => NonNullable<ComponentDefaults[N]> {
  const defaults = hasDefaults() ? getDefaults() : undefined;
  return () => defaults?.()[component] ?? {};
}
