<!--
  @component
  Layer 6 of the library's customization: the components inside it take `value` for the options
  they are not given, such as a Button's variant or a Text's tone. A component's own props win,
  then the closest Defaults, then the component's built-in default. A Defaults inside another
  keeps the outer one's defaults and replaces only those it names.
-->
<script module lang="ts">
  import type { ComponentDefaults } from "@acme/ui-core";
  import type { Snippet } from "svelte";

  export type { ComponentDefaults } from "@acme/ui-core";

  export type DefaultsProps = {
    /** The defaults, by component and option. It may change; the components follow it. */
    value: ComponentDefaults;
    children: Snippet;
  };
</script>

<script lang="ts">
  import { provideDefaults } from "./defaults.svelte.ts";

  let { value, children }: DefaultsProps = $props();

  provideDefaults(() => value);
</script>

{@render children()}
