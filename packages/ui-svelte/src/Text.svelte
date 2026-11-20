<script module lang="ts">
  import type { TextBaseProps } from "@acme/ui-core";
  import type { Snippet } from "svelte";
  import type { RootProps } from "./root.ts";

  export type TextProps = TextBaseProps &
    RootProps & {
      /** The element to render. Pick it for the document outline (`h1`, `h2`, `p`), not for looks. */
      as?: keyof HTMLElementTagNameMap;
      children: Snippet;
    };
</script>

<script lang="ts">
  import { classes, rootPart, textClass } from "@acme/ui-core";
  import { useDefaults } from "./defaults.svelte.ts";

  let {
    variant: ownVariant,
    tone: ownTone,
    as = "p",
    class: className,
    style,
    children,
  }: TextProps = $props();

  const defaults = useDefaults("Text");
  const variant = $derived(ownVariant ?? defaults().variant);
  const tone = $derived(ownTone ?? defaults().tone);
</script>

<svelte:element
  this={as}
  class={classes(rootPart("Text"), textClass({ variant, tone }), className)}
  {style}>{@render children()}</svelte:element
>
