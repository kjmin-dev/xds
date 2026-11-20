<!--
  @component
  A surface that groups related content. A hairline outline and a trace of shadow lift it off the
  page; in dark mode, where shadows barely show, the lighter fill does that. `title` renders as a
  heading; `actions` sit across from it.
-->
<script module lang="ts">
  import type { CardBaseProps } from "@acme/ui-core";
  import type { Snippet } from "svelte";
  import type { RootProps } from "./root.ts";

  export type CardProps = CardBaseProps &
    RootProps & {
      /** Sit across from the title. A pressable card takes none: it is one button already. */
      actions?: Snippet;
      /** A picture or a drawing at the top, running edge to edge above the padding. */
      media?: Snippet;
      /** Makes the whole card one button. Put no other control inside it then. */
      onPress?: () => void;
      children?: Snippet;
    };
</script>

<script lang="ts">
  import { CARD_PARTS, cardClass, cardMediaClass, classes, rootPart } from "@acme/ui-core";

  let {
    title,
    description,
    flush,
    selected,
    actions,
    media,
    onPress,
    class: className,
    style,
    children,
  }: CardProps = $props();

  const pressable = $derived(onPress !== undefined);
  // A button may hold only phrasing content, so inside one the parts are spans. Its heading
  // would not be reachable as a heading anyway: a button reads as its text.
  const tags = $derived(
    pressable
      ? { header: "span", box: "span", title: "span", line: "span" }
      : { header: "header", box: "div", title: "h2", line: "p" },
  );
  const surface = $derived(
    classes(rootPart("Card"), cardClass({ selected, flush, pressable }), className),
  );
</script>

{#snippet parts()}
  {#if media}
    <svelte:element this={tags.box} class={cardMediaClass(flush)}>{@render media()}</svelte:element>
  {/if}
  {#if title || (actions && !pressable)}
    <svelte:element this={tags.header} class={CARD_PARTS.header}>
      <svelte:element this={tags.box} class={CARD_PARTS.heading}>
        {#if title}
          <svelte:element this={tags.title} class={CARD_PARTS.title}>{title}</svelte:element>
        {/if}
        {#if description}
          <svelte:element this={tags.line} class={CARD_PARTS.description}
            >{description}</svelte:element
          >
        {/if}
      </svelte:element>
      {#if actions && !pressable}
        <div class={CARD_PARTS.actions}>{@render actions()}</div>
      {/if}
    </svelte:element>
  {/if}
  {@render children?.()}
{/snippet}

{#snippet content()}
  {#if flush}
    <svelte:element this={tags.box} class={CARD_PARTS.flush}>{@render parts()}</svelte:element>
  {:else}
    {@render parts()}
  {/if}
{/snippet}

{#if pressable}
  <button
    type="button"
    onclick={() => onPress?.()}
    aria-pressed={selected === undefined ? undefined : selected ? "true" : "false"}
    class={surface}
    {style}
  >
    {@render content()}
  </button>
{:else}
  <section aria-current={selected ? "true" : undefined} class={surface} {style}>
    {@render content()}
  </section>
{/if}
