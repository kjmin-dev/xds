<!--
  @component
  A choice between a few views or modes, all visible at once. The selected segment is outlined as
  well as filled, so the choice does not depend on telling two greys apart.

  It is a group of native radio buttons, so the arrow keys move between segments.
-->
<script module lang="ts">
  import type { SegmentedControlBaseProps } from "@acme/ui-core";

  export type SegmentedControlProps<Value extends string> = SegmentedControlBaseProps<Value> & {
    onChange: (value: Value) => void;
  };
</script>

<script lang="ts" generics="Value extends string">
  import {
    segmentedControlClass,
    segmentedControlOptionClass,
    segmentedControlSegmentClass,
  } from "@acme/ui-core";
  import { keepChecked } from "./controlled.ts";

  let {
    options,
    value,
    "aria-label": ariaLabel,
    fullWidth,
    onChange,
  }: SegmentedControlProps<Value> = $props();

  const name = $props.id();
  let group = $state<HTMLDivElement>();
</script>

<div
  bind:this={group}
  aria-label={ariaLabel}
  role="radiogroup"
  class={segmentedControlClass(fullWidth)}
>
  {#each options as option (option.value)}
    <label class={segmentedControlOptionClass(fullWidth)}>
      <input
        type="radio"
        {name}
        value={option.value}
        class="peer sr-only"
        checked={option.value === value}
        onchange={() => {
          onChange(option.value);
          // The browser moved the dot already; where the owner kept the old value, it goes
          // back, on every radio of the group.
          for (const input of group?.querySelectorAll("input") ?? []) {
            keepChecked(input, () => input.value === value);
          }
        }}
      />
      <span class={segmentedControlSegmentClass}>{option.label}</span>
    </label>
  {/each}
</div>
