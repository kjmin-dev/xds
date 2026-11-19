import assert from "node:assert/strict";
import { test } from "node:test";
import {
  dayMarks,
  formatRange,
  isSelected,
  monthsBetween,
  type RangeDraft,
  rangeDayChoice,
  rangeDayName,
  rangeSummary,
  shownRange,
} from "./dateRange.ts";

// The tables every client that draws its own range calendar tests with, so that none of them
// drifts from the web's, whose behavior checks cover the same presses.
//
// | Draft | Day | minLength..maxLength | Choice | On the web |
// | --- | --- | --- | --- | --- |
// | none | 2026-03-20 | 2..14 | start | check 2 |
// | 2026-03-10 – 2026-03-14 (whole) | 2026-03-10 | 2..14 | start | check 4 |
// | 2026-03-20 | 2026-03-15 | 2..14 | start (before the start) | check 3 |
// | 2026-03-10 | 2026-03-10 | 2..14 | none | check 4 |
// | 2026-03-10 | 2026-03-11 | 2..14 | none (one night) | check 4 |
// | 2026-03-10 | 2026-03-12 | 2..14 | end | check 4 |
// | 2026-03-10 | 2026-03-24 | 2..14 | end (14 nights) | check 4 |
// | 2026-03-10 | 2026-03-25 | 2..14 | none (15 nights) | check 4 |
// | 2026-11-16 | 2026-11-16 | 0..none | end (one-day range) | check 5 |
// | 2026-03-28 | 2026-04-03 | 2..14 | end, across months | check 10 |
// | 2026-02-27 | 2026-03-01 | 1..none | end (2 nights over February's end) | not checked |
// | 2024-12-30 | 2025-01-02 | 0..none | end (across a year) | not checked |
test("a press starts, ends or does nothing as the table says", () => {
  const rows: [RangeDraft, string, number, number | undefined, string][] = [
    [[], "2026-03-20", 2, 14, "start"],
    [["2026-03-10", "2026-03-14"], "2026-03-10", 2, 14, "start"],
    [["2026-03-20"], "2026-03-15", 2, 14, "start"],
    [["2026-03-10"], "2026-03-10", 2, 14, "none"],
    [["2026-03-10"], "2026-03-11", 2, 14, "none"],
    [["2026-03-10"], "2026-03-12", 2, 14, "end"],
    [["2026-03-10"], "2026-03-24", 2, 14, "end"],
    [["2026-03-10"], "2026-03-25", 2, 14, "none"],
    [["2026-11-16"], "2026-11-16", 0, undefined, "end"],
    [["2026-03-28"], "2026-04-03", 2, 14, "end"],
    [["2026-02-27"], "2026-03-01", 1, undefined, "end"],
    [["2024-12-30"], "2025-01-02", 0, undefined, "end"],
  ];
  for (const [draft, day, minLength, maxLength, choice] of rows)
    assert.equal(
      rangeDayChoice(draft, day, minLength, maxLength),
      choice,
      `${draft.join()} ${day}`,
    );
});

// And the marks table (band shape, first weekday Sunday):
//
// | Range | Day | Mark |
// | --- | --- | --- |
// | 03-10..03-14 | 03-10 | start (band on the trailing half) |
// | 03-10..03-14 | 03-12 | middle |
// | 03-10..03-14 | 03-14 | end (Saturday: band on the leading half, rounded) |
// | 03-14..03-17 | 03-15 | middle, row start (Sunday: rounded leading edge) |
// | 03-10..03-10 | 03-10 | single (no band) |
// | 03-28..04-03 | 03-31 | middle, last day of the month (flat) |
// | draft 03-10, preview 03-13 | 03-12 | preview middle |
const SUNDAY = 0;
const marks = (draft: RangeDraft, day: string, preview?: string, first: 0 | 1 = SUNDAY) =>
  dayMarks(day, draft, preview, first);

test("the band runs from the middle of the start to the middle of the end", () => {
  const range = ["2026-03-10", "2026-03-14"];
  assert.deepEqual(marks(range, "2026-03-10"), {
    start: true,
    end: false,
    band: { leading: "middle", trailing: "flat" },
    preview: false,
  });
  assert.deepEqual(marks(range, "2026-03-12").band, { leading: "flat", trailing: "flat" });
  // A Saturday, at the end of its row: the end's circle covers where the band stops.
  assert.deepEqual(marks(range, "2026-03-14"), {
    start: false,
    end: true,
    band: { leading: "flat", trailing: "middle" },
    preview: false,
  });
  assert.deepEqual(marks(range, "2026-03-15"), { start: false, end: false, preview: false });
  assert.ok(isSelected(marks(range, "2026-03-12")));
});

test("the band is rounded where a row starts or ends it", () => {
  const range = ["2026-03-14", "2026-03-17"];
  assert.deepEqual(marks(range, "2026-03-15").band, { leading: "round", trailing: "flat" });
  assert.deepEqual(marks(["2026-03-13", "2026-03-16"], "2026-03-14").band, {
    leading: "flat",
    trailing: "round",
  });
  // Weeks from Monday: the same Sunday ends its row instead.
  assert.deepEqual(marks(range, "2026-03-15", undefined, 1).band, {
    leading: "flat",
    trailing: "round",
  });
  // A start on a Saturday and an end on a Sunday have nothing of the band beside them.
  const weekend = ["2026-03-28", "2026-04-05"];
  assert.deepEqual(marks(weekend, "2026-03-28"), { start: true, end: false, preview: false });
  assert.deepEqual(marks(weekend, "2026-04-05"), { start: false, end: true, preview: false });
  assert.deepEqual(marks(weekend, "2026-03-29").band, { leading: "round", trailing: "flat" });
});

