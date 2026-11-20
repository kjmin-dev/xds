import {
  classes,
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
import * as datePicker from "@zag-js/date-picker";
import { mergeProps, normalizeProps, useMachine } from "@zag-js/react";
import { type MouseEvent, useEffect, useId, useRef } from "react";
import { Icon } from "./Icon.tsx";
import { useModalPopover } from "./modal-popover.ts";
import { Portal } from "./portal.tsx";
import { usePresence } from "./presence.ts";
import type { RootProps } from "./root.ts";

export type { IsoDate } from "@acme/ui-core";

export type DatePickerProps = DatePickerBaseProps &
  RootProps & {
    onChange: (value: IsoDate) => void;
  };

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
export function DatePicker({ onChange, className, style, ...props }: DatePickerProps) {
  const { label, value, placeholder, description, error, name } = props;
  const id = useId();
  const ids = datePickerIds(id);
  const locale = datePickerLocale();
  const service = useMachine(
    datePicker.machine,
    datePickerMachineProps(props, { id, locale, onChange }),
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
  const invalid = error !== undefined;
  return (
    <div
      {...mergeProps(api.getRootProps(), {
        className: classes("acme-date-picker", className),
        style,
      })}
    >
      {/* A span: the field is a button, which a <label> cannot point at. */}
      <span id={ids.label} className="acme-date-picker__label">
        {label}
      </span>
      {/* What Zag places the calendar against. */}
      <div {...api.getControlProps()} className="acme-date-picker__control">
        <button
          {...trigger}
          {...datePickerTriggerAttrs(props, ids)}
          type="button"
          onClick={(event: MouseEvent<HTMLButtonElement>) => {
            focusOpeningDay(api, props);
            trigger.onClick?.(event);
          }}
          className="acme-date-picker__trigger"
        >
          <span id={ids.value} className="acme-date-picker__value">
            {value === undefined ? placeholder : formatDay(value, locale)}
          </span>
          <Icon name="calendar" size="sm" className="text-acme-field-placeholder" />
        </button>
      </div>
      {/* One line under the box: the help, or the error in its place. */}
      {(invalid || description) && (
        <div className="acme-date-picker__footer">
          {invalid ? (
            <span id={ids.error} className="acme-date-picker__error">
              {error}
            </span>
          ) : (
            <span id={ids.description} className="acme-date-picker__description">
              {description}
            </span>
          )}
        </div>
      )}
      {/* What a form submits. Zag gives the name to its text input, which is not drawn. */}
      {name !== undefined && <input type="hidden" name={name} value={value ?? ""} />}
      <Portal>
        {api.open && (
          // Takes a press outside, which then only closes the calendar. The focus stays in the
          // calendar until it hands it back to the field.
          // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- not a control: the handler only keeps the focus where it is
          <div
            className="acme-date-picker__underlay"
            onMouseDown={(event) => event.preventDefault()}
          />
        )}
        <div
          {...api.getPositionerProps()}
          ref={positioner}
          className="acme-date-picker__positioner"
        >
          {/* Shown until its exit animation ends; Zag would hide it as it closes. */}
          {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- a dialog: datePickerContentAttrs gives it the role */}
          <div
            {...api.getContentProps()}
            {...datePickerContentAttrs(ids)}
            ref={surface}
            hidden={!present}
            onKeyDown={(event) => keepCalendarFocus(event, surface.current)}
            className="acme-date-picker__content"
          >
            <div className="acme-date-picker__header">
              <button
                {...api.getPreviousTriggerProps()}
                type="button"
                className={DATE_PICKER_NAV_CLASS}
              >
                <Icon name="chevron-left" size="sm" />
              </button>
              <span {...api.getRangeTextProps()} className="acme-date-picker__heading">
                {api.visibleRangeText.start}
              </span>
              <button
                {...api.getNextTriggerProps()}
                type="button"
                className={DATE_PICKER_NAV_CLASS}
              >
                <Icon name="chevron-right" size="sm" />
              </button>
            </div>
            <table {...api.getTableProps({ view: "day" })} className="acme-date-picker__grid">
              <thead {...api.getTableHeadProps({ view: "day" })}>
                <tr {...api.getTableRowProps({ view: "day" })}>
                  {api.weekDays.map((weekDay) => (
                    <th key={weekDay.long} scope="col" className="acme-date-picker__weekday">
                      {weekDay.narrow}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody {...api.getTableBodyProps({ view: "day" })}>
                {/* Keyed by the day, not by the object: Zag hands out new dates on every
                    change, and a cell made anew would drop the focus it holds when a move is
                    held at `min` or `max`. */}
                {api.weeks.map((week) => (
                  <tr key={week[0]?.toString()} {...api.getTableRowProps({ view: "day" })}>
                    {week.map((date) => (
                      <td
                        key={date.toString()}
                        {...api.getDayTableCellProps({ value: date })}
                        className="acme-date-picker__cell"
                      >
                        <div
                          {...api.getDayTableCellTriggerProps({ value: date })}
                          className="acme-date-picker__day"
                        >
                          {date.day}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Portal>
    </div>
  );
}
