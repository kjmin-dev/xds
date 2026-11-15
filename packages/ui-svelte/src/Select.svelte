<!--
  @component
  A field for choosing one option from a list too long to show at once. Closed, it looks like a
  TextField; pressed, it opens the list under itself with a Menu's surface, as wide as the field.
  Choosing an option calls `onChange` and closes the list; a press outside or Escape closes it
  too.

  The field is a button that says it opens a list box and whether the list is open. In the list
  the arrow keys move, typing jumps to an option, and Enter chooses. The chosen option is
  selected for assistive technology and marked with a check.
-->
<script module lang="ts">
  import type { SelectBaseProps } from "@acme/ui-core";

  export type { SelectOption } from "@acme/ui-core";

  export type SelectProps<Value extends string = string> = SelectBaseProps<Value> & {
    onChange: (value: Value) => void;
  };
</script>

<script lang="ts" generics="Value extends string = string">
  import { space } from "@acme/tokens";
  import { keepListKeys, type SelectOption, selectOptionIds } from "@acme/ui-core";
  import * as select from "@zag-js/select";
  import { mergeProps, normalizeProps, useMachine } from "@zag-js/svelte";
  import type { HTMLAttributes, HTMLLabelAttributes } from "svelte/elements";
  import Icon from "./Icon.svelte";
  import { modalPopover } from "./modal-popover.svelte.ts";
  import Portal from "./Portal.svelte";
  import { createPresence } from "./presence.svelte.ts";

  type KeyHandler = (event: KeyboardEvent) => void;

  let {
    label,
    options,
    value,
    placeholder,
    description,
    error,
    name,
    disabled,
    onChange,
  }: SelectProps<Value> = $props();

  const id = $props.id();
  const valueId = `${id}-value`;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const invalid = $derived(error !== undefined);
  const collection = $derived(
    select.collection<SelectOption<Value>>({
      items: [...options],
      itemToValue: (option) => option.value,
      itemToString: (option) => option.label,
    }),
  );
  const service = useMachine(select.machine, () => ({
    id,
    collection,
    value: value === undefined ? [] : [value],
    onValueChange: (details: select.ValueChangeDetails<SelectOption<Value>>) => {
      const next = details.value[0];
      if (next !== undefined) onChange(next as Value);
    },
    disabled,
    invalid,
    name,
    positioning: {
      placement: "bottom-start" as const,
      gutter: space[1],
      sameWidth: true,
      // The list keeps this far from the window's edges.
      overflowPadding: space[3],
    },
  }));
  const api = $derived(select.connect(service, normalizeProps));
  // Zag's key handlers read whether a search by typing is under way when the field renders, and
  // a search ends on a timer, which renders nothing: long after a search, Space would still
  // search for a space instead of opening the list or choosing. A handler taken from the
  // machine when the key comes reads it then.
  const current = () => select.connect(service, normalizeProps);
  // A span: the field is a button, which a <label> cannot point at. A press on it still focuses
  // the field.
  const labelProps = $derived.by(() => {
    const { for: _, ...rest } = api.getLabelProps() as HTMLLabelAttributes;
    return rest as HTMLAttributes<HTMLSpanElement>;
  });
  // A button that opens a list box, rather than Zag's combobox: named by the chosen option and
  // then the label, and described by the help or the error. The error is said there, so the
  // button itself does not claim to be invalid or required.
  const triggerProps = $derived.by(() => {
    const {
      role: _role,
      "aria-invalid": _invalid,
      "aria-required": _required,
      onkeydown: _onKeyDown,
      ...rest
    } = api.getTriggerProps();
    return {
      ...rest,
      // Home and End leave a closed field to the page; Zag would choose the first or the last
      // option.
      onkeydown: (event: KeyboardEvent) => {
        if (!api.open && (event.key === "Home" || event.key === "End")) return;
        (current().getTriggerProps().onkeydown as KeyHandler | undefined)?.(event);
      },
    };
  });
  let positioner = $state<HTMLDivElement>();
  let surface = $state<HTMLDivElement>();
  modalPopover(
    () => api.open,
    () => positioner,
  );
  const present = createPresence(
    () => api.open,
    () => [surface],
  );
  const content = $derived.by(() => {
    const { onkeydown: _onKeyDown, ...rest } = api.getContentProps();
    return mergeProps(rest, {
      onkeydown: (event: KeyboardEvent) => {
        keepListKeys(event, surface, ".select__item:not([data-disabled])", (value) =>
          api.setHighlightedValue(value),
        );
        (current().getContentProps().onkeydown as KeyHandler | undefined)?.(event);
      },
    });
  });
</script>

<div {...api.getRootProps()} class="select">
  <span {...labelProps} class="select__label">{label}</span>
  <button
    {...triggerProps}
    aria-labelledby={`${valueId} ${labelProps.id}`}
    aria-describedby={invalid ? errorId : description ? descriptionId : undefined}
    class="select__trigger"
  >
    <!-- The chosen option's label alone: the list's rows also hold a description and a check,
         which do not belong in the field. -->
    <span {...api.getValueTextProps()} id={valueId} class="select__value"
      >{api.valueAsString || placeholder}</span
    >
    <Icon name="chevrons-up-down" size="sm" class="text-acme-field-placeholder" />
  </button>
  <!-- One line under the box: the help, or the error in its place. -->
  {#if invalid || description}
    <div class="select__footer">
      {#if invalid}
        <span id={errorId} class="select__error">{error}</span>
      {:else}
        <span id={descriptionId} class="select__description">{description}</span>
      {/if}
    </div>
  {/if}
  <!-- What a form submits; the first option stands for no choice. Zag's props hide the select
       from assistive technology, which uses the trigger. -->
  <select {...api.getHiddenSelectProps()}>
    <option value=""></option>
    {#each options as option (option.value)}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>
  <Portal>
    {#if api.open}
      <!-- Takes a press outside, which then only closes the list. The focus stays in the list
         until the list hands it back to the field. -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="select__underlay" onmousedown={(event) => event.preventDefault()}></div>
    {/if}
    <div {...api.getPositionerProps()} bind:this={positioner} class="select__positioner">
      <!-- Shown until its exit animation ends; Zag would hide it as it closes. -->
      <div {...content} bind:this={surface} hidden={!present()} class="select__content">
        <div {...api.getListProps()} class="select__list">
          {#each collection.items as option, index (option.value)}
            {@const ids = selectOptionIds(id, index)}
            <!-- Named by its label alone, as the field shows it; the help line describes it. -->
            <div
              {...api.getItemProps({ item: option })}
              aria-labelledby={ids.label}
              aria-describedby={option.description ? ids.description : undefined}
              class="select__item"
            >
              <span class="select__item-words">
                <span
                  {...api.getItemTextProps({ item: option })}
                  id={ids.label}
                  class="select__item-label">{option.label}</span
                >
                {#if option.description}
                  <span id={ids.description} class="select__item-description"
                    >{option.description}</span
                  >
                {/if}
              </span>
              <!-- Unnamed, unlike a Menu's: the option itself reports that it is selected. -->
              {#if api.getItemState({ item: option }).selected}
                <Icon name="check" size="sm" />
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>
  </Portal>
</div>
