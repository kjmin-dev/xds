<!--
  @component
  A field for choosing one day. Closed, it looks like a Select: the chosen day in the locale's
  medium form, or the placeholder. Pressed, it opens a calendar of one month under itself, on the
  chosen day, or on today while none is. A press on a day, or Enter on the focused one, calls
  `onChange` with the day as `YYYY-MM-DD` and closes the calendar; Escape or a press outside
  closes it without a choice.

  The field is a button that says it opens a dialog and whether it is open. In the calendar the
  arrow keys move a day or a week, Page Up and Page Down a month (a year with Shift), and Home and
  End to the first and the last day of the month, never past `min` or `max`. Tab goes round the
  month buttons and the focused day. The chosen day is selected for assistive technology, and
  today is the current date.
-->
<script module lang="ts">
  import type { DatePickerBaseProps, IsoDate } from "@acme/ui-core";
  import type { RootProps } from "./root.ts";

  export type { IsoDate } from "@acme/ui-core";

  export type DatePickerProps = DatePickerBaseProps &
    RootProps & {
      onChange: (value: IsoDate) => void;
    };
</script>

<script lang="ts">
  import {
    classes,
    DATE_PICKER_NAV_CLASS,
    datePickerContentAttrs,
    datePickerIds,
    datePickerLocale,
    datePickerMachineProps,
    datePickerTriggerAttrs,
    focusOpeningDay,
    formatDay,
    keepCalendarFocus,
    keepDayFocused,
  } from "@acme/ui-core";
  import * as datePicker from "@zag-js/date-picker";
  import { mergeProps, normalizeProps, useMachine } from "@zag-js/svelte";
  import { untrack } from "svelte";
  import Icon from "./Icon.svelte";
  import { modalPopover } from "./modal-popover.svelte.ts";
  import Portal from "./Portal.svelte";
  import { createPresence } from "./presence.svelte.ts";

  // The rest stays reactive: the machine's props read it each time it changes.
  let { onChange, class: className, style, ...props }: DatePickerProps = $props();

  const id = $props.id();
  const ids = datePickerIds(id);
  const locale = datePickerLocale();
  const service = useMachine(datePicker.machine, () =>
    datePickerMachineProps(props, { id, locale, onChange }),
  );
  const api = $derived(datePicker.connect(service, normalizeProps));
  const trigger = $derived(api.getTriggerProps());
  const invalid = $derived(props.error !== undefined);
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
  // Strings, so that the effect below runs only when the focused day or the month changes, not
  // on every change of the machine.
  const focused = $derived(api.focusedValue.toString());
  const month = $derived(api.visibleRange.start.toString());
  $effect(() => {
    const open = api.open;
    void focused;
    void month;
    untrack(() => keepDayFocused(open, surface));
  });
</script>

<!-- Merged, so that the app's style joins any the machine writes on the root. -->
<div {...mergeProps(api.getRootProps(), { class: classes("acme-date-picker", className), style })}>
  <!-- A span: the field is a button, which a <label> cannot point at. -->
  <span id={ids.label} class="acme-date-picker__label">{props.label}</span>
  <!-- What Zag places the calendar against. -->
  <div {...api.getControlProps()} class="acme-date-picker__control">
    <button
      {...trigger}
      {...datePickerTriggerAttrs(props, ids)}
      type="button"
      onclick={(event) => {
        focusOpeningDay(api, props);
        trigger.onclick?.(event);
      }}
      class="acme-date-picker__trigger"
    >
      <span id={ids.value} class="acme-date-picker__value"
        >{props.value === undefined ? props.placeholder : formatDay(props.value, locale)}</span
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
  <!-- What a form submits. Zag gives the name to its text input, which is not drawn. -->
  {#if props.name !== undefined}
    <input type="hidden" name={props.name} value={props.value ?? ""} />
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
        class="acme-date-picker__content"
      >
        <div class="acme-date-picker__header">
          <button {...api.getPreviousTriggerProps()} type="button" class={DATE_PICKER_NAV_CLASS}>
            <Icon name="chevron-left" size="sm" />
          </button>
          <span {...api.getRangeTextProps()} class="acme-date-picker__heading"
            >{api.visibleRangeText.start}</span
          >
          <button {...api.getNextTriggerProps()} type="button" class={DATE_PICKER_NAV_CLASS}>
            <Icon name="chevron-right" size="sm" />
          </button>
        </div>
        <table {...api.getTableProps({ view: "day" })} class="acme-date-picker__grid">
          <thead {...api.getTableHeadProps({ view: "day" })}>
            <tr {...api.getTableRowProps({ view: "day" })}>
              {#each api.weekDays as weekDay (weekDay.long)}
                <th scope="col" class="acme-date-picker__weekday">{weekDay.narrow}</th>
              {/each}
            </tr>
          </thead>
          <tbody {...api.getTableBodyProps({ view: "day" })}>
            <!-- Keyed by the day, not by the object: Zag hands out new dates on every change, and
                 a cell made anew would drop the focus it holds when a move is held at `min` or
                 `max`. -->
            {#each api.weeks as week (week[0]?.toString())}
              <tr {...api.getTableRowProps({ view: "day" })}>
                {#each week as value (value.toString())}
                  <td {...api.getDayTableCellProps({ value })} class="acme-date-picker__cell">
                    <div
                      {...api.getDayTableCellTriggerProps({ value })}
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
    </div>
  </Portal>
</div>
