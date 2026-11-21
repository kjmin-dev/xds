<!--
  @component
  How far along something is, from 0 to 1. For work of unknown length use a Spinner. `label` says
  what is progressing; a screen reader reads it with the percentage.
-->
<script module lang="ts">
  import type { ProgressBarBaseProps } from "@acme/ui-core";
  import type { RootProps } from "./root.ts";

  export type ProgressBarProps = ProgressBarBaseProps & RootProps;
</script>

<script lang="ts">
  import {
    classes,
    progressBarClass,
    progressBarFillClass,
    progressPercent,
    rootPart,
  } from "@acme/ui-core";

  let { value, label, class: className, style }: ProgressBarProps = $props();

  const percent = $derived(progressPercent(value));
</script>

<div
  role="progressbar"
  aria-label={label}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={percent}
  class={classes(rootPart("ProgressBar"), progressBarClass, className)}
  {style}
>
  <div class={progressBarFillClass} style:width="{percent}%"></div>
</div>
