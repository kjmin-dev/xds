<!--
  @component
  A choice that is applied later, with the form it belongs to. A native checkbox: the input is
  hidden and the box is drawn beside it.
-->
<script module lang="ts">
  import type { CheckboxBaseProps } from "@acme/ui-core";

  export type CheckboxProps = CheckboxBaseProps & {
    onChange: (checked: boolean) => void;
  };
</script>

<script lang="ts">
  import {
    CHECKBOX_MARK,
    checkboxBoxClass,
    checkboxClass,
    checkboxLabelClass,
    checkboxMarkClass,
  } from "@acme/ui-core";
  import { keepChecked } from "./controlled.ts";

  let {
    checked,
    label,
    "aria-label": ariaLabel,
    name,
    disabled,
    onChange,
  }: CheckboxProps = $props();
</script>

<label class={checkboxClass}>
  <input
    type="checkbox"
    aria-label={ariaLabel}
    class="peer sr-only"
    {checked}
    defaultChecked={checked}
    {disabled}
    name={name || undefined}
    onchange={(event) => {
      onChange(event.currentTarget.checked);
      keepChecked(event.currentTarget, () => checked);
    }}
  />
  <span class={checkboxBoxClass}>
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" class={checkboxMarkClass}>
      <path
        d={CHECKBOX_MARK}
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </span>
  {#if label}
    <span class={checkboxLabelClass}>{label}</span>
  {/if}
</label>
