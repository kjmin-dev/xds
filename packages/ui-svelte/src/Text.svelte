<script module lang="ts">
  import type { TextBaseProps } from "@acme/ui-core";
  import type { Snippet } from "svelte";

  export type TextProps = TextBaseProps & {
    /** The element to render. Pick it for the document outline (`h1`, `h2`, `p`), not for looks. */
    as?: keyof HTMLElementTagNameMap;
    class?: string;
    children: Snippet;
  };
</script>

<script lang="ts">
  import { textClass } from "@acme/ui-core";

  let { variant, tone, as = "p", class: className, children }: TextProps = $props();
</script>

<svelte:element this={as} class={[textClass({ variant, tone }), className]}
  >{@render children()}</svelte:element
>
