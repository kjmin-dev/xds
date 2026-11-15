<!--
  @component
  A ListRow that says what kind of current item its selected state is. A Sidebar's rows are the
  places of an app, so its selected row is the current page. Only for this package's own
  components: the index does not export it.
-->
<script lang="ts">
  import {
    LIST_ROW_PARTS,
    listRowClass,
    listRowDescriptionClass,
    listRowTitleClass,
  } from "@acme/ui-core";
  import Icon from "./Icon.svelte";
  import type { ListRowProps } from "./ListRow.svelte";

  let {
    title,
    description,
    chevron,
    selected,
    compact,
    disabled,
    leading,
    trailing,
    onPress,
    current: kind,
  }: ListRowProps & { current: "true" | "page" } = $props();

  const current = $derived(selected ? kind : undefined);
  const row = $derived(listRowClass({ compact, selected, pressable: onPress !== undefined }));
</script>

{#snippet content()}
  {@render leading?.()}
  <span class={LIST_ROW_PARTS.text}>
    <span class={listRowTitleClass({ compact, selected, disabled })}>{title}</span>
    {#if description}
      <span class={listRowDescriptionClass(compact)}>{description}</span>
    {/if}
  </span>
  {@render trailing?.()}
  {#if chevron}
    <Icon name="chevron-right" size="sm" class={LIST_ROW_PARTS.chevron} />
  {/if}
{/snippet}

{#if onPress}
  <button aria-current={current} type="button" {disabled} onclick={() => onPress()} class={row}>
    {@render content()}
  </button>
{:else}
  <div aria-current={current} class={row}>{@render content()}</div>
{/if}
