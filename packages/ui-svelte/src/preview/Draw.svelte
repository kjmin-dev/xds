<!--
  @component
  Draws a slot of a screen: an array is its children side by side; a string or a number is text;
  a function is text that follows the state; a `show` node is its children while its condition
  holds and its fallback otherwise; an `element` node is its tag, and a `component` node the
  library's component of that name.
-->
<script lang="ts">
  import {
    type Child,
    type Host,
    isNode,
    resolve,
    type Slot,
    type State,
  } from "@acme/ui-core/preview";
  import type { Snippet } from "svelte";
  import Component from "./Component.svelte";
  import Self from "./Draw.svelte";

  let { content, host }: { content: Slot<State> | undefined; host: Host<Snippet> } = $props();

  const many = (slot: Slot<State> | undefined): slot is readonly Child<State>[] =>
    Array.isArray(slot);

  // An element's attributes, read again where they follow the state. The data names style
  // properties as CSS does, which is what the style attribute takes.
  const attributes = (props: Readonly<Record<string, unknown>>) =>
    Object.fromEntries(
      Object.entries(props).map(([key, value]) => [
        key,
        key === "style"
          ? Object.entries(value as Record<string, string>)
              .map(([name, css]) => `${name}: ${css}`)
              .join("; ")
          : resolve(value, key, host),
      ]),
    );
</script>

{#if many(content)}
  {#each content as child, index (index)}<Self content={child} {host} />{/each}
{:else if typeof content === "function"}
  {content(host.state)}
{:else if !isNode(content)}
  {content}
{:else if content.kind === "show"}
  {#if content.when(host.state)}
    <Self content={content.children} {host} />
  {:else}
    <Self content={content.fallback} {host} />
  {/if}
{:else if content.kind === "element" && content.children.length === 0}
  <!-- Apart, since a void element such as img can take no children block. -->
  <svelte:element this={content.tag} {...attributes(content.props)} />
{:else if content.kind === "element"}
  <svelte:element this={content.tag} {...attributes(content.props)}
    >{#each content.children as child, index (index)}<Self
        content={child}
        {host}
      />{/each}</svelte:element
  >
{:else}
  <Component node={content} {host} />
{/if}
