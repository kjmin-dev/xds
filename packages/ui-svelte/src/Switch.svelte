<!--
  @component
  Turns a setting on or off, and takes effect at once. For a choice that is applied later, with a
  form, use a Checkbox.

  It is a native checkbox with the switch role, so the keyboard, forms and screen readers treat
  it as one. The input is hidden and the track is drawn beside it.
-->
<script module lang="ts">
  import {
    classes,
    rootPart,
    type SwitchBaseProps,
    switchClass,
    switchLabelClass,
    switchThumbClass,
    switchTrackClass,
  } from "@acme/ui-core";
  import type { RootProps } from "./root.ts";

  export type SwitchProps = SwitchBaseProps &
    RootProps & {
      onChange: (checked: boolean) => void;
    };
</script>

<script lang="ts">
  import { keepChecked } from "./controlled.ts";

  let {
    checked,
    label,
    "aria-label": ariaLabel,
    disabled,
    onChange,
    class: className,
    style,
  }: SwitchProps = $props();
</script>

<label class={classes(rootPart("Switch"), switchClass, className)} {style}>
  <input
    type="checkbox"
    role="switch"
    aria-checked={checked ? "true" : "false"}
    aria-label={ariaLabel}
    class="peer sr-only"
    {checked}
    defaultChecked={checked}
    {disabled}
    onchange={(event) => {
      onChange(event.currentTarget.checked);
      keepChecked(event.currentTarget, () => checked);
    }}
  />
  <span class={switchTrackClass}><span class={switchThumbClass}></span></span>
  {#if label}
    <span class={switchLabelClass}>{label}</span>
  {/if}
</label>
