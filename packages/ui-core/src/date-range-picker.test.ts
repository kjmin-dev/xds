import assert from "node:assert/strict";
import { test } from "node:test";
import type { DayTableCellState } from "@zag-js/date-picker";
import {
  dateRangeTranslations,
  daysBetween,
  formatRange,
  rangeDayChoice,
  rangeSummary,
  shownRange,
} from "./date-range-picker.ts";

const STAY = { minLength: 2, maxLength: 14 };

// The table every client checks (the plan's section 8.2): the draft, the day pressed, the
// length allowed, and what the press does.
const CHOICES: [draft: string[], day: string, length: object, choice: string][] = [
  [[], "2026-03-20", STAY, "start"],
  [["2026-03-10", "2026-03-14"], "2026-03-10", STAY, "start"],
  [["2026-03-20"], "2026-03-15", STAY, "start"],
  [["2026-03-10"], "2026-03-10", STAY, "none"],
  [["2026-03-10"], "2026-03-11", STAY, "none"],
  [["2026-03-10"], "2026-03-12", STAY, "end"],
  [["2026-03-10"], "2026-03-24", STAY, "end"],
  [["2026-03-10"], "2026-03-25", STAY, "none"],
  [["2026-11-16"], "2026-11-16", {}, "end"],
  [["2026-03-28"], "2026-04-03", STAY, "end"],
  [["2026-02-27"], "2026-03-01", { minLength: 1 }, "end"],
  [["2024-12-30"], "2025-01-02", {}, "end"],
];

test("a press starts, ends, starts again, or does nothing, by the draft and the length", () => {
  for (const [draft, day, length, choice] of CHOICES) {
    assert.equal(rangeDayChoice(draft, day, length), choice, `${draft.join("–")} ${day}`);
  }
});

test("the length of a range counts the nights, across a month, a leap day and a year", () => {
  assert.equal(daysBetween("2026-03-10", "2026-03-14"), 4);
  assert.equal(daysBetween("2026-03-28", "2026-04-03"), 6);
  assert.equal(daysBetween("2024-02-28", "2024-03-01"), 2);
  assert.equal(daysBetween("2024-12-30", "2025-01-02"), 3);
  assert.equal(daysBetween("2026-03-20", "2026-03-15"), -5);
  // A day that has 23 hours where the clocks go forward.
  process.env.TZ = "America/New_York";
  assert.equal(daysBetween("2026-03-07", "2026-03-09"), 2);
  delete process.env.TZ;
});

test("the field says what the two days share once, in the locale's form", () => {
  // Chrome and Node put thin spaces around the dash: compared with plain ones.
  const plain = (text: string) => text.replace(/\s/g, " ");
  assert.equal(
    plain(formatRange({ start: "2026-03-10", end: "2026-03-14" }, "en-US")),
    "Mar 10 – 14, 2026",
  );
  assert.equal(
    plain(formatRange({ start: "2026-03-28", end: "2026-04-03" }, "en-US")),
    "Mar 28 – Apr 3, 2026",
  );
  assert.equal(
    plain(formatRange({ start: "2025-12-30", end: "2026-01-02" }, "en-US")),
    "Dec 30, 2025 – Jan 2, 2026",
  );
  assert.equal(
    plain(formatRange({ start: "2026-03-10", end: "2026-03-10" }, "en-US")),
    "Mar 10, 2026",
  );
  // How much of the second day the language leaves out depends on the ICU data of the engine.
  assert.match(
    plain(formatRange({ start: "2026-03-10", end: "2026-03-14" }, "ko-KR")),
    /^2026\. 3\. 10\. ~ (2026\. 3\. )?14\.$/,
  );
});

test("no time zone moves an end at the end of a month to the next", () => {
  for (const timeZone of ["Pacific/Kiritimati", "Pacific/Pago_Pago"]) {
    process.env.TZ = timeZone;
    assert.match(
      formatRange({ start: "2026-01-30", end: "2026-01-31" }, "en-US"),
      /^Jan 30\s–\s31, 2026$/,
    );
  }
  delete process.env.TZ;
});

test("the calendar shows the draft while there is one, otherwise the chosen range", () => {
  const value = { start: "2026-03-10", end: "2026-03-14" };
  assert.deepEqual(shownRange(value, null), ["2026-03-10", "2026-03-14"]);
  assert.deepEqual(shownRange(value, ["2026-03-20"]), ["2026-03-20"]);
  assert.deepEqual(shownRange(undefined, null), []);
});

test("the ends are named by their labels, both on a range of one day", () => {
  const name = dateRangeTranslations({ startLabel: "Check-in", endLabel: "Check-out" }).dayCell;
  const cell = (firstInRange: boolean, lastInRange: boolean) =>
    name?.({
      valueText: "Tuesday, March 10, 2026",
      firstInRange,
      lastInRange,
    } as DayTableCellState);
  assert.equal(cell(true, false), "Check-in, Tuesday, March 10, 2026");
  assert.equal(cell(false, true), "Check-out, Tuesday, March 10, 2026");
  assert.equal(cell(true, true), "Check-in, Check-out, Tuesday, March 10, 2026");
  assert.equal(cell(false, false), "Tuesday, March 10, 2026");
  assert.equal(
    dateRangeTranslations({}).dayCell?.({
      valueText: "X",
      firstInRange: true,
    } as DayTableCellState),
    "Start, X",
  );
});

test("the summary names each end, with a dash until it is chosen", () => {
  const labels = { startLabel: "Check-in", endLabel: "Check-out" };
  assert.deepEqual(rangeSummary(["2026-03-20"], labels, "en-US"), {
    start: "Check-in: Mar 20, 2026",
    end: "Check-out: –",
  });
  assert.deepEqual(rangeSummary([], {}, "en-US"), { start: "Start: –", end: "End: –" });
});
