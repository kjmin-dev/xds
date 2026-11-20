<!--
  @component
  A labelled text field, of one line or several. The label, the description and the error message
  are tied to the input for assistive technology, and the error is announced when it appears.

  An invalid field blocks its form from being submitted, so `error` has to be cleared as soon as
  the person edits the value.
-->
<script module lang="ts">
  import type { TextFieldBaseProps } from "@acme/ui-core";
  import type { Snippet } from "svelte";
  import type { RootProps } from "./root.ts";

  export type TextFieldProps = TextFieldBaseProps &
    RootProps & {
      onChange: (value: string) => void;
      /**
       * Inside the box, in front of the text: an icon, a unit. It takes the placeholder's color
       * unless it sets its own.
       */
      leading?: Snippet;
      /** Inside the box, after the text: an icon, a unit, a small button. */
      trailing?: Snippet;
    };
</script>

<script lang="ts">
  import { classes } from "@acme/ui-core";
  import { untrack } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import { keepValue } from "./controlled.ts";

  let {
    label,
    value,
    description,
    error,
    placeholder,
    multiline,
    rows = 3,
    maxLength,
    name,
    type = "text",
    inputMode,
    autoComplete,
    autoFocus,
    required,
    disabled,
    onChange,
    leading,
    trailing,
    class: className,
    style,
  }: TextFieldProps = $props();

  const id = $props.id();
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const invalid = $derived(error !== undefined);
  const describedBy = $derived(invalid ? errorId : description ? descriptionId : undefined);

  // Once the field is on the page.
  const settle: Attachment<HTMLInputElement | HTMLTextAreaElement> = (input) => {
    // The value is set as a property, which leaves a text area's caret after the last line,
    // and keyboard focus would then scroll to it. React renders the first value as the text
    // area's own text, with the caret before the first line.
    if (input instanceof HTMLTextAreaElement) input.setSelectionRange(0, 0);
    if (untrack(() => autoFocus)) input.focus();
  };

  function oninput(event: Event & { currentTarget: HTMLInputElement | HTMLTextAreaElement }) {
    onChange(event.currentTarget.value);
    // While a composition is open the text belongs to the input method; it ends with
    // compositionend.
    if (!(event instanceof InputEvent && event.isComposing))
      keepValue(event.currentTarget, () => value);
  }

  function oncompositionend(
    event: CompositionEvent & { currentTarget: HTMLInputElement | HTMLTextAreaElement },
  ) {
    keepValue(event.currentTarget, () => value);
  }
</script>

<!-- The input draws the box itself until something sits inside the box beside the text. -->
{#snippet field(box: boolean)}
  {#if multiline}
    <textarea
      {@attach settle}
      {rows}
      {id}
      class={box ? "acme-text-field__input acme-text-field__control" : "acme-text-field__input"}
      {value}
      defaultValue={value}
      {placeholder}
      {name}
      maxlength={maxLength}
      inputmode={inputMode}
      autocomplete={autoComplete as HTMLTextAreaElement["autocomplete"]}
      {required}
      {disabled}
      aria-invalid={invalid ? "true" : undefined}
      aria-errormessage={invalid ? errorId : undefined}
      aria-describedby={describedBy}
      {oninput}
      {oncompositionend}></textarea>
  {:else}
    <input
      {@attach settle}
      {type}
      {id}
      class={box ? "acme-text-field__input acme-text-field__control" : "acme-text-field__input"}
      {value}
      defaultValue={value}
      {placeholder}
      {name}
      maxlength={maxLength}
      inputmode={inputMode}
      autocomplete={autoComplete as HTMLInputElement["autocomplete"]}
      {required}
      {disabled}
      aria-invalid={invalid ? "true" : undefined}
      aria-errormessage={invalid ? errorId : undefined}
      aria-describedby={describedBy}
      {oninput}
      {oncompositionend}
    />
  {/if}
{/snippet}

<div class={classes("acme-text-field", className)} {style}>
  <label for={id} class="acme-text-field__label">{label}</label>
  {#if leading || trailing}
    <div class="acme-text-field__control acme-text-field__group">
      {#if leading}
        <span class="acme-text-field__slot acme-text-field__slot--leading">{@render leading()}</span
        >
      {/if}
      {@render field(false)}
      {#if trailing}
        <span class="acme-text-field__slot acme-text-field__slot--trailing"
          >{@render trailing()}</span
        >
      {/if}
    </div>
  {:else}
    {@render field(true)}
  {/if}
  <!-- One line under the box: the help or the error at the start edge, the count at the end.
       The error is a live region, so it is announced when it appears. -->
  <div class="acme-text-field__footer">
    {#if !invalid && description}
      <span id={descriptionId} class="acme-text-field__description">{description}</span>
    {/if}
    <span id={errorId} class="acme-text-field__error" aria-live="polite">{error}</span>
    {#if maxLength !== undefined}
      <span class="ms-auto shrink-0 text-acme-footnote text-acme-text-secondary tabular-nums"
        >{value.length}/{maxLength}</span
      >
    {/if}
  </div>
</div>
