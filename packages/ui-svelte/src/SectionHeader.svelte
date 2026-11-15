<!--
  @component
  The title row of a group of content. The title is a heading at `level`; the action is a quiet
  button with a chevron at its end edge, which points the other way in a right-to-left layout.
-->
<script module lang="ts">
  import type { SectionHeaderBaseProps } from "@acme/ui-core";

  export type SectionHeaderProps = SectionHeaderBaseProps & {
    /** A link-like action at the end, such as "See all". */
    action?: { label: string; onPress: () => void };
  };
</script>

<script lang="ts">
  import { SECTION_HEADER_PARTS } from "@acme/ui-core";
  import Button from "./Button.svelte";
  import Icon from "./Icon.svelte";

  let { title, description, icon, level = 2, action }: SectionHeaderProps = $props();
</script>

<div class={SECTION_HEADER_PARTS.root}>
  <div class={SECTION_HEADER_PARTS.lead}>
    {#if icon}
      <span class={SECTION_HEADER_PARTS.icon}><Icon name={icon} size="md" /></span>
    {/if}
    <div class={SECTION_HEADER_PARTS.text}>
      <svelte:element this={`h${level}`} class={SECTION_HEADER_PARTS.title}>{title}</svelte:element>
      {#if description}
        <p class={SECTION_HEADER_PARTS.description}>{description}</p>
      {/if}
    </div>
  </div>
  {#if action}
    <span class={SECTION_HEADER_PARTS.action}>
      <Button variant="ghost" size="sm" onPress={() => action.onPress()}
        >{action.label}<Icon
          name="chevron-right"
          size="sm"
          class={SECTION_HEADER_PARTS.chevron}
        /></Button
      >
    </span>
  {/if}
</div>
