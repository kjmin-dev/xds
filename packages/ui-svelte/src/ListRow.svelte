<!--
  @component
  One line of a list or a settings screen. Separate rows with a Divider.
-->
<script module lang="ts">
  import type { ListRowBaseProps } from "@acme/ui-core";
  import type { Snippet } from "svelte";

  export type ListRowProps = ListRowBaseProps & {
    /** In front of the title: an avatar or an icon. */
    leading?: Snippet;
    /** At the far end: a value, a badge or a switch. */
    trailing?: Snippet;
    /** Makes the whole row a button. Do not put another control in `trailing` then. */
    onPress?: () => void;
  };
</script>

<script lang="ts">
  import PlaceRow from "./PlaceRow.svelte";

  let props: ListRowProps = $props();
</script>

<PlaceRow {...props} current="true" />
