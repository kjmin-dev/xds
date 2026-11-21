<!--
  @component
  An icon from design/icons. It takes the color of the text around it. An arrow or a chevron
  mirrors itself in a right-to-left layout when given `rtl:-scale-x-100` in `class`.
-->
<script module lang="ts">
  import type { IconBaseProps } from "@acme/ui-core";
  import type { RootProps } from "./root.ts";

  export type IconProps = IconBaseProps & RootProps;
</script>

<script lang="ts">
  import { icons } from "@acme/tokens";
  import { classes, iconClass, rootPart } from "@acme/ui-core";
  import { useDefaults } from "./defaults.svelte.ts";

  let { name, size: ownSize, filled, label, class: className, style }: IconProps = $props();

  const defaults = useDefaults("Icon");
  const size = $derived(ownSize ?? defaults().size);
</script>

<svg
  viewBox="0 0 24 24"
  fill={filled ? "currentColor" : "none"}
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  class={classes(rootPart("Icon"), iconClass(size), className)}
  {style}
  role={label ? "img" : undefined}
  aria-label={label || undefined}
  aria-hidden={label ? undefined : "true"}
>
  {#each icons[name] as path, index (index)}<path d={path} />{/each}
</svg>
