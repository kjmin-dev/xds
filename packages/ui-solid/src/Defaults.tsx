import { type ComponentDefaults, type DefaultedComponent, mergeDefaults } from "@acme/ui-core";
import { type Accessor, createContext, createMemo, type Element, useContext } from "solid-js";

const DefaultsContext = createContext<Accessor<ComponentDefaults>>(() => ({}));

export type { ComponentDefaults } from "@acme/ui-core";

export type DefaultsProps = {
  /**
   * What the components inside take for an option they are not given, by component:
   * `{ Button: { variant: "primary" } }`. Inside another Defaults, it replaces only the options
   * it names.
   */
  value: ComponentDefaults;
  children: Element;
};

/**
 * Gives the components inside it their defaults: a component takes the option it is given,
 * then the one the closest Defaults names, then its own default. A change of `value` reaches
 * every component inside.
 */
export function Defaults(props: DefaultsProps) {
  const outer = useContext(DefaultsContext);
  const merged = createMemo(() => mergeDefaults(outer(), props.value));
  return <DefaultsContext value={merged}>{props.children}</DefaultsContext>;
}

/**
 * For a component with defaultable options: the defaults the Defaults around it give it, read
 * where the option is read so that a change of them updates it.
 */
export function useDefaults<N extends DefaultedComponent>(
  component: N,
): Accessor<NonNullable<ComponentDefaults[N]>> {
  const defaults = useContext(DefaultsContext);
  return () => defaults()[component] ?? {};
}
