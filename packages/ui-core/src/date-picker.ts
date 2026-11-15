import { space } from "@acme/tokens";
import { type DateValue, getLocalTimeZone, parseDate, today } from "@internationalized/date";
import type * as datePicker from "@zag-js/date-picker";
import { buttonClass } from "./button.ts";

/** A day of the calendar without a time or a time zone, as `YYYY-MM-DD`. */
export type IsoDate = string;

/** DatePicker's props in every framework, short of `onChange`. */
export type DatePickerBaseProps = {
  /** Always visible, like a TextField's. */
  label: string;
  /** The chosen day. Leave it out while none is chosen. */
  value?: IsoDate | undefined;
  /** The first day that can be chosen. */
  min?: IsoDate | undefined;
  /** The last day that can be chosen. */
  max?: IsoDate | undefined;
  /** Shown in the field while no day is chosen. */
  placeholder?: string;
  /** Help shown under the field. Replaced by `error` while there is one. */
  description?: string;
  /** What is wrong and how to fix it. Clear it when the value changes. */
  error?: string | undefined;
  /** The name the day is submitted under with a form, as `YYYY-MM-DD`. */
  name?: string;
  disabled?: boolean;
  /** Names the calendar's button to the month before, for assistive technology. */
  previousLabel?: string;
  /** Names the calendar's button to the month after, for assistive technology. */
  nextLabel?: string;
};

/**
 * The day as the field shows it: the locale's medium form ("Mar 10, 2026", "2026. 3. 10.").
 * Read at noon UTC and formatted in UTC, so no time zone can move it to another day.
 */
export function formatDay(value: IsoDate, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(`${value}T12:00:00Z`),
  );
}

/** Today where the page runs. */
export function todayIso(): IsoDate {
  return today(getLocalTimeZone()).toString();
}

/** `day`, or the nearer of `min` and `max` when it is outside them. */
export function clampDay(day: IsoDate, min?: IsoDate, max?: IsoDate): IsoDate {
  // Strings of the same form sort as the days they name.
  if (min !== undefined && day < min) return min;
  if (max !== undefined && day > max) return max;
  return day;
}

/**
 * The day that has the focus when the calendar opens, whose month it shows: the chosen day, or
 * today while none is, held between `min` and `max`.
 */
export function openingDay(
  props: Pick<DatePickerBaseProps, "value" | "min" | "max">,
  now: IsoDate = todayIso(),
): IsoDate {
  return clampDay(props.value ?? now, props.min, props.max);
}

/**
 * The language of the names of the days and months, and of the field's form of a day: the
 * page's, as a native date input takes it. Zag's own default is English.
 */
export function datePickerLocale(): string {
  return typeof navigator === "undefined" ? "en-US" : navigator.language;
}

/** The ids of the parts the library names itself, under the DatePicker's own id. */
export function datePickerIds(id: string) {
  return {
    label: `${id}-label`,
    value: `${id}-value`,
    description: `${id}-description`,
    error: `${id}-error`,
  };
}

type Ids = ReturnType<typeof datePickerIds>;

/**
 * The props of Zag's date-picker machine for a DatePicker. `onChange` gets the chosen day as
 * `YYYY-MM-DD`. One month of days and nothing else: no text input (the field is a button), no
 * month or year views, and no days of the months around it.
 */
export function datePickerMachineProps(
  props: DatePickerBaseProps,
  options: { id: string; locale: string; onChange: (value: IsoDate) => void },
): datePicker.Props {
  const day = (value: IsoDate | undefined) => (value === undefined ? undefined : parseDate(value));
  return {
    id: options.id,
    locale: options.locale,
    // Today is the day where the page runs; Zag's own is the day in UTC.
    timeZone: getLocalTimeZone(),
    value: props.value === undefined ? [] : [parseDate(props.value)],
    min: day(props.min),
    max: day(props.max),
    defaultFocusedValue: parseDate(openingDay(props)),
    onValueChange: (details) => {
      const next = details.value[0];
      if (next !== undefined) options.onChange(next.toString());
    },
    disabled: props.disabled,
    invalid: props.error !== undefined,
    // Zag gives `name` to its text input, which is not drawn: each library draws a hidden input
    // of its own for a form.
    outsideDaySelectable: false,
    minView: "day",
    maxView: "day",
    positioning: { placement: "bottom-start", gutter: space[1] },
    translations: datePickerTranslations(props),
  };
}

