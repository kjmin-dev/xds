<!--
  @component
  One choice among a few, applied later with the form it belongs to. For a choice that takes
  effect at once among two to four options, a SegmentedControl is the usual pick.

  The chosen option has a dot and a thicker ring, so the choice does not depend on color. The
  options are native radio buttons, hidden and drawn beside, in a group named by the legend: the
  arrow keys move between them, and the error is tied to the group and announced.
-->
<script module lang="ts">
  import type { RadioGroupBaseProps } from "@acme/ui-core";
  import type { RootProps } from "./root.ts";

  export type { RadioOption } from "@acme/ui-core";

  export type RadioGroupProps<Value extends string = string> = RadioGroupBaseProps<Value> &
    RootProps & {
      onChange: (value: Value) => void;
    };
</script>

<script lang="ts" generics="Value extends string = string">
  import { classes } from "@acme/ui-core";
  import { keepChecked } from "./controlled.ts";

  let {
    label,
    options,
    value,
    disabled,
    error,
    name,
    onChange,
    class: className,
    style,
  }: RadioGroupProps<Value> = $props();

  const id = $props.id();
  const labelId = `${id}-label`;
  const errorId = `${id}-error`;
  const invalid = $derived(error !== undefined);
  let group = $state<HTMLDivElement>();
</script>

<div
  bind:this={group}
  role="radiogroup"
  aria-labelledby={labelId}
  aria-describedby={invalid ? errorId : undefined}
  aria-invalid={invalid ? "true" : undefined}
  aria-disabled={disabled ? "true" : undefined}
  aria-orientation="vertical"
  class={classes("acme-radio-group", className)}
  {style}
>
  <span id={labelId} class="acme-radio-group__label">{label}</span>
  <div class="acme-radio-group__options">
    {#each options as option, index (option.value)}
      <label class="acme-radio-group__option">
        <!-- The description is inside the pressable row, so the row's text would name the radio
             together with it. The label alone names it; the description describes it.
             aria-invalid is on each radio as well as the group, so it is heard on the radio that
             has focus. -->
        <!-- svelte-ignore a11y_role_supports_aria_props_implicit -->
        <input
          type="radio"
          class="acme-radio-group__input sr-only"
          name={name ?? id}
          value={option.value}
          checked={option.value === value}
          defaultChecked={option.value === value}
          {disabled}
          aria-labelledby={`${id}-${index}`}
          aria-describedby={[
            option.description ? `${id}-${index}-description` : undefined,
            invalid ? errorId : undefined,
          ]
            .filter(Boolean)
            .join(" ") || undefined}
          aria-invalid={invalid ? "true" : undefined}
          onchange={() => {
            onChange(option.value);
            // The browser moved the dot already; where the owner kept the old value, it goes
            // back, on every radio of the group.
            for (const input of group?.querySelectorAll("input") ?? []) {
              keepChecked(input, () => input.value === value);
            }
          }}
        />
        <span class="acme-radio-group__row">
          <span class="acme-radio-group__circle-line">
            <span class="acme-radio-group__circle"><span class="acme-radio-group__dot"></span></span
            >
          </span>
          <span class="acme-radio-group__words">
            <span id={`${id}-${index}`} class="acme-radio-group__text">{option.label}</span>
            {#if option.description}
              <span id={`${id}-${index}-description`} class="acme-radio-group__description"
                >{option.description}</span
              >
            {/if}
          </span>
        </span>
      </label>
    {/each}
  </div>
  <!-- The region is there before the error is, so that the error is announced when it appears.
       Empty, it takes no room. -->
  <div aria-live="polite">
    {#if invalid}
      <span id={errorId} class="acme-radio-group__error">{error}</span>
    {/if}
  </div>
</div>
