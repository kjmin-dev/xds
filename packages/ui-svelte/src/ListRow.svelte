<!--
  @component
  One line of a list or a settings screen. Separate rows with a Divider.
-->
<script module lang="ts">
  import type { ListRowBaseProps } from "@acme/ui-core";
  import type { Snippet } from "svelte";
  import type { RootProps } from "./root.ts";

  export type ListRowProps = ListRowBaseProps &
    RootProps & {
      /** In front of the title: an avatar or an icon. */
      leading?: Snippet;
      /** At the far end: a value, a badge or a switch. */
      trailing?: Snippet;
      /** Makes the whole row a button. Do not put another control in `trailing` then. */
      onPress?: () => void;
    };
</script>

<script lang="ts">
  import { classes, rootPart } from "@acme/ui-core";
  import PlaceRow from "./PlaceRow.svelte";

  let { class: className, ...props }: ListRowProps = $props();
</script>

<!-- The root part is the ListRow's: a Sidebar's rows are PlaceRows, but not ListRows of the app. -->
<PlaceRow {...props} class={classes(rootPart("ListRow"), className)} current="true" />