/**
 * Zag's strings that the calendar shows assistive technology. A day is named by its long
 * localized name alone ("Tuesday, March 10, 2026"): its grid cell says whether it is selected
 * and whether it is today, where Zag would add English words for both. The month buttons take
 * `previousLabel` and `nextLabel`. Zag's other strings name parts that are not drawn, or whose
 * names `datePickerTriggerAttrs` and `datePickerContentAttrs` replace.
 */
export function datePickerTranslations(
  props: Pick<DatePickerBaseProps, "previousLabel" | "nextLabel">,
): datePicker.IntlTranslations {
  return {
    dayCell: (state) => state.valueText,
    previousTrigger: () => props.previousLabel ?? "Previous month",
    nextTrigger: () => props.nextLabel ?? "Next month",
  };
}

/**
 * Spread over Zag's props of the field, the trigger, after them: a button that says it opens a
 * dialog, the calendar, named by the chosen day (or the placeholder) and then the label, as a
 * Select's field is, and described by the help or the error. Zag's English name ("Open
 * calendar") goes. The error is said in the description, so the button does not
 * claim to be invalid; `data-invalid` draws the field's error border.
 */
export function datePickerTriggerAttrs(
  props: Pick<DatePickerBaseProps, "error" | "description">,
  ids: Ids,
) {
  const invalid = props.error !== undefined;
  return {
    "aria-label": undefined,
    "aria-haspopup": "dialog",
    "aria-labelledby": `${ids.value} ${ids.label}`,
    "aria-describedby": invalid ? ids.error : props.description ? ids.description : undefined,
    "data-invalid": invalid ? "" : undefined,
  } as const;
}

/**
 * Spread over Zag's props of the calendar's surface, the content, after them: a dialog named
 * by the field's label, in place of Zag's `application` role and its English name.
 */
export function datePickerContentAttrs(ids: Ids) {
  return {
    role: "dialog",
    "aria-label": undefined,
    "aria-labelledby": ids.label,
  } as const;
}

/**
 * For the click handler of the field, ahead of Zag's: the calendar opens on the day
 * `openingDay` names. Zag goes back to the chosen day itself, but with none chosen it would open
 * on whatever day the focus was on when the calendar last closed.
 */
export function focusOpeningDay(
  api: { open: boolean; setFocusedValue(value: DateValue): void },
  props: Pick<DatePickerBaseProps, "value" | "min" | "max">,
): void {
  if (!api.open) api.setFocusedValue(parseDate(openingDay(props)));
}

/**
 * For the keydown handler of the calendar's surface: Tab and Shift+Tab go round the month
 * buttons that can be pressed and the focused day, as in a modal dialog. Zag would let the focus
 * leave, which closes the calendar without a choice.
 */
export function keepCalendarFocus(
  event: { key: string; shiftKey: boolean; preventDefault(): void },
  content: HTMLElement | null | undefined,
): void {
  if (event.key !== "Tab" || !content) return;
  event.preventDefault();
  const stops = [
    ...content.querySelectorAll<HTMLElement>('button:not(:disabled), [role="grid"] [tabindex="0"]'),
  ];
  const at = stops.indexOf(document.activeElement as HTMLElement);
  const next =
    at === -1
      ? event.shiftKey
        ? stops.length - 1
        : 0
      : (at + (event.shiftKey ? -1 : 1) + stops.length) % stops.length;
  stops[next]?.focus();
}

/**
 * After a render in which the focused day or the month changed, while the calendar is open:
 * puts the focus back on the focused day if the change took it off. Zag focuses the day a key
 * moves to a frame after the move, but a move held at `min` or `max` into another month shows
 * that month a render later, which a framework that renders after the frame has not drawn yet:
 * the day the focus was on is gone, and the focus with it. A focus elsewhere in the calendar,
 * such as on a month button that was pressed, stays where it is.
 */
export function keepDayFocused(open: boolean, content: HTMLElement | null | undefined): void {
  const grid = open ? content?.querySelector('[role="grid"]') : undefined;
  if (!grid) return;
  const active = document.activeElement;
  if (active !== null && active !== document.body && !grid.contains(active)) return;
  const day = grid.querySelector<HTMLElement>("[data-focus]:not([data-outside-range])");
  if (day && day !== active) day.focus({ preventScroll: true });
}

/** The classes of the calendar's month buttons: a small ghost IconButton's. */
export const DATE_PICKER_NAV_CLASS = buttonClass({
  variant: "ghost",
  size: "sm",
  iconButton: true,
});
