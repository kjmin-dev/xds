<!--
  @component
  A short status or category. The words carry the meaning; the color only reinforces it, so a
  badge still reads for someone who cannot tell the tones apart. `dot` adds a small mark for live
  states such as "connected", and `icon` a drawing in front of the words.
-->
<script module lang="ts">
  import type { BadgeBaseProps } from "@acme/ui-core";
  import type { Snippet } from "svelte";
  import type { RootProps } from "./root.ts";

  export type { BadgeTone } from "@acme/ui-core";

  export type BadgeProps = BadgeBaseProps &
    RootProps & {
      children: Snippet;
    };
</script>

<script lang="ts">
  import { badgeClass, badgeDotClass, classes, rootPart } from "@acme/ui-core";
  import { useDefaults } from "./defaults.svelte.ts";
  import Icon from "./Icon.svelte";

  let { tone: ownTone, dot, icon, class: className, style, children }: BadgeProps = $props();

  const defaults = useDefaults("Badge");
  const tone = $derived(ownTone ?? defaults().tone);
</script>

<span class={classes(rootPart("Badge"), badgeClass(tone), className)} {style}
  >{#if dot}<span aria-hidden="true" class={badgeDotClass}></span>{/if}{#if icon}<Icon
      name={icon}
      size="xs"
    />{/if}{@render children()}</span
>
