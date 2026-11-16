// The days, the months and the names a calendar draws, apart from the views, where they can be
// tested in any time zone. A day has no time and no time zone: it is a `YYYY-MM-DD` string, and
// the arithmetic on it is done in UTC, where no clock change skips or repeats an hour.

/** A day of the calendar without a time or a time zone, as `YYYY-MM-DD`. */
export type IsoDate = string;

/** A month of the calendar, as `YYYY-MM`. Like days, months sort as their strings do. */
export type IsoMonth = string;

/** A day of the week, as JavaScript counts them: 0 is Sunday and 6 is Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const pad = (number: number, length = 2) => String(number).padStart(length, "0");

function parts(day: IsoDate): [year: number, month: number, date: number] {
  const [year = 0, month = 1, date = 1] = day.split("-").map(Number);
  return [year, month, date];
}

/** Noon UTC of `day`: the instant every formatter here is given, with the time zone UTC. */
const noon = (day: IsoDate) => {
  const [year, month, date] = parts(day);
  return new Date(Date.UTC(year, month - 1, date, 12));
};

const fromUtc = (date: Date): IsoDate =>
  `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

/** The day `count` days after `day`, or before it for a negative count. */
export function addDays(day: IsoDate, count: number): IsoDate {
  const date = noon(day);
  date.setUTCDate(date.getUTCDate() + count);
  return fromUtc(date);
}

/** How many days `to` is after `from`: the nights of a stay from one to the other. */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((noon(to).getTime() - noon(from).getTime()) / 86_400_000);
}

/** The day of the week of `day`. */
export function weekday(day: IsoDate): Weekday {
  return noon(day).getUTCDay() as Weekday;
}

/** The month `day` is in. */
export const monthOf = (day: IsoDate): IsoMonth => day.slice(0, 7);

/** The month `count` months after `month`, or before it for a negative count. */
export function addMonths(month: IsoMonth, count: number): IsoMonth {
  const [year, number] = parts(`${month}-01`);
  const date = new Date(Date.UTC(year, number - 1 + count, 1, 12));
  return fromUtc(date).slice(0, 7);
}

/** How many days `month` has. */
export function daysInMonth(month: IsoMonth): number {
  const [year, number] = parts(`${month}-01`);
  return new Date(Date.UTC(year, number, 0, 12)).getUTCDate();
}

/**
 * The weeks of `month`, each of seven days from `firstDay`. Days of the months before and after
 * are not shown, so they are null.
 */
export function monthWeeks(month: IsoMonth, firstDay: Weekday): (IsoDate | null)[][] {
  const before = (weekday(`${month}-01`) - firstDay + 7) % 7;
  const days: (IsoDate | null)[] = [
    ...Array.from({ length: before }, () => null),
    ...Array.from({ length: daysInMonth(month) }, (_, index) => `${month}-${pad(index + 1)}`),
  ];
  const weeks: (IsoDate | null)[][] = [];
  for (let start = 0; start < days.length; start += 7) {
    const week = days.slice(start, start + 7);
    weeks.push([...week, ...Array.from({ length: 7 - week.length }, () => null)]);
  }
  return weeks;
}

/** `day`, or the nearer of `min` and `max` when it is outside them. */
export function clampDay(day: IsoDate, min?: IsoDate, max?: IsoDate): IsoDate {
  // Strings of the same form sort as the days they name.
  if (min !== undefined && day < min) return min;
  if (max !== undefined && day > max) return max;
  return day;
}

/** Whether `day` is between `min` and `max`, which may each be missing. */
export function inRange(day: IsoDate, min?: IsoDate, max?: IsoDate): boolean {
  return (min === undefined || day >= min) && (max === undefined || day <= max);
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

/** Whether the month before `month` has a day on or after `min`, so its button is enabled. */
export function hasMonthBefore(month: IsoMonth, min?: IsoDate): boolean {
  return min === undefined || monthOf(min) < month;
}

/** Whether the month after `month` has a day on or before `max`, so its button is enabled. */
export function hasMonthAfter(month: IsoMonth, max?: IsoDate): boolean {
  return max === undefined || monthOf(max) > month;
}

/** The day it is on the device at the instant `now`. */
export function localDay(now: Date): IsoDate {
  return `${pad(now.getFullYear(), 4)}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// ---------------------------------------------------------------- names

/**
 * The day as the field shows it: the locale's medium form ("Mar 10, 2026", "2026. 3. 10."), in
 * the device's locale unless one is given. Read at noon UTC and formatted in UTC, so no time
 * zone can move it to another day.
 */
export function formatDay(value: IsoDate, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(
    noon(value),
  );
}

/** What a screen reader calls the field: the day or the placeholder it shows, then its label. */
export function fieldName(label: string, shown: string | undefined): string {
  return shown ? `${shown}, ${label}` : label;
}

/** The names a calendar shows and says, in one locale. */
export type CalendarNames = {
  /** The day the weeks start on. */
  firstDay: Weekday;
  /** "March 2026": the heading of a month, and the name of its grid. */
  month: (month: IsoMonth) => string;
  /** The seven initials over the columns, from `firstDay`. */
  initials: string[];
  /** "Tuesday, March 10, 2026": a day's name for a screen reader. */
  day: (day: IsoDate) => string;
  /** The day in the field's medium form. */
  medium: (day: IsoDate) => string;
};

/** The calendar's names in `locale`, or in the device's. */
export function calendarNames(locale?: string): CalendarNames {
  const resolved = new Intl.DateTimeFormat(locale).resolvedOptions().locale;
  const firstDay = firstWeekday(resolved);
  const month = new Intl.DateTimeFormat(resolved, {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  const initial = new Intl.DateTimeFormat(resolved, { weekday: "narrow", timeZone: "UTC" });
  const full = new Intl.DateTimeFormat(resolved, { dateStyle: "full", timeZone: "UTC" });
  // 2026-03-01 is a Sunday, and the days after it name the rest of the week.
  const initials = Array.from({ length: 7 }, (_, column) =>
    initial.format(noon(addDays("2026-03-01", (firstDay + column) % 7))),
  );
  return {
    firstDay,
    month: (shown) => month.format(noon(`${shown}-01`)),
    initials,
    day: (day) => full.format(noon(day)),
    medium: (day) => formatDay(day, resolved),
  };
}

// The regions whose weeks do not start on Monday, from CLDR 48's week data (the `firstDay` of
// supplementalData.xml). Hermes, which runs React Native's JavaScript, has no Intl.Locale to ask.
const WEEK_STARTS: [Weekday, string][] = [
  [
    0,
    "AG AS BD BR BS BT BW BZ CA CO DM DO ET GT GU HK HN ID IL IN IS JM JP KE KH KR LA MH MM MO MT " +
      "MX MZ NI NP PA PE PH PK PR PT PY SA SG SV TH TT TW UM US VE VI WS YE ZA ZW",
  ],
  [5, "MV"],
  [6, "AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY"],
];
const FIRST_DAY = new Map(
  WEEK_STARTS.flatMap(([day, regions]) => regions.split(" ").map((region) => [region, day])),
);

/**
 * The day the weeks start on in `locale` (a BCP 47 tag such as `en-US` or `zh-Hant-TW`), from
 * its region. Without a region it is Monday, CLDR's first day for the world.
 */
export function firstWeekday(locale: string): Weekday {
  const region = locale
    .split("-u-")[0]
    ?.split("-")
    .slice(1)
    .find((part) => /^[A-Z]{2}$/i.test(part));
  return FIRST_DAY.get(region?.toUpperCase() ?? "") ?? 1;
}
