// Menu and Tooltip take the control that opens them in a slot, as every web library takes it
// as an element: `<Menu><template #trigger><Button>Actions</Button></template></Menu>`,
// `<Tooltip label="Search"><IconButton /></Tooltip>`. The overlay's machine has props for that
// control (its id, aria and event handlers), and they reach the Button or IconButton through
// provide and inject, so an app never wires them up itself.

import { mergeProps } from "@zag-js/vue";
import {
  computed,
  type ComputedRef,
  defineComponent,
  type InjectionKey,
  inject,
  type PropType,
  provide,
} from "vue";

/** The props an overlay's machine has for the control that opens it. */
export type TriggerProps = Record<string, unknown>;

const TRIGGER: InjectionKey<ComputedRef<TriggerProps | null>> = Symbol("trigger");

/**
 * Gives what is in its slot the trigger props of an overlay, joined with those of any overlay
 * around it: a Tooltip around a Menu's button gives the button both sets, and the handlers of
 * both run. With `null` it gives none, around what an overlay shows: nothing inside opens an
 * overlay from a control outside it. Not exported from the package: only this package's
 * overlays use it.
 */
export const TriggerScope = defineComponent({
  props: { trigger: { type: Object as PropType<TriggerProps | null>, default: null } },
  setup(props, { slots }) {
    const outer = inject(TRIGGER, null);
    provide(
      TRIGGER,
      computed(() =>
        props.trigger === null
          ? null
          : (mergeProps(outer?.value ?? {}, props.trigger) as TriggerProps),
      ),
    );
    return () => slots.default?.();
  },
});

/**
 * For a control that can open an overlay: its own props, after those of the overlays it opens.
 * Its own attributes win, its own handlers run first, and its class is added to theirs, so the
 * own class must be a string. While `inert` is true, as for a loading button, the overlays get
 * none of its events and so do not open. Bind the result on the element.
 */
export function useTrigger<T extends object>(
  own: () => T,
  inert: () => boolean = () => false,
): ComputedRef<T> {
  const trigger = inject(TRIGGER, null);
  return computed(() => {
    const props = trigger?.value ?? {};
    const overlays = inert()
      ? Object.fromEntries(Object.entries(props).filter(([key]) => !key.startsWith("on")))
      : props;
    return mergeProps(overlays, own() as TriggerProps) as T;
  });
}
