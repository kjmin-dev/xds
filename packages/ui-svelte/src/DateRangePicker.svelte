<!--
  @component
  A field for choosing a range of days, a start and an end, as for a stay. Closed, it looks like a
  DatePicker and shows both days in the locale's medium form ("Mar 10 – 14, 2026"), or the
  placeholder. Pressed, it opens a calendar under itself, two months side by side where the window
  has room and one where it does not, on the start's month, or on today's while nothing is chosen.

  The first day pressed starts the range, and the band previews it to the day under the pointer or
  the keyboard's focus. The second ends it, if the days between are at least `minLength` and at
  most `maxLength`, which leave the other days unavailable meanwhile: `onChange` gets the range and
  the calendar closes. A day before the start starts again from there. Escape or a press outside
  closes the calendar without a change.

  The keys are DatePicker's, and Page Up and Page Down move a month whether one or two are shown.
  Each month is a grid named by its month; every day of the range is selected, and the two ends
  are named by `startLabel` and `endLabel` before the day.
-->
<script module lang="ts">
  import type { DateRange, DateRangePickerBaseProps } from "@acme/ui-core";
  import type { RootProps } from "./root.ts";

  export type { DateRange } from "@acme/ui-core";

  export type DateRangePickerProps = DateRangePickerBaseProps &
    RootProps & {
      onChange: (value: DateRange) => void;
    };
</script>

<script lang="ts">
  import {
    classes,
    DATE_PICKER_NAV_CLASS,
    dateRangeMachineProps,
    datePickerContentAttrs,
    datePickerIds,
    datePickerLocale,
    datePickerTriggerAttrs,
    endRangeChoiceOnClose,
    focusOpeningDay,
    formatRange,
    keepCalendarFocus,
    keepDayFocused,
    keepRangePreview,
    type RangeDraft,
    rangeDayClick,
    rangeGridKeyDown,
    rangeMonths,
    rangeMonthViews,
    rangeSummary,
    shownRange,
  } from "@acme/ui-core";
  import * as datePicker from "@zag-js/date-picker";
  import { mergeProps, normalizeProps, useMachine } from "@zag-js/svelte";
  import { untrack } from "svelte";
  import Icon from "./Icon.svelte";
  import { modalPopover } from "./modal-popover.svelte.ts";
  import Portal from "./Portal.svelte";
  import { createPresence } from "./presence.svelte.ts";

  // The rest stays reactive: the machine's props read it each time it changes.
  let { onChange, class: className, style, ...props }: DateRangePickerProps = $props();

  const id = $props.id();
  const ids = datePickerIds(id);
  const locale = datePickerLocale();
  // A start alone while the end is chosen; null while the calendar shows the chosen range.
  let draft = $state.raw<RangeDraft | null>(null);
  let months = $state(1);
  const shown = $derived(shownRange(props.value, draft));
  const service = useMachine(datePicker.machine, () =>
    dateRangeMachineProps(props, shown, {
      id,
      locale,
      months,
      onDraft: (next) => (draft = next),
      onChange,
    }),
  );
  const api = $derived(datePicker.connect(service, normalizeProps));
  const trigger = $derived(api.getTriggerProps());
  const invalid = $derived(props.error !== undefined);
  const summary = $derived(rangeSummary(shown, props, locale));
  const views = $derived(rangeMonthViews(api, months));
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
  // Strings, so that the effects below run only when the focused day or the month changes, not
  // on every change of the machine.
  const focused = $derived(api.focusedValue.toString());
  const month = $derived(api.visibleRange.start.toString());
  const open = $derived(api.open);
  $effect(() => {
    const isOpen = open;
    void focused;
    void month;
    untrack(() => keepDayFocused(isOpen, surface));
  });
  $effect(() => {
    const isOpen = open;
    untrack(() => endRangeChoiceOnClose(service, isOpen));
  });
  $effect(() => {
    void focused;
    untrack(() => keepRangePreview(service, shown, open));
  });
</script>

<!-- Merged, so that the app's style joins any the machine writes on the root. -->
<div
  {...mergeProps(api.getRootProps(), {
    class: classes("acme-date-picker acme-date-range-picker", className),
    style,
  })}
