<!--
  @component
  An icon from design/icons. It takes the color of the text around it. An arrow or a chevron
  mirrors itself in a right-to-left layout when given `rtl:-scale-x-100` in `class`.
-->
<script module lang="ts">
  import type { IconBaseProps } from "@acme/ui-core";

  export type IconProps = IconBaseProps & {
    class?: string;
  };
</script>

<script lang="ts">
  import { icons } from "@acme/tokens";
  import { iconClass } from "@acme/ui-core";

  let { name, size, filled, label, class: className }: IconProps = $props();
</script>

<svg
  viewBox="0 0 24 24"
  fill={filled ? "currentColor" : "none"}
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  class={[iconClass(size), className]}
  role={label ? "img" : undefined}
  aria-label={label || undefined}
  aria-hidden={label ? undefined : "true"}
>
  {#each icons[name] as path, index (index)}<path d={path} />{/each}
</svg>
