import { space } from "@acme/tokens";
import { type DateValue, getLocalTimeZone, parseDate } from "@internationalized/date";
import type * as datePicker from "@zag-js/date-picker";
import {
  type DatePickerBaseProps,
  datePickerTranslations,
  formatDay,
  type IsoDate,
  openingDay,
} from "./date-picker.ts";

/** The first and the last day of a range, both chosen, `start` no later than `end`. */
export type DateRange = { start: IsoDate; end: IsoDate };

/** DateRangePicker's props in every framework, short of `onChange`. */
export type DateRangePickerBaseProps = Omit<DatePickerBaseProps, "value" | "name"> & {
  /** The chosen range. Leave it out while none is chosen. */
  value?: DateRange | undefined;
  /**
   * The fewest days the end can be after the start: the nights of a stay. 0, the default, lets
   * the start be the end too, a range of one day.
   */
  minLength?: number | undefined;
  /** The most days the end can be after the start. No limit unless it is given. */
  maxLength?: number | undefined;
  /** The name the first day is submitted under with a form, as `YYYY-MM-DD`. */
  startName?: string;
  /** The name the last day is submitted under with a form, as `YYYY-MM-DD`. */
  endName?: string;
  /** Names the first day in the calendar's summary and for assistive technology. */
  startLabel?: string;
  /** Names the last day, as `startLabel` does the first. */
  endLabel?: string;
};

/**
 * What the calendar shows while it is open: the chosen range as its two days, or the start
 * alone while the end is being chosen, or nothing.
 */
export type RangeDraft = readonly IsoDate[];

/** Whole days from `from` to `to`, negative when `to` is earlier: the nights between them. */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/**
 * What a press on `day` does to `draft`. With nothing, or with a whole range, it starts a new
 * range. With a start alone, a day before it starts again from there, as Material's and the
 * booking sites' calendars do, where a library would swap the two; a day the length allows ends
 * the range; any other day does nothing.
 */
export function rangeDayChoice(
  draft: RangeDraft,
  day: IsoDate,
  props: Pick<DateRangePickerBaseProps, "minLength" | "maxLength">,
): "start" | "end" | "none" {
  const [start] = draft;
  if (draft.length !== 1 || start === undefined) return "start";
  const length = daysBetween(start, day);
  if (length < 0) return "start";
  if (length < (props.minLength ?? 0)) return "none";
  if (props.maxLength !== undefined && length > props.maxLength) return "none";
  return "end";
}

/**
 * The range as the field shows it, in the locale's medium form, with what the two days share
 * said once: "Mar 10 – 14, 2026", "2026. 3. 10. ~ 14.". Read at noon UTC and formatted in UTC,
 * as `formatDay` does.
 */
export function formatRange(value: DateRange, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).formatRange(
    new Date(`${value.start}T12:00:00Z`),
    new Date(`${value.end}T12:00:00Z`),
  );
}

/** The days the calendar shows: the draft while there is one, otherwise the chosen range. */
export function shownRange(value: DateRange | undefined, draft: RangeDraft | null): RangeDraft {
  return draft ?? (value === undefined ? [] : [value.start, value.end]);
}

/**
 * How many months the calendar shows side by side, read as it opens: two where the window has
 * room for them (40rem, about 640 px), one where it does not.
 */
export function rangeMonths(): 1 | 2 {
  return typeof matchMedia === "function" && matchMedia("(min-width: 40rem)").matches ? 2 : 1;
}

/**
 * The props of Zag's date-picker machine in range mode for a DateRangePicker. Zag's value is
 * `shown`, not the chosen range: Zag reports the first press as a value of one day, which an
 * owner that keeps the chosen range would put back, so the start would never show. `onDraft`
 * keeps the start alone, and `onChange` gets the range once the end is chosen. While the start
 * is alone, the days the length does not allow as its end are unavailable; the days before it
 * stay available, since a press on one starts again (see `restartRange`).
 */