>
  <!-- A span: the field is a button, which a <label> cannot point at. -->
  <span id={ids.label} class="acme-date-picker__label">{props.label}</span>
  <!-- What Zag places the calendar against. -->
  <div {...api.getControlProps()} class="acme-date-picker__control">
    <button
      {...trigger}
      {...datePickerTriggerAttrs(props, ids)}
      type="button"
      onclick={(event) => {
        if (!api.open) months = rangeMonths();
        focusOpeningDay(api, { ...props, value: props.value?.start });
        trigger.onclick?.(event);
      }}
      class="acme-date-picker__trigger"
    >
      <span id={ids.value} class="acme-date-picker__value"
        >{props.value === undefined ? props.placeholder : formatRange(props.value, locale)}</span
      >
      <Icon name="calendar" size="sm" class="text-acme-field-placeholder" />
    </button>
  </div>
  <!-- One line under the box: the help, or the error in its place. -->
  {#if invalid || props.description}
    <div class="acme-date-picker__footer">
      {#if invalid}
        <span id={ids.error} class="acme-date-picker__error">{props.error}</span>
      {:else}
        <span id={ids.description} class="acme-date-picker__description">{props.description}</span>
      {/if}
    </div>
  {/if}
  <!-- What a form submits. Zag gives the names to its text inputs, which are not drawn. -->
  {#if props.startName !== undefined}
    <input type="hidden" name={props.startName} value={props.value?.start ?? ""} />
  {/if}
  {#if props.endName !== undefined}
    <input type="hidden" name={props.endName} value={props.value?.end ?? ""} />
  {/if}
  <Portal>
    {#if api.open}
      <!-- Takes a press outside, which then only closes the calendar. The focus stays in the
         calendar until it hands it back to the field. -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="acme-date-picker__underlay" onmousedown={(event) => event.preventDefault()}></div>
    {/if}
    <div {...api.getPositionerProps()} bind:this={positioner} class="acme-date-picker__positioner">
      <!-- Shown until its exit animation ends; Zag would hide it as it closes. -->
      <div
        {...api.getContentProps()}
        {...datePickerContentAttrs(ids)}
        bind:this={surface}
        hidden={!present()}
        onkeydown={(event) => keepCalendarFocus(event, surface)}
        class="acme-date-picker__content acme-date-range-picker__content"
      >
        <div class="acme-date-range-picker__summary" aria-live="polite">
          <span>{summary.start}</span>
          <span>{summary.end}</span>
        </div>
        <div class="acme-date-range-picker__months">
          {#each views as view (view.index)}
            {@const table = api.getTableProps({ view: "day", id: view.table.id })}
            <div class="acme-date-range-picker__month">
              <div class="acme-date-picker__header">
                {#if view.index === 0}
                  <button
                    {...api.getPreviousTriggerProps()}
                    type="button"
                    class={DATE_PICKER_NAV_CLASS}
                  >
                    <Icon name="chevron-left" size="sm" />
                  </button>
                {:else}
                  <span class="acme-date-range-picker__nav-space"></span>
                {/if}
                <span {...api.getRangeTextProps()} class="acme-date-picker__heading"
                  >{view.name}</span
                >
                {#if view.index === months - 1}
                  <button
                    {...api.getNextTriggerProps()}
                    type="button"
                    class={DATE_PICKER_NAV_CLASS}
                  >
                    <Icon name="chevron-right" size="sm" />
                  </button>
                {:else}
                  <span class="acme-date-range-picker__nav-space"></span>
                {/if}
              </div>
              <table
                {...table}
                {...view.table}
                onkeydown={(event) => rangeGridKeyDown(event, api, shown, props, table.onkeydown)}
                class="acme-date-picker__grid"
              >
                <thead {...api.getTableHeadProps({ view: "day" })}>
                  <tr {...api.getTableRowProps({ view: "day" })}>
                    {#each api.weekDays as weekDay (weekDay.long)}
                      <th scope="col" class="acme-date-picker__weekday">{weekDay.narrow}</th>
                    {/each}
                  </tr>
                </thead>
                <tbody {...api.getTableBodyProps({ view: "day" })}>
                  <!-- Keyed by the day, as in DatePicker: a cell made anew would drop the focus it
                       holds when a move is held at `min` or `max`. -->
                  {#each view.weeks as week (week[0]?.toString())}
                    <tr {...api.getTableRowProps({ view: "day" })}>
                      {#each week as value (value.toString())}
                        {@const cell = { value, visibleRange: view.visibleRange }}
                        {@const day = api.getDayTableCellTriggerProps(cell)}
                        <td {...api.getDayTableCellProps(cell)} class="acme-date-picker__cell">
                          <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
                          <div
                            {...day}
                            onclick={(event) =>
                              rangeDayClick(
                                event,
                                api,
                                shown,
                                props,
                                value,
                                view.visibleRange,
                                day.onclick,
                              )}
                            class="acme-date-picker__day"
                          >
                            {value.day}
                          </div>
                        </td>
                      {/each}
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </Portal>
</div>
