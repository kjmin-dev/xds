import {
  DATE_PICKER_NAV_CLASS,
  type DatePickerBaseProps,
  datePickerContentAttrs,
  datePickerIds,
  datePickerLocale,
  datePickerMachineProps,
  datePickerTriggerAttrs,
  focusOpeningDay,
  formatDay,
  type IsoDate,
  keepCalendarFocus,
  keepDayFocused,
} from "@acme/ui-core";
import { Portal } from "@solidjs/web";
import * as datePicker from "@zag-js/date-picker";
import { normalizeProps, useMachine } from "@zag-js/solid";
import { createEffect, createMemo, createUniqueId, For, Show } from "solid-js";
import { Icon } from "./Icon.tsx";
import { modalPopover } from "./modal-popover.ts";
import { createPresence } from "./presence.ts";

export type { IsoDate } from "@acme/ui-core";

export type DatePickerProps = DatePickerBaseProps & {
  onChange: (value: IsoDate) => void;
};

type ClickHandler = (event: MouseEvent) => void;

/**
 * A field for choosing one day. Closed, it looks like a Select: the chosen day in the locale's
 * medium form, or the placeholder. Pressed, it opens a calendar of one month under itself, on
 * the chosen day, or on today while none is. A press on a day, or Enter on the focused one,
 * calls `onChange` with the day as `YYYY-MM-DD` and closes the calendar; Escape or a press
 * outside closes it without a choice.
 *
 * The field is a button that says it opens a dialog and whether it is open. In the calendar the
 * arrow keys move a day or a week, Page Up and Page Down a month (a year with Shift), and Home
 * and End to the first and the last day of the month, never past `min` or `max`. Tab goes round
 * the month buttons and the focused day. The chosen day is selected for assistive technology,
 * and today is the current date.
 */
export function DatePicker(props: DatePickerProps) {
  const id = createUniqueId();
  const ids = datePickerIds(id);
  const locale = datePickerLocale();
  const service = useMachine(datePicker.machine, () =>
    datePickerMachineProps(props, { id, locale, onChange: (value) => props.onChange(value) }),
  );
  const api = createMemo(() => datePicker.connect(service, normalizeProps));
  let positioner: HTMLDivElement | undefined;
  let surface: HTMLDivElement | undefined;
  modalPopover(
    () => api().open,
    () => positioner,
  );
  const present = createPresence(
    () => api().open,
    () => [surface],
  );
  // Memos, so that the effect runs only when one of them changes, not on every change of the
  // machine.
  const open = createMemo(() => api().open);
  const focused = createMemo(() => api().focusedValue.toString());
  const month = createMemo(() => api().visibleRange.start.toString());
  createEffect(
    () => [open(), focused(), month()] as const,
    ([isOpen]) => keepDayFocused(isOpen, surface),
  );
  const invalid = () => props.error !== undefined;
  return (
    <div {...api().getRootProps()} class="date-picker">
      {/* A span: the field is a button, which a <label> cannot point at. */}
      <span id={ids.label} class="date-picker__label">
        {props.label}
      </span>
      {/* What Zag places the calendar against. */}
      <div {...api().getControlProps()} class="date-picker__control">
        <button
          {...api().getTriggerProps()}
          {...datePickerTriggerAttrs(props, ids)}
          type="button"
          onClick={(event) => {
            focusOpeningDay(api(), props);
            (api().getTriggerProps().onClick as ClickHandler | undefined)?.(event);
          }}
          class="date-picker__trigger"
        >
          <span id={ids.value} class="date-picker__value">
            {props.value === undefined ? props.placeholder : formatDay(props.value, locale)}
          </span>
          <Icon name="calendar" size="sm" class="text-acme-field-placeholder" />
        </button>
      </div>
      {/* One line under the box: the help, or the error in its place. */}
      <Show when={invalid() || props.description}>
        <div class="date-picker__footer">
          <Show
            when={invalid()}
            fallback={
              <span id={ids.description} class="date-picker__description">
                {props.description}
              </span>
            }
          >
            <span id={ids.error} class="date-picker__error">
              {props.error}
            </span>
          </Show>
        </div>
      </Show>
      {/* What a form submits. Zag gives the name to its text input, which is not drawn. */}
      <Show when={props.name !== undefined}>
        <input type="hidden" name={props.name} value={props.value ?? ""} />
      </Show>
      <Portal>
        <Show when={api().open}>
          {/* Takes a press outside, which then only closes the calendar. The focus stays in
              the calendar until it hands it back to the field. */}
          {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- not a control: the handler only keeps the focus where it is */}
          <div class="date-picker__underlay" onMouseDown={(event) => event.preventDefault()} />
        </Show>
        <div
          ref={(element) => (positioner = element)}
          {...api().getPositionerProps()}
          class="date-picker__positioner"
        >
          {/* Shown until its exit animation ends; Zag would hide it as it closes. */}
          {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- a dialog: datePickerContentAttrs gives it the role */}
          <div
            {...api().getContentProps()}
            {...datePickerContentAttrs(ids)}
            ref={(element) => (surface = element)}
            hidden={!present()}
            onKeyDown={(event) => keepCalendarFocus(event, surface)}
            class="date-picker__content"
          >
            <div class="date-picker__header">
              <button
                {...api().getPreviousTriggerProps()}
                type="button"
                class={DATE_PICKER_NAV_CLASS}
              >
                <Icon name="chevron-left" size="sm" />
              </button>
              <span {...api().getRangeTextProps()} class="date-picker__heading">
                {api().visibleRangeText.start}
              </span>
              <button {...api().getNextTriggerProps()} type="button" class={DATE_PICKER_NAV_CLASS}>
                <Icon name="chevron-right" size="sm" />
              </button>
            </div>
            <table {...api().getTableProps({ view: "day" })} class="date-picker__grid">
              <thead {...api().getTableHeadProps({ view: "day" })}>
                <tr {...api().getTableRowProps({ view: "day" })}>
                  <For each={api().weekDays} keyed={false}>
                    {(weekDay) => (
                      <th scope="col" class="date-picker__weekday">
                        {weekDay().narrow}
                      </th>
                    )}
                  </For>
                </tr>
              </thead>
              <tbody {...api().getTableBodyProps({ view: "day" })}>
                {/* Kept by position, not by the object: Zag hands out new dates on every
                    change, and a cell made anew would drop the focus it holds when a move is
                    held at `min` or `max`. */}
                <For each={api().weeks} keyed={false}>
                  {(week) => (
                    <tr {...api().getTableRowProps({ view: "day" })}>
                      <For each={week()} keyed={false}>
                        {(date) => (
                          <td
                            {...api().getDayTableCellProps({ value: date() })}
                            class="date-picker__cell"
                          >
                            <div
                              {...api().getDayTableCellTriggerProps({ value: date() })}
                              class="date-picker__day"
                            >
                              {date().day}
                            </div>
                          </td>
                        )}
                      </For>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </div>
      </Portal>
    </div>
  );
}
