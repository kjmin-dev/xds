<!--
  @component
  How far along something is, from 0 to 1. For work of unknown length use a Spinner. `label` says
  what is progressing; a screen reader reads it with the percentage.
-->
<script module lang="ts">
  import type { ProgressBarBaseProps } from "@acme/ui-core";

  export type ProgressBarProps = ProgressBarBaseProps;
</script>

<script lang="ts">
  import { progressBarClass, progressBarFillClass, progressPercent } from "@acme/ui-core";

  let { value, label }: ProgressBarProps = $props();

  const percent = $derived(progressPercent(value));
</script>

<div
  role="progressbar"
  aria-label={label}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={percent}
  class={progressBarClass}
>
  <div class={progressBarFillClass} style:width="{percent}%"></div>
</div>
