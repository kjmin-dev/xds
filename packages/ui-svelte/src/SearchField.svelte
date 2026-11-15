<!--
  @component
  A text field for a query: TextField's box as a pill, with a search icon in front and, while
  there is a value, a control that clears it. Escape clears too.

  Use it to filter or search what is on the screen. For a value that is saved with a form, use a
  TextField, which has a visible label.
-->
<script module lang="ts">
  import type { SearchFieldBaseProps } from "@acme/ui-core";

  export type SearchFieldProps = SearchFieldBaseProps & {
    onChange: (value: string) => void;
    /** Called with the query on Enter, or on the search key of a software keyboard. */
    onSubmit?: (value: string) => void;
  };
</script>

<script lang="ts">
  import { keepValue } from "./controlled.ts";
  import Icon from "./Icon.svelte";

  let { value, label, placeholder, disabled, clearLabel, onChange, onSubmit }: SearchFieldProps =
    $props();

  let input = $state<HTMLInputElement>();
</script>

<div class="text-field">
  <div class="text-field__control text-field__control--pill text-field__group">
    <span class="text-field__slot text-field__slot--leading"><Icon name="search" size="sm" /></span>
    <!-- Escape clears only while there is something to clear; an empty field lets Escape
         through to whatever it sits in, such as a dialog. -->
    <input
      bind:this={input}
      type="text"
      class="text-field__input"
      aria-label={label}
      enterkeyhint="search"
      {placeholder}
      {value}
      defaultValue={value}
      {disabled}
      data-uses-escape={value !== "" ? "" : undefined}
      oninput={(event) => {
        onChange(event.currentTarget.value);
        if (!(event instanceof InputEvent && event.isComposing))
          keepValue(event.currentTarget, () => value);
      }}
      oncompositionend={(event) => keepValue(event.currentTarget, () => value)}
      onkeydown={(event) => {
        // While a composition is open, Enter and Escape belong to the input method.
        if (event.isComposing) return;
        if (event.key === "Enter") onSubmit?.(value);
        if (event.key === "Escape" && value !== "") {
          event.stopPropagation();
          onChange("");
        }
      }}
    />
    {#if value !== "" && !disabled}
      <span class="text-field__slot text-field__slot--trailing">
        <button
          type="button"
          aria-label={clearLabel ?? "Clear"}
          onclick={() => {
            onChange("");
            // The control is about to disappear, and focus would be lost with it.
            input?.focus();
          }}
          class="-me-1 flex size-acme-target-min cursor-pointer items-center justify-center rounded-acme-full hover:text-acme-field-text focus-visible:outline-(length:--acme-focus-width) focus-visible:outline-acme-border-focus focus-visible:outline-solid"
        >
          <Icon name="circle-x" size="sm" />
        </button>
      </span>
    {/if}
  </div>
</div>
