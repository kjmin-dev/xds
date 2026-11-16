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
import * as datePicker from "@zag-js/date-picker";
import { normalizeProps, useMachine } from "@zag-js/react";
import { type MouseEvent, useEffect, useId, useRef, useState } from "react";
import { Icon } from "./Icon.tsx";
import { useModalPopover } from "./modal-popover.ts";
import { Portal } from "./portal.tsx";
import { usePresence } from "./presence.ts";

export type { DateRange } from "@acme/ui-core";

export type DateRangePickerProps = DateRangePickerBaseProps & {
  onChange: (value: DateRange) => void;
};

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
export function DateRangePicker({ onChange, ...props }: DateRangePickerProps) {
  const { label, value, placeholder, description, error, startName, endName } = props;
  const id = useId();
  const ids = datePickerIds(id);
  const locale = datePickerLocale();
  // A start alone while the end is chosen; null while the calendar shows the chosen range.
  const [draft, setDraft] = useState<RangeDraft | null>(null);
  const [months, setMonths] = useState(1);
  const shown = shownRange(value, draft);
  const service = useMachine(
    datePicker.machine,
    dateRangeMachineProps(props, shown, { id, locale, months, onDraft: setDraft, onChange }),
  );
  const api = datePicker.connect(service, normalizeProps);
  const trigger = api.getTriggerProps();
  const positioner = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  useModalPopover(api.open, () => positioner.current);
  const present = usePresence(api.open, () => [surface.current]);
  const focused = api.focusedValue.toString();
  const month = api.visibleRange.start.toString();
  useEffect(() => keepDayFocused(api.open, surface.current), [api.open, focused, month]);
  // oxlint-disable-next-line react/exhaustive-deps -- only as the calendar opens or closes
  useEffect(() => endRangeChoiceOnClose(service, api.open), [api.open]);
  // oxlint-disable-next-line react/exhaustive-deps -- only once the focused day has moved
  useEffect(() => keepRangePreview(service, shown, api.open), [focused]);
  const summary = rangeSummary(shown, props, locale);
  const invalid = error !== undefined;
  return (
    <div {...api.getRootProps()} className="date-picker date-range-picker">
      {/* A span: the field is a button, which a <label> cannot point at. */}
      <span id={ids.label} className="date-picker__label">
        {label}
      </span>
      {/* What Zag places the calendar against. */}
      <div {...api.getControlProps()} className="date-picker__control">
        <button
          {...trigger}
          {...datePickerTriggerAttrs(props, ids)}
          type="button"
          onClick={(event: MouseEvent<HTMLButtonElement>) => {
            if (!api.open) setMonths(rangeMonths());
            focusOpeningDay(api, { ...props, value: value?.start });
            trigger.onClick?.(event);
          }}
          className="date-picker__trigger"
        >
          <span id={ids.value} className="date-picker__value">
            {value === undefined ? placeholder : formatRange(value, locale)}
          </span>
          <Icon name="calendar" size="sm" className="text-acme-field-placeholder" />
        </button>
      </div>
      {/* One line under the box: the help, or the error in its place. */}
      {(invalid || description) && (
        <div className="date-picker__footer">
          {invalid ? (
            <span id={ids.error} className="date-picker__error">
              {error}
            </span>
          ) : (
            <span id={ids.description} className="date-picker__description">
              {description}
            </span>
          )}
        </div>
      )}
      {/* What a form submits. Zag gives the names to its text inputs, which are not drawn. */}
      {startName !== undefined && (
        <input type="hidden" name={startName} value={value?.start ?? ""} />
      )}
      {endName !== undefined && <input type="hidden" name={endName} value={value?.end ?? ""} />}
      <Portal>
        {api.open && (
          // Takes a press outside, which then only closes the calendar. The focus stays in the
          // calendar until it hands it back to the field.
          // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- not a control: the handler only keeps the focus where it is
          <div className="date-picker__underlay" onMouseDown={(event) => event.preventDefault()} />
        )}
        <div {...api.getPositionerProps()} ref={positioner} className="date-picker__positioner">
          {/* Shown until its exit animation ends; Zag would hide it as it closes. */}
          {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- a dialog: datePickerContentAttrs gives it the role */}
          <div
            {...api.getContentProps()}
            {...datePickerContentAttrs(ids)}
            ref={surface}
            hidden={!present}
            onKeyDown={(event) => keepCalendarFocus(event, surface.current)}
            className="date-picker__content date-range-picker__content"
          >
            <div className="date-range-picker__summary" aria-live="polite">
              <span>{summary.start}</span>
              <span>{summary.end}</span>
            </div>
            <div className="date-range-picker__months">
              {rangeMonthViews(api, months).map((view) => {
                const table = api.getTableProps({ view: "day", id: view.table.id });
                return (
                  <div key={view.index} className="date-range-picker__month">
                    <div className="date-picker__header">
                      {view.index === 0 ? (
                        <button
                          {...api.getPreviousTriggerProps()}
                          type="button"
                          className={DATE_PICKER_NAV_CLASS}
                        >
                          <Icon name="chevron-left" size="sm" />
                        </button>
                      ) : (
                        <span className="date-range-picker__nav-space" />
                      )}
                      <span {...api.getRangeTextProps()} className="date-picker__heading">
                        {view.name}
                      </span>
                      {view.index === months - 1 ? (
                        <button
                          {...api.getNextTriggerProps()}
                          type="button"
                          className={DATE_PICKER_NAV_CLASS}
                        >
                          <Icon name="chevron-right" size="sm" />
                        </button>
                      ) : (
                        <span className="date-range-picker__nav-space" />
                      )}
                    </div>
                    {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- a grid: Zag's props give it the role, and Enter on a day before the start is handled first */}
                    <table
                      {...table}
                      {...view.table}
                      onKeyDown={(event) =>
                        rangeGridKeyDown(event, api, shown, props, table.onKeyDown)
                      }
                      className="date-picker__grid"
                    >
                      <thead {...api.getTableHeadProps({ view: "day" })}>
                        <tr {...api.getTableRowProps({ view: "day" })}>
                          {api.weekDays.map((weekDay) => (
                            <th key={weekDay.long} scope="col" className="date-picker__weekday">
                              {weekDay.narrow}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody {...api.getTableBodyProps({ view: "day" })}>
                        {/* Keyed by the day, as in DatePicker: a cell made anew would drop the
                            focus it holds when a move is held at `min` or `max`. */}
                        {view.weeks.map((week) => (
                          <tr key={week[0]?.toString()} {...api.getTableRowProps({ view: "day" })}>
                            {week.map((date) => {
                              const cell = { value: date, visibleRange: view.visibleRange };
                              const day = api.getDayTableCellTriggerProps(cell);
                              return (
                                <td
                                  key={date.toString()}
                                  {...api.getDayTableCellProps(cell)}
                                  className="date-picker__cell"
                                >
                                  {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- a button: Zag's props give it the role, and its grid takes the keys */}
                                  <div
                                    {...day}
                                    onClick={(event) =>
                                      rangeDayClick(
                                        event,
                                        api,
                                        shown,
                                        props,
                                        date,
                                        view.visibleRange,
                                        day.onClick,
                                      )
                                    }
                                    className="date-picker__day"
                                  >
                                    {date.day}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Portal>
    </div>
  );
}
