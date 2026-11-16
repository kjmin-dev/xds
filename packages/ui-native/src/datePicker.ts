// The days a DatePicker hands to the system calendars and takes back from them. A day has no
// time and no time zone, but each calendar wants an instant, and each reads it its own way:
// SwiftUI's in the device's time zone, Material 3's in UTC. A wrong reading shows the day
// before or the day after to everyone on one side of Greenwich, so the conversions are here,
// apart from the views, where they can be tested in any time zone.

/** A day of the calendar without a time or a time zone, as `YYYY-MM-DD`. */
export type IsoDate = string;

/** What the calendar of each platform is given. DatePicker.tsx draws the field and owns `open`. */
export type DatePickerCalendarProps = {
  open: boolean;
  label: string;
  value: IsoDate | undefined;
  min: IsoDate | undefined;
  max: IsoDate | undefined;
  /** The day it was on the device when the calendar opened. */
  today: IsoDate;
  doneLabel: string;
  onChange: (value: IsoDate) => void;
  /** Called when the calendar is closed, whether or not a day was chosen. */
  onClose: () => void;
};

const pad = (number: number, length = 2) => String(number).padStart(length, "0");

function parts(day: IsoDate): [year: number, month: number, date: number] {
  const [year = 0, month = 1, date = 1] = day.split("-").map(Number);
  return [year, month, date];
}

/**
 * The day as the field shows it: the locale's medium form ("Mar 10, 2026", "2026. 3. 10."), in
 * the device's locale unless one is given. Read at noon UTC and formatted in UTC, so no time
 * zone can move it to another day.
 */
export function formatDay(value: IsoDate, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(`${value}T12:00:00Z`),
  );
}

/** What a screen reader calls the field: the day or the placeholder it shows, then its label. */
export function fieldName(label: string, shown: string | undefined): string {
  return shown ? `${shown}, ${label}` : label;
}

/** The day it is on the device at the instant `now`. */
export function localDay(now: Date): IsoDate {
  return `${pad(now.getFullYear(), 4)}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** `day`, or the nearer of `min` and `max` when it is outside them. */
export function clampDay(day: IsoDate, min?: IsoDate, max?: IsoDate): IsoDate {
  // Strings of the same form sort as the days they name.
  if (min !== undefined && day < min) return min;
  if (max !== undefined && day > max) return max;
  return day;
}

/**
 * The day whose month the calendar opens on: the chosen day, or today while none is, held
 * between `min` and `max`.
 */
export function openingDay(
  props: { value?: IsoDate | undefined; min?: IsoDate | undefined; max?: IsoDate | undefined },
  today: IsoDate,
): IsoDate {
  return clampDay(props.value ?? today, props.min, props.max);
}

// ---------------------------------------------------------------- iOS

/**
 * Noon of `day` on the device, for the SwiftUI calendar, which shows the device's time zone.
 * Noon rather than midnight: a clock change skips or repeats an hour of the night, never noon,
 * and the calendar keeps the time of day when a day is pressed.
 */
export function localNoon(day: IsoDate): Date {
  const [year, month, date] = parts(day);
  return new Date(year, month - 1, date, 12);
}

/**
 * `min` and `max` for the SwiftUI calendar: from the first instant of the first day to the last
 * of the last, so that every time of day on both is inside. `undefined` without either.
 */
export function localRange(
  min: IsoDate | undefined,
  max: IsoDate | undefined,
): { start?: Date; end?: Date } | undefined {
  if (min === undefined && max === undefined) return undefined;
  const range: { start?: Date; end?: Date } = {};
  if (min !== undefined) {
    const [year, month, date] = parts(min);
    range.start = new Date(year, month - 1, date);
  }
  if (max !== undefined) {
    const [year, month, date] = parts(max);
    range.end = new Date(year, month - 1, date, 23, 59, 59, 999);
  }
  return range;
}

// ---------------------------------------------------------------- Android

/**
 * `day` for Material 3's calendar, which counts days in UTC whatever the device's time zone:
 * midnight UTC, written out so that nothing reads it as a local time.
 */
export function utcMidnight(day: IsoDate): string {
  return `${day}T00:00:00.000Z`;
}

/** The day Material 3's calendar hands back, which is midnight UTC of the day pressed. */
export function utcDay(date: Date): IsoDate {
  return date.toISOString().slice(0, 10);
}

/**
 * `min` and `max` for Material 3's calendar. Unlike the chosen day, Expo UI reads these two as
 * days on the device and turns them into UTC days itself, so they are given at local noon.
 */
export function selectableDays(
  min: IsoDate | undefined,
  max: IsoDate | undefined,
): { start?: Date; end?: Date } | undefined {
  if (min === undefined && max === undefined) return undefined;
  return {
    ...(min !== undefined && { start: localNoon(min) }),
    ...(max !== undefined && { end: localNoon(max) }),
  };
}

/**
 * The day Material 3's calendar opens with, or none. With no day chosen it opens on this month
 * with nothing chosen, which is right while today can be chosen. When it cannot, the calendar
 * would open on a month of days that are all greyed out, and it takes a month to show only as
 * the month of a chosen day: so it opens with the nearest day that can be chosen.
 */
export function androidInitialDay(
  props: { value?: IsoDate | undefined; min?: IsoDate | undefined; max?: IsoDate | undefined },
  today: IsoDate,
): IsoDate | undefined {
  if (props.value !== undefined) return props.value;
  const held = clampDay(today, props.min, props.max);
  return held === today ? undefined : held;
}
