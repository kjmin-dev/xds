import { type FunctionalComponent, h } from "vue";

/**
 * What its slot holds, inside a `tag` element with the class `wrapper` while `when` holds, and
 * on its own otherwise: a template then writes the content once. Only for this package's own
 * components: the index does not export it.
 */
export const Wrap: FunctionalComponent<{ when: boolean; tag: string; wrapper: string }> = (
  props,
  { slots },
) => (props.when ? h(props.tag, { class: props.wrapper }, slots.default?.()) : slots.default?.());
Wrap.props = ["when", "tag", "wrapper"];