export function dateRangeMachineProps(
  props: DateRangePickerBaseProps,
  shown: RangeDraft,
  options: {
    id: string;
    locale: string;
    months: number;
    onDraft: (draft: RangeDraft | null) => void;
    onChange: (value: DateRange) => void;
  },
): datePicker.Props {
  const day = (value: IsoDate | undefined) => (value === undefined ? undefined : parseDate(value));
  const [first] = shown;
  return {
    id: options.id,
    locale: options.locale,
    timeZone: getLocalTimeZone(),
    selectionMode: "range",
    numOfMonths: options.months,
    value: shown.map((value) => parseDate(value)),
    min: day(props.min),
    max: day(props.max),
    defaultFocusedValue: parseDate(openingDay({ ...props, value: props.value?.start })),
    isDateUnavailable: (date: DateValue) =>
      shown.length === 1 &&
      first !== undefined &&
      daysBetween(first, date.toString()) >= 0 &&
      rangeDayChoice(shown, date.toString(), props) === "none",
    onValueChange: (details) => {
      const [start, end] = details.value.map((date) => date.toString());
      if (start !== undefined && end !== undefined) {
        options.onDraft(null);
        options.onChange({ start, end });
      } else if (start !== undefined) options.onDraft([start]);
    },
    // A start alone is dropped with the calendar: the field still shows the chosen range.
    onOpenChange: (details) => {
      if (!details.open) options.onDraft(null);
    },
    disabled: props.disabled,
    invalid: props.error !== undefined,
    outsideDaySelectable: false,
    minView: "day",
    maxView: "day",
    positioning: { placement: "bottom-start", gutter: space[1] },
    translations: dateRangeTranslations(props),
  };
}

/**
 * DatePicker's strings, with the two ends named by `startLabel` and `endLabel` ahead of the
 * day: "Check-in, Tuesday, March 10, 2026". A range of one day is both.
 */
export function dateRangeTranslations(
  props: Pick<DateRangePickerBaseProps, "previousLabel" | "nextLabel" | "startLabel" | "endLabel">,
): datePicker.IntlTranslations {
  const start = props.startLabel ?? "Start";
  const end = props.endLabel ?? "End";
  return {
    ...datePickerTranslations(props),
    dayCell: (state) =>
      [state.firstInRange && start, state.lastInRange && end, state.valueText]
        .filter(Boolean)
        .join(", "),
  };
}

/**
 * The summary above the months: each end after its label, or a dash until it is chosen.
 * "Check-in: Mar 20, 2026", "Check-out: –".
 */
export function rangeSummary(
  shown: RangeDraft,
  props: Pick<DateRangePickerBaseProps, "startLabel" | "endLabel">,
  locale: string,
): { start: string; end: string } {
  const [start, end] = shown;
  const day = (value: IsoDate | undefined) =>
    value === undefined ? "–" : formatDay(value, locale);
  return {
    start: `${props.startLabel ?? "Start"}: ${day(start)}`,
    end: `${props.endLabel ?? "End"}: ${day(end)}`,
  };
}

/** One month of the calendar: its grid's name, its weeks, and the days that are its own. */
export type RangeMonth = {
  index: number;
  name: string;
  weeks: DateValue[][];
  /** Passed to the props of its cells: Zag counts every month shown as visible. */
  visibleRange: { start: DateValue; end: DateValue };
  /** The props of its grid, after Zag's. */
  table: { id: string; "aria-label": string };
};

/**
 * The months the calendar shows, side by side. Each is a grid of its own, named by its month,
 * where Zag names every grid by all the months shown ("March – April 2026"). Its cells take its
 * own month as the visible range, so that the days of the next month in its last row are drawn
 * as outside, and hidden, rather than as days of the next month shown.
 */
export function rangeMonthViews(
  api: Pick<datePicker.Api, "getOffset">,
  months: number,
): RangeMonth[] {
  return Array.from({ length: months }, (_, index) => {
    const offset = api.getOffset({ months: index });
    const start = offset.visibleRange.start;
    return {
      index,
      name: offset.visibleRangeText.start,
      weeks: offset.weeks,
      visibleRange: { start, end: start.add({ months: 1 }).subtract({ days: 1 }) },
      table: { id: `month-${index}`, "aria-label": offset.visibleRangeText.start },
    };
  });
}

