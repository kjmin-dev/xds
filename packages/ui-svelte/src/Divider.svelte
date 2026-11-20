<!--
  @component
  A line between groups of content. Decorative lines use the low-contrast border color.
-->
<script module lang="ts">
  import type { RootProps } from "./root.ts";

  export type DividerProps = RootProps;
</script>

<script lang="ts">
  import { classes, dividerClass, rootPart } from "@acme/ui-core";

  let { class: className, style }: DividerProps = $props();
</script>

<hr class={classes(rootPart("Divider"), dividerClass, className)} {style} />
