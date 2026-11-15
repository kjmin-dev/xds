import assert from "node:assert/strict";
import { test } from "node:test";
import type { DayTableCellState } from "@zag-js/date-picker";
import {
  clampDay,
  datePickerContentAttrs,
  datePickerIds,
  datePickerTranslations,
  datePickerTriggerAttrs,
  formatDay,
  openingDay,
} from "./date-picker.ts";

test("the field shows the day in the locale's medium form", () => {
  assert.equal(formatDay("2026-03-10", "en-US"), "Mar 10, 2026");
  assert.equal(formatDay("2026-03-10", "ko-KR"), "2026. 3. 10.");
});

test("no time zone moves a day at the end of a month to the next", () => {
  for (const timeZone of ["Pacific/Kiritimati", "Pacific/Pago_Pago", "Asia/Seoul"]) {
    process.env.TZ = timeZone;
    assert.equal(formatDay("2026-01-31", "en-US"), "Jan 31, 2026");
    assert.equal(formatDay("2026-12-31", "en-US"), "Dec 31, 2026");
  }
  delete process.env.TZ;
});

test("a day outside min and max is held at the nearer one", () => {
  assert.equal(clampDay("2026-03-03", "2026-03-05", "2026-04-20"), "2026-03-05");
  assert.equal(clampDay("2026-05-05", "2026-03-05", "2026-04-20"), "2026-04-20");
  assert.equal(clampDay("2026-03-10", "2026-03-05", "2026-04-20"), "2026-03-10");
  assert.equal(clampDay("1999-12-31"), "1999-12-31");
});

test("the calendar opens on the chosen day, or on today held between min and max", () => {
  const range = { min: "2026-03-05", max: "2026-04-20" };
  assert.equal(openingDay({ value: "2026-03-10", ...range }, "2026-11-14"), "2026-03-10");
  assert.equal(openingDay(range, "2026-11-14"), "2026-04-20");
  assert.equal(openingDay(range, "2026-01-02"), "2026-03-05");
  assert.equal(openingDay(range, "2026-03-20"), "2026-03-20");
  assert.equal(openingDay({}, "2026-11-14"), "2026-11-14");
});

test("the field opens a dialog, named by the day and the label, and described by the error", () => {
  const ids = datePickerIds("due");
  assert.deepEqual(datePickerTriggerAttrs({ description: "Within the sprint." }, ids), {
    "aria-label": undefined,
    "aria-haspopup": "dialog",
    "aria-labelledby": "due-value due-label",
    "aria-describedby": "due-description",
    "data-invalid": undefined,
  });
  const invalid = datePickerTriggerAttrs({ description: "Help", error: "Choose a day." }, ids);
  assert.equal(invalid["aria-describedby"], "due-error");
  assert.equal(invalid["data-invalid"], "");
  assert.equal(datePickerTriggerAttrs({}, ids)["aria-describedby"], undefined);
  assert.deepEqual(datePickerContentAttrs(ids), {
    role: "dialog",
    "aria-label": undefined,
    "aria-labelledby": "due-label",
  });
});

test("a day is named by its long name alone, and the month buttons by the labels given", () => {
  const defaults = datePickerTranslations({});
  const chosenToday = { valueText: "Tuesday, March 10, 2026", selected: true, today: true };
  assert.equal(defaults.dayCell?.(chosenToday as DayTableCellState), "Tuesday, March 10, 2026");
  assert.equal(defaults.previousTrigger?.("day"), "Previous month");
  assert.equal(defaults.nextTrigger?.("day"), "Next month");
  const given = datePickerTranslations({ previousLabel: "이전 달", nextLabel: "다음 달" });
  assert.equal(given.previousTrigger?.("day"), "이전 달");
  assert.equal(given.nextTrigger?.("day"), "다음 달");
});