type RangeApi = Pick<datePicker.Api, "focusedValue" | "getDayTableCellState" | "setValue">;

/**
 * A press on a day before the start, while the end is being chosen, starts again from there:
 * it becomes the start alone. Zag would make it the start and the old start the end, and close.
 * Returns whether it did, in which case Zag's own handler must not run.
 */
export function restartRange(
  api: RangeApi,
  shown: RangeDraft,
  props: Pick<DateRangePickerBaseProps, "minLength" | "maxLength">,
  day: DateValue,
  visibleRange?: { start: DateValue; end: DateValue },
): boolean {
  if (shown.length !== 1 || rangeDayChoice(shown, day.toString(), props) !== "start") return false;
  if (!api.getDayTableCellState({ value: day, visibleRange }).selectable) return false;
  api.setValue([day]);
  return true;
}

/**
 * For the click handler of a day, in place of Zag's: see `restartRange`. Zag's handler runs
 * for every other press.
 */
export function rangeDayClick<E>(
  event: E,
  api: RangeApi,
  shown: RangeDraft,
  props: Pick<DateRangePickerBaseProps, "minLength" | "maxLength">,
  day: DateValue,
  visibleRange: { start: DateValue; end: DateValue },
  zag: ((event: E) => void) | null | undefined,
): void {
  if (!restartRange(api, shown, props, day, visibleRange)) zag?.(event);
}

/**
 * For the keydown handler of a month's grid, in place of Zag's: Enter or Space on a day before
 * the start starts again from there, as a press does (see `restartRange`). Zag's handler runs
 * for every other key.
 */
export function rangeGridKeyDown<E extends { key: string; preventDefault(): void }>(
  event: E,
  api: RangeApi,
  shown: RangeDraft,
  props: Pick<DateRangePickerBaseProps, "minLength" | "maxLength">,
  zag: ((event: E) => void) | null | undefined,
): void {
  if (
    (event.key === "Enter" || event.key === " ") &&
    restartRange(api, shown, props, api.focusedValue)
  ) {
    event.preventDefault();
    return;
  }
  zag?.(event);
}

/**
 * After a render in which the focused day changed while the start is alone: the preview runs
 * from the start to the focused day, or there is none while the focused day is before the
 * start, since a press there starts again rather than ending the range.
 *
 * Zag previews to the day a key moves the focus to, except after ArrowRight (ArrowLeft right to
 * left), whose action clears the preview it has just set (`["focusNextDay", "setHoveredDate"]`,
 * with no day in a key's event): under React, which draws the move before that action runs, the
 * keyboard check of the range fails without this. Zag would also preview a day before the start,
 * from it to the start: the pointer check fails without this in every library.
 *
 * It looks once the event that moved the focus is over, at what the machine holds then.
 */
export function keepRangePreview(service: datePicker.Service, shown: RangeDraft, open: boolean) {
  const [start] = shown;
  if (!open || shown.length !== 1 || start === undefined) return;
  queueMicrotask(() => {
    if (!service.state.matches("open")) return;
    const focused = service.context.get("focusedValue");
    const hovered = service.context.get("hoveredValue");
    if (focused.toString() < start) {
      if (hovered) service.send({ type: "TABLE.POINTER_LEAVE" });
    } else if (!hovered || hovered.compare(focused) !== 0) {
      service.send({
        type: "CELL.POINTER_MOVE",
        cell: "day",
        value: focused,
        focus: false,
        outsideRange: false,
      });
    }
  });
}

/**
 * When the calendar closes. Closed with a start alone, Zag stays on choosing an end (Escape does
 * not reset it, the other ways of closing do): reopened over the chosen range, a hover or a key
 * would preview from the range's start. `INPUT.BLUR` is the event Zag's text inputs send, whose
 * only action without one is going back to choosing a start; Zag has no other way to it. The
 * Escape check of the range fails without it.
 */
export function endRangeChoiceOnClose(service: datePicker.Service, open: boolean): void {
  if (!open) service.send({ type: "INPUT.BLUR", index: 0, value: "" });
}
