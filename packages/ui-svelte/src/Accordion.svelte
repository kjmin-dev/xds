<!--
  @component
  Items whose bodies open and close under their titles, separated by hairlines. The chevron turns
  over when an item is open, so the state does not depend on color. Opening and closing animate
  the height, and do not for people who ask for less motion.

  Each title is a heading holding a button that says whether its body is expanded and which body
  it controls. A closed body is hidden, but the browser's find in page still opens it.
-->
<script module lang="ts">
  import type { AccordionBaseProps, AccordionItemBase } from "@acme/ui-core";
  import type { Snippet } from "svelte";

  export type AccordionItem<Value extends string = string> = AccordionItemBase<Value> & {
    /** The body, shown under the title while the item is open: text, or a snippet. */
    content: string | Snippet;
  };

  export type AccordionProps<Value extends string = string> = AccordionBaseProps<Value> & {
    items: readonly AccordionItem<Value>[];
    onChange: (expanded: Value[]) => void;
  };
</script>

<script lang="ts" generics="Value extends string = string">
  import { ACCORDION_PARTS, focusTitleOnClick } from "@acme/ui-core";
  import * as accordion from "@zag-js/accordion";
  import { mergeProps, normalizeProps, useMachine } from "@zag-js/svelte";
  import AccordionPanel from "./AccordionPanel.svelte";
  import Icon from "./Icon.svelte";

  let { items, expanded, multiple = false, onChange }: AccordionProps<Value> = $props();

  const id = $props.id();
  const service = useMachine(accordion.machine, () => ({
    id,
    value: [...expanded],
    onValueChange: (details: accordion.ValueChangeDetails) => onChange(details.value as Value[]),
    multiple,
    collapsible: true,
    hiddenUntilFound: true,
  }));
  const api = $derived(accordion.connect(service, normalizeProps));
  const body = (value: Value) => {
    // The panel hides itself once it has finished closing; see AccordionPanel.
    const { hidden: _hidden, ...attributes } = api.getItemContentProps({ value });
    return attributes;
  };
</script>

<div {...api.getRootProps()} class="accordion">
  {#each items as item (item.value)}
    <div {...api.getItemProps({ value: item.value })} class="accordion__item">
      <h3 {...api.getItemHeaderProps({ value: item.value })} class="accordion__heading">
        <button
          {...mergeProps(api.getItemTriggerProps({ value: item.value }), {
            // Runs before Zag's handler.
            onclick: focusTitleOnClick,
          })}
          class="accordion__trigger group"
        >
          <span class={ACCORDION_PARTS.text}>
            <span class={ACCORDION_PARTS.title}>{item.title}</span>
            {#if item.description}
              <span class={ACCORDION_PARTS.description}>{item.description}</span>
            {/if}
          </span>
          <Icon name="chevron-down" size="sm" class={ACCORDION_PARTS.chevron} />
        </button>
      </h3>
      <AccordionPanel open={api.value.includes(item.value)} attributes={body(item.value)}>
        {#if typeof item.content === "string"}{item.content}{:else}{@render item.content()}{/if}
      </AccordionPanel>
    </div>
  {/each}
</div>