test("a one-day range has no band", () => {
  assert.deepEqual(marks(["2026-03-10", "2026-03-10"], "2026-03-10"), {
    start: true,
    end: true,
    preview: false,
  });
});

test("the band stays square at the end of a month in the middle of a week", () => {
  // March 31 is a Tuesday: the band goes on in April.
  const range = ["2026-03-28", "2026-04-03"];
  assert.deepEqual(marks(range, "2026-03-31").band, { leading: "flat", trailing: "flat" });
  assert.deepEqual(marks(range, "2026-04-01").band, { leading: "flat", trailing: "flat" });
});

test("a preview marks the range it would make without selecting it", () => {
  const draft = ["2026-03-10"];
  const middle = marks(draft, "2026-03-12", "2026-03-13");
  assert.deepEqual(middle, {
    start: false,
    end: false,
    band: { leading: "flat", trailing: "flat" },
    preview: true,
  });
  assert.ok(!isSelected(middle));
  const end = marks(draft, "2026-03-13", "2026-03-13");
  assert.ok(end.end && end.preview && !isSelected(end));
  const start = marks(draft, "2026-03-10", "2026-03-13");
  assert.ok(start.start && !start.end && isSelected(start));
  // A start alone, with nothing previewed, is selected and has no band.
  assert.deepEqual(marks(draft, "2026-03-10"), { start: true, end: false, preview: false });
  assert.ok(isSelected(marks(draft, "2026-03-10")));
});

test("the ends are named after their labels", () => {
  const name = "Tuesday, March 10, 2026";
  const named = (start: boolean, end: boolean, preview = false) =>
    rangeDayName({ start, end, preview }, name, "Check-in", "Check-out");
  assert.equal(named(true, false), `Check-in, ${name}`);
  assert.equal(named(false, true), `Check-out, ${name}`);
  assert.equal(named(true, true), `Check-in, Check-out, ${name}`);
  // The end a preview would make is not chosen yet.
  assert.equal(named(false, true, true), name);
  assert.equal(named(false, false), name);
});

test("the sheet's list runs from the month of min to the month of max", () => {
  assert.deepEqual(monthsBetween("2026-03-05", "2026-04-20", "2026-03"), ["2026-03", "2026-04"]);
  assert.deepEqual(monthsBetween("9999-11-01", undefined, "9999-12"), ["9999-11", "9999-12"]);
  assert.deepEqual(monthsBetween(undefined, "0000-02-29", "0000-01"), ["0000-01", "0000-02"]);
  // Without them, a year before the opening month and two years after it.
  const open = monthsBetween(undefined, undefined, "2026-03");
  assert.equal(open.length, 37);
  assert.equal(open[0], "2025-03");
  assert.equal(open.at(-1), "2028-03");
  assert.deepEqual(monthsBetween("2026-12-31", "2027-01-01", "2026-12"), ["2026-12", "2027-01"]);
});

test("the calendar shows a start alone until its end, and the range otherwise", () => {
  const value = { start: "2026-03-10", end: "2026-03-14" };
  assert.deepEqual(shownRange(value, null), ["2026-03-10", "2026-03-14"]);
  assert.deepEqual(shownRange(value, ["2026-03-20"]), ["2026-03-20"]);
  assert.deepEqual(shownRange(undefined, null), []);
});

test("the field says what the two days share once where the engine can", () => {
  const stay = { start: "2026-03-10", end: "2026-03-14" };
  // ICU puts thin spaces around the dash.
  assert.equal(formatRange(stay, "en-US", true), "Mar 10\u2009–\u200914, 2026");
  assert.equal(
    formatRange({ start: "2026-03-28", end: "2026-04-03" }, "en-US", true),
    "Mar 28\u2009–\u2009Apr 3, 2026",
  );
  // Hermes has no formatter for a range: both days in full.
  assert.equal(formatRange(stay, "en-US", false), "Mar 10, 2026 – Mar 14, 2026");
  assert.equal(formatRange(stay, "ko-KR", false), "2026. 3. 10. – 2026. 3. 14.");
  // One day is one day, whichever way.
  const day = { start: "2026-03-10", end: "2026-03-10" };
  assert.equal(formatRange(day, "en-US", true), "Mar 10, 2026");
  assert.equal(formatRange(day, "en-US", false), "Mar 10, 2026");
});

test("the summary names both ends, with a dash for one not chosen yet", () => {
  const labels = { start: "Check-in", end: "Check-out" };
  const medium = (day: string) => `<${day}>`;
  assert.deepEqual(rangeSummary(["2026-03-10", "2026-03-14"], labels, medium), [
    "Check-in: <2026-03-10>",
    "Check-out: <2026-03-14>",
  ]);
  assert.deepEqual(rangeSummary(["2026-03-10"], labels, medium), [
    "Check-in: <2026-03-10>",
    "Check-out: –",
  ]);
  assert.deepEqual(rangeSummary([], labels, medium), ["Check-in: –", "Check-out: –"]);
});
