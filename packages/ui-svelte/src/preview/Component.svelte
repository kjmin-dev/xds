<!--
  @component
  A component node, drawn with the library's component of its name. A prop that takes a node
  (NODE_PROPS), and the children, reach the component as snippets of the same names, whether they
  hold a node or text; every other prop is resolved from the state where the component reads it,
  and once if it reads nothing from the state.
-->
<script lang="ts">
  import {
    type ComponentName,
    type ComponentNode,
    type Host,
    isStatic,
    NODE_PROPS,
    resolve,
    type Slot,
    type State,
  } from "@acme/ui-core/preview";
  import { type Component, type Snippet, untrack } from "svelte";
  import { COMPONENTS } from "./components.ts";
  import Snippets from "./Snippets.svelte";

  let { node, host }: { node: ComponentNode; host: Host<Snippet> } = $props();

  const nodeProps: Partial<Record<ComponentName, readonly string[]>> = NODE_PROPS;

  // The props by kind. A node is drawn once: a new node is a new component.
  function split({ name, props: given, children }: ComponentNode, host: Host<Snippet>) {
    const values: Record<string, unknown> = {};
    const slots: (readonly [string, Slot<State>])[] = [];
    const takesNode = nodeProps[name] ?? [];
    for (const [key, value] of Object.entries(given)) {
      // A snippet only for what the data gives: a prop left undefined stays unset.
      if (takesNode.includes(key) && value !== undefined) slots.push([key, value as Slot<State>]);
      else if (isStatic(value, key)) values[key] = resolve(value, key, host);
      // Read again each time the component reads it, as Svelte reads a prop written inline.
      else
        Object.defineProperty(values, key, {
          get: () => resolve(value, key, host),
          enumerable: true,
        });
    }
    const [only, ...more] = children;
    if (only !== undefined) slots.push(["children", more.length === 0 ? only : children]);
    return { values, slots };
  }

  const { values, slots } = untrack(() => split(node, host));
</script>

<Snippets
  component={COMPONENTS[node.name] as Component<Record<string, unknown>>}
  props={values}
  {slots}
  {host}
/>
