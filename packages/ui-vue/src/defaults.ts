// Layer 6 of the library's customization: a Defaults provider gives the components inside it
// what they take for an option the app leaves out. The value goes down through provide and
// inject as a computed, so a component draws again when a provider around it changes.

import { type ComponentDefaults, type DefaultedComponent, mergeDefaults } from "@acme/ui-core";
import { computed, type ComputedRef, type InjectionKey, inject, provide } from "vue";

const DEFAULTS: InjectionKey<ComputedRef<ComponentDefaults>> = Symbol("defaults");

/** The options a provider may give component `N` a default for. */
export type DefaultOptions<N extends DefaultedComponent> = NonNullable<ComponentDefaults[N]>;

/**
 * Gives the components under the caller `value`, over the defaults of the providers around it:
 * it replaces only the options it names. Only for Defaults: the index does not export it.
 */
export function provideDefaults(value: () => ComponentDefaults): void {
  // Inject reads the providers above the caller, not what the caller provides itself.
  const outer = inject(DEFAULTS, null);
  provide(
    DEFAULTS,
    computed(() => mergeDefaults(outer?.value, value())),
  );
}

/**
 * The options of a component `name`: each one it is `given`, or the closest provider's where it
 * is given none, or its `fallback` where no provider names it either. A component without a
 * built-in default leaves the option out of `fallback`, and its recipe in @acme/ui-core decides.
 */
export function useDefaults<
  N extends DefaultedComponent,
  K extends keyof DefaultOptions<N> = never,
>(
  name: N,
  given: () => { [O in keyof DefaultOptions<N>]?: DefaultOptions<N>[O] | undefined },
  fallback?: Pick<Required<DefaultOptions<N>>, K>,
): ComputedRef<DefaultOptions<N> & Pick<Required<DefaultOptions<N>>, K>> {
  const defaults = inject(DEFAULTS, null);
  return computed(() => {
    const options: Record<string, unknown> = {};
    // A prop the app leaves out is undefined, which must not hide the provider's value.
    for (const source of [fallback, defaults?.value[name], given()]) {
      for (const [option, value] of Object.entries(source ?? {})) {
        if (value !== undefined) options[option] = value;
      }
    }
    return options as DefaultOptions<N> & Pick<Required<DefaultOptions<N>>, K>;
  });
}
