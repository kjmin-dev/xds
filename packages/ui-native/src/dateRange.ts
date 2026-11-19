// What a DateRangePicker does with a press, how it marks each day and which months its sheet
// lists: plain functions, tested with the same tables as the other clients' (dateRange.test.ts).

import {
  addMonths,
  daysBetween,
  formatDay,
  type IsoDate,
  type IsoMonth,
  monthOf,
  type Weekday,
  weekday,
} from "./datePicker.ts";

/** A range of days, from `start` to `end`, both included. With the same day at both it is one day long. */
export type DateRange = { start: IsoDate; end: IsoDate };

/** The days the calendar shows chosen: none, a start alone, or a start and an end. */
export type RangeDraft = readonly IsoDate[];

/** What a press on a day does: start a range, end the one that has its start, or nothing. */
export type RangeChoice = "start" | "end" | "none";

/**
 * What a press on `day` does while the calendar shows `draft`: nothing chosen or a whole range
 * starts a new one; with a start alone, a day before it starts again from there, a day the length
 * allows ends the range, and any other day does nothing. The length counts the days from the
 * start to the end, which are the nights of a stay.
 */
export function rangeDayChoice(
  draft: RangeDraft,
  day: IsoDate,
  minLength: number,
  maxLength: number | undefined,
): RangeChoice {
  const start = draft.length === 1 ? draft[0] : undefined;
  if (start === undefined) return "start";
  const length = daysBetween(start, day);
  if (length < 0) return "start";
  if (length < minLength || (maxLength !== undefined && length > maxLength)) return "none";
  return "end";
}

/** What the calendar shows chosen: a start without its end yet, or else the range given to it. */
export function shownRange(value: DateRange | undefined, draft: RangeDraft | null): RangeDraft {
  return draft ?? (value ? [value.start, value.end] : []);
}

/**
 * How one side of a day's piece of the band ends: at the middle of the cell under an end's
 * circle; square at the cell's edge where the band goes on, or stops at the first or last day of
 * a month in the middle of a week; or rounded at the cell's edge, where a week's row ends it.
 */
export type BandEdge = "middle" | "flat" | "round";

/**
 * How a day is drawn. `start` and `end` are filled circles (DatePicker's chosen day is both);
 * `band` is its piece of the band, from its leading side to its trailing side, between two ends
 * that are not the same day; `preview` marks a range not chosen yet.
 */
export type DayMarks = {
  start: boolean;
  end: boolean;
  band?: { leading: BandEdge; trailing: BandEdge } | undefined;
  preview: boolean;
};

export const UNMARKED: DayMarks = { start: false, end: false, preview: false };
export const CHOSEN: DayMarks = { start: true, end: true, preview: false };

/** Whether a screen reader hears the day selected: every day of a range and a start alone. */
export const isSelected = (marks: DayMarks) =>
  (marks.start || marks.end || marks.band !== undefined) && !marks.preview;

/**
 * How `day` is marked while the calendar shows `draft` (a whole range, or a start alone with
 * `preview` as the end it would have). The band runs from the middle of the start to the middle
 * of the end, is rounded where a week's row ends it, and is square where it goes on.
 */
export function dayMarks(
  day: IsoDate,
  draft: RangeDraft,
  preview: IsoDate | undefined,
  firstDay: Weekday,
): DayMarks {
  const [start, chosenEnd] = draft;
  if (start === undefined) return UNMARKED;
  const previewing = chosenEnd === undefined && preview !== undefined && preview > start;
  const end = chosenEnd ?? (previewing ? preview : undefined);
  const last = end ?? start;
  if (day < start || day > last) return UNMARKED;
  const column = (weekday(day) - firstDay + 7) % 7;
  const edge = (rowEnds: boolean): BandEdge => (rowEnds ? "round" : "flat");
  // An end at the edge of its row has nothing of the band beside it in that row.
  const alone = (day === start && column === 6) || (day === last && column === 0);
  const band =
    start < last && !alone
      ? {
          leading: day === start ? ("middle" as const) : edge(column === 0),
          trailing: day === last ? ("middle" as const) : edge(column === 6),
        }
      : undefined;
  return {
    start: day === start,
    end: day === end,
    ...(band && { band }),
    preview: previewing && day > start,
  };
}

/** A day's name for a screen reader: its name in full, after the name of the end it is. */
export function rangeDayName(
  marks: DayMarks,
  name: string,
  startLabel: string,
  endLabel: string,
): string {
  return [
    ...(marks.start ? [startLabel] : []),
    ...(marks.end && !marks.preview ? [endLabel] : []),
    name,
  ].join(", ");
}

/**
 * The months of the sheet's list: from the month of `min` to the month of `max`. Without `min` it
 * starts a year before `opening`, and without `max` it ends two years after it.
 */
export function monthsBetween(
  min: IsoDate | undefined,
  max: IsoDate | undefined,
  opening: IsoMonth,
): IsoMonth[] {
  const first = min === undefined ? addMonths(opening, -12) : monthOf(min);
  const last = max === undefined ? addMonths(opening, 24) : monthOf(max);
  const months: IsoMonth[] = [];
  for (let month = first; month < last; month = addMonths(month, 1)) months.push(month);
  if (first <= last) months.push(last);
  return months;
}

/** Whether this engine formats a range of days. Hermes does not; browsers and Node do. */
const formatsRanges = typeof Intl.DateTimeFormat.prototype.formatRange === "function";

/**
 * A range as the field shows it, in the medium form: "Mar 10 – 14, 2026" where the engine
 * formats a range and says once what the two days share. Hermes cannot, so on a phone it is both
 * days in full joined by an en dash, "Mar 10, 2026 – Mar 14, 2026", as on GPUI.
 */
export function formatRange(
  value: DateRange,
  locale?: string,
  intervals: boolean = formatsRanges,
): string {
  if (value.start === value.end) return formatDay(value.start, locale);
  if (!intervals) return `${formatDay(value.start, locale)} – ${formatDay(value.end, locale)}`;
  const at = (day: IsoDate) => new Date(`${day}T12:00:00Z`);
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).formatRange(
    at(value.start),
    at(value.end),
  );
}

/** The two ends over the months, "Check-in: Mar 10, 2026", with a dash for one not chosen yet. */
export function rangeSummary(
  shown: RangeDraft,
  labels: { start: string; end: string },
  medium: (day: IsoDate) => string,
): [start: string, end: string] {
  const named = (label: string, day: IsoDate | undefined) =>
    `${label}: ${day === undefined ? "–" : medium(day)}`;
  return [named(labels.start, shown[0]), named(labels.end, shown[1])];
}
