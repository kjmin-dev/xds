import {
  DATE_PICKER_NAV_CLASS,
  type DateRange,
  type DateRangePickerBaseProps,
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
import { Portal } from "@solidjs/web";
import * as datePicker from "@zag-js/date-picker";
import { normalizeProps, useMachine } from "@zag-js/solid";
import { createEffect, createMemo, createSignal, createUniqueId, For, Show } from "solid-js";
import { Icon } from "./Icon.tsx";
import { modalPopover } from "./modal-popover.ts";
import { createPresence } from "./presence.ts";

export type { DateRange } from "@acme/ui-core";

export type DateRangePickerProps = DateRangePickerBaseProps & {
  onChange: (value: DateRange) => void;
};

type Handler<E> = (event: E) => void;

/**
 * A field for choosing a range of days, a start and an end, as for a stay. Closed, it looks like
 * a DatePicker and shows both days in the locale's medium form ("Mar 10 – 14, 2026"), or the
 * placeholder. Pressed, it opens a calendar under itself, two months side by side where the
 * window has room and one where it does not, on the start's month, or on today's while nothing
 * is chosen.
 *
 * The first day pressed starts the range, and the band previews it to the day under the pointer
 * or the keyboard's focus. The second ends it, if the days between are at least `minLength` and
 * at most `maxLength`, which leave the other days unavailable meanwhile: `onChange` gets the
 * range and the calendar closes. A day before the start starts again from there. Escape or a
 * press outside closes the calendar without a change.
 *
 * The keys are DatePicker's, and Page Up and Page Down move a month whether one or two are
 * shown. Each month is a grid named by its month; every day of the range is selected, and the
 * two ends are named by `startLabel` and `endLabel` before the day.
 */
export function DateRangePicker(props: DateRangePickerProps) {
  const id = createUniqueId();
  const ids = datePickerIds(id);
  const locale = datePickerLocale();
  // A start alone while the end is chosen; null while the calendar shows the chosen range.
  const [draft, setDraft] = createSignal<RangeDraft | null>(null);
  const [months, setMonths] = createSignal(1);
  const shown = createMemo(() => shownRange(props.value, draft()));
  const service = useMachine(datePicker.machine, () =>
    dateRangeMachineProps(props, shown(), {
      id,
      locale,
      months: months(),
      onDraft: (next) => setDraft(() => next),
      onChange: (value) => props.onChange(value),
    }),
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
  // Memos, so that the effects run only when one of them changes, not on every change of the
  // machine.
  const open = createMemo(() => api().open);
  const focused = createMemo(() => api().focusedValue.toString());
  const month = createMemo(() => api().visibleRange.start.toString());
  createEffect(
    () => [open(), focused(), month()] as const,
    ([isOpen]) => keepDayFocused(isOpen, surface),
  );
  createEffect(open, (isOpen) => endRangeChoiceOnClose(service, isOpen));
  createEffect(focused, () => keepRangePreview(service, shown(), open()));
  const summary = createMemo(() => rangeSummary(shown(), props, locale));
  const views = createMemo(() => rangeMonthViews(api(), months()));
  const invalid = () => props.error !== undefined;
  return (
    <div {...api().getRootProps()} class="date-picker date-range-picker">
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
            if (!api().open) setMonths(rangeMonths());
            focusOpeningDay(api(), { ...props, value: props.value?.start });
            (api().getTriggerProps().onClick as Handler<MouseEvent> | undefined)?.(event);
          }}
          class="date-picker__trigger"
        >
          <span id={ids.value} class="date-picker__value">
            {props.value === undefined ? props.placeholder : formatRange(props.value, locale)}
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
      {/* What a form submits. Zag gives the names to its text inputs, which are not drawn. */}
      <Show when={props.startName !== undefined}>
        <input type="hidden" name={props.startName} value={props.value?.start ?? ""} />
      </Show>
      <Show when={props.endName !== undefined}>
        <input type="hidden" name={props.endName} value={props.value?.end ?? ""} />
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
            class="date-picker__content date-range-picker__content"
          >
            <div class="date-range-picker__summary" aria-live="polite">
              <span>{summary().start}</span>
              <span>{summary().end}</span>
            </div>
            <div class="date-range-picker__months">
              {/* Kept by position: the months move under the same columns. */}
              <For each={views()} keyed={false}>
                {(view) => (
                  <div class="date-range-picker__month">
                    <div class="date-picker__header">
                      <Show
                        when={view().index === 0}
                        fallback={<span class="date-range-picker__nav-space" />}
                      >
                        <button
                          {...api().getPreviousTriggerProps()}
                          type="button"
                          class={DATE_PICKER_NAV_CLASS}
                        >
                          <Icon name="chevron-left" size="sm" />
                        </button>
                      </Show>
                      <span {...api().getRangeTextProps()} class="date-picker__heading">
                        {view().name}
                      </span>
                      <Show
                        when={view().index === months() - 1}
                        fallback={<span class="date-range-picker__nav-space" />}
                      >
                        <button
                          {...api().getNextTriggerProps()}
                          type="button"
                          class={DATE_PICKER_NAV_CLASS}
                        >
                          <Icon name="chevron-right" size="sm" />
                        </button>
                      </Show>
                    </div>
                    {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- a grid: Zag's props give it the role, and Enter on a day before the start is handled first */}
                    <table
                      {...api().getTableProps({ view: "day", id: view().table.id })}
                      {...view().table}
                      onKeyDown={(event) =>
                        rangeGridKeyDown(
                          event,
                          api(),
                          shown(),
                          props,
                          api().getTableProps({ view: "day", id: view().table.id }).onKeyDown as
                            | Handler<KeyboardEvent>
                            | undefined,
                        )
                      }
                      class="date-picker__grid"
                    >
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
                        {/* Kept by position, as in DatePicker: a cell made anew would drop the
                            focus it holds when a move is held at `min` or `max`. */}
                        <For each={view().weeks} keyed={false}>
                          {(week) => (
                            <tr {...api().getTableRowProps({ view: "day" })}>
                              <For each={week()} keyed={false}>
                                {(date) => {
                                  const cell = () => ({
                                    value: date(),
                                    visibleRange: view().visibleRange,
                                  });
                                  return (
                                    <td
                                      {...api().getDayTableCellProps(cell())}
                                      class="date-picker__cell"
                                    >
                                      {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- a button: Zag's props give it the role, and its grid takes the keys */}
                                      <div
                                        {...api().getDayTableCellTriggerProps(cell())}
                                        onClick={(event) =>
                                          rangeDayClick(
                                            event,
                                            api(),
                                            shown(),
                                            props,
                                            date(),
                                            view().visibleRange,
                                            api().getDayTableCellTriggerProps(cell()).onClick as
                                              | Handler<MouseEvent>
                                              | undefined,
                                          )
                                        }
                                        class="date-picker__day"
                                      >
                                        {date().day}
                                      </div>
                                    </td>
                                  );
                                }}
                              </For>
                            </tr>
                          )}
                        </For>
                      </tbody>
                    </table>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>
      </Portal>
    </div>
  );
}
