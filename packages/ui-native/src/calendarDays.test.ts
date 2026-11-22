import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addDays,
  addMonths,
  calendarNames,
  clampDay,
  daysBetween,
  daysInMonth,
  fieldName,
  firstWeekday,
  formatDay,
  hasMonthAfter,
  hasMonthBefore,
  inRange,
  localDay,
  monthWeeks,
  openingDay,
} from "./calendarDays.ts";

// The farthest zones on each side of UTC, one that changes its clocks in each hemisphere, and
// the zone this was written in. In America/Santiago the clocks skip midnight itself when
// summer time starts (2026-09-06 has no 00:00).
const WEST = ["Pacific/Pago_Pago", "America/Los_Angeles", "America/Santiago"];
const EAST = ["Pacific/Kiritimati", "Asia/Seoul", "Europe/Berlin"];
const ZONES = [...WEST, "UTC", ...EAST];

// Days where a wrong reading shows: the ends of a month and a year, a leap day, and the days
// the clocks change in the zones above.
const DAYS = [
  "2026-03-10",
  "2026-01-01",
  "2026-01-31",
  "2026-12-31",
  "2024-02-29",
  "2026-03-08",
  "2026-03-29",
  "2026-09-06",
  "2026-11-01",
];

function inZone<Result>(timeZone: string, run: () => Result): Result {
  const before = process.env.TZ;
  process.env.TZ = timeZone;
  try {
    return run();
  } finally {
    if (before === undefined) delete process.env.TZ;
    else process.env.TZ = before;
  }
}

test("the zones of the tests are west and east of UTC", () => {
  const offset = (zone: string) =>
    inZone(zone, () => new Date("2026-03-10T12:00:00Z").getTimezoneOffset());
  // getTimezoneOffset is positive west of UTC.
  for (const zone of WEST) assert.ok(offset(zone) > 0, zone);
  for (const zone of EAST) assert.ok(offset(zone) < 0, zone);
  inZone("America/Santiago", () => assert.equal(new Date(2026, 8, 6, 0).getHours(), 1));
});

test("the field shows the day in the locale's medium form", () => {
  assert.equal(formatDay("2026-03-10", "en-US"), "Mar 10, 2026");
  assert.equal(formatDay("2026-03-10", "ko-KR"), "2026. 3. 10.");
});

test("no time zone moves the day the field shows", () => {
  for (const zone of ZONES) {
    inZone(zone, () => {
      assert.equal(formatDay("2026-01-31", "en-US"), "Jan 31, 2026", zone);
      assert.equal(formatDay("2026-12-31", "en-US"), "Dec 31, 2026", zone);
      assert.equal(formatDay("2026-03-01", "en-US"), "Mar 1, 2026", zone);
    });
  }
});

test("a screen reader hears the day or the placeholder, then the label", () => {
  assert.equal(fieldName("Due date", "Mar 10, 2026"), "Mar 10, 2026, Due date");
  assert.equal(fieldName("Start date", "Choose a day"), "Choose a day, Start date");
  assert.equal(fieldName("Start date", undefined), "Start date");
});

test("today is the day on the device, not the day in UTC", () => {
  const instant = new Date("2026-11-14T20:00:00Z");
  inZone("Pacific/Pago_Pago", () => assert.equal(localDay(instant), "2026-11-14"));
  inZone("UTC", () => assert.equal(localDay(instant), "2026-11-14"));
  inZone("Asia/Seoul", () => assert.equal(localDay(instant), "2026-11-15"));
  inZone("Pacific/Kiritimati", () => assert.equal(localDay(instant), "2026-11-15"));
  // And the other way round the date line: early in the UTC day, the west is a day behind.
  const early = new Date("2026-01-01T03:00:00Z");
  inZone("America/Los_Angeles", () => assert.equal(localDay(early), "2025-12-31"));
  inZone("Asia/Seoul", () => assert.equal(localDay(early), "2026-01-01"));
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

test("no time zone moves a day by a day, or a day's distance from another", () => {
  for (const zone of ZONES) {
    inZone(zone, () => {
      for (const day of DAYS) {
        assert.equal(addDays(addDays(day, 1), -1), day, `${zone} ${day}`);
        assert.equal(daysBetween(day, addDays(day, 40)), 40, `${zone} ${day}`);
      }
      assert.equal(addDays("2026-02-28", 1), "2026-03-01", zone);
      assert.equal(addDays("2024-02-28", 1), "2024-02-29", zone);
      assert.equal(addDays("2026-12-31", 1), "2027-01-01", zone);
      assert.equal(daysBetween("2026-03-10", "2026-03-08"), -2, zone);
    });
  }
});

test("a month on keeps to the months, whatever their lengths", () => {
  assert.equal(addMonths("2026-01", 1), "2026-02");
  assert.equal(addMonths("2026-12", 1), "2027-01");
  assert.equal(addMonths("2026-01", -1), "2025-12");
  assert.equal(addMonths("2026-03", -12), "2025-03");
  assert.equal(daysInMonth("2026-02"), 28);
  assert.equal(daysInMonth("2024-02"), 29);
  assert.equal(daysInMonth("2026-04"), 30);
  assert.equal(daysInMonth("2026-12"), 31);
});

test("a month is laid out in weeks from the locale's first day, without its neighbours' days", () => {
  // March 2026 starts on a Sunday and ends on a Tuesday.
  const sunday = monthWeeks("2026-03", 0);
  assert.equal(sunday.length, 5);
  assert.deepEqual(sunday[0]?.slice(0, 2), ["2026-03-01", "2026-03-02"]);
  assert.deepEqual(sunday[4], ["2026-03-29", "2026-03-30", "2026-03-31", null, null, null, null]);
  // From Monday, the first Sunday is the last day of the first row.
  const monday = monthWeeks("2026-03", 1);
  assert.equal(monday.length, 6);
  assert.deepEqual(monday[0], [null, null, null, null, null, null, "2026-03-01"]);
  // February 2026 fills four rows exactly from Sunday.
  assert.equal(monthWeeks("2026-02", 0).length, 4);
  for (const week of monthWeeks("2026-08", 6)) assert.equal(week.length, 7);
});

test("the month buttons stop at the months of min and max", () => {
  assert.ok(!hasMonthBefore("2026-03", "2026-03-05"));
  assert.ok(hasMonthBefore("2026-04", "2026-03-05"));
  assert.ok(hasMonthAfter("2026-03", "2026-04-20"));
  assert.ok(!hasMonthAfter("2026-04", "2026-04-20"));
  assert.ok(hasMonthBefore("2026-03") && hasMonthAfter("2026-03"));
  assert.ok(inRange("2026-03-05", "2026-03-05", "2026-04-20"));
  assert.ok(!inRange("2026-03-04", "2026-03-05", "2026-04-20"));
  assert.ok(!inRange("2026-04-21", "2026-03-05", "2026-04-20"));
  assert.ok(inRange("1999-01-01"));
});

test("the week starts on the day the locale's region starts it", () => {
  assert.equal(firstWeekday("en-US"), 0);
  assert.equal(firstWeekday("ko-KR"), 0);
  assert.equal(firstWeekday("en-GB"), 1);
  assert.equal(firstWeekday("de-DE"), 1);
  assert.equal(firstWeekday("zh-Hant-TW"), 0);
  assert.equal(firstWeekday("ar-EG"), 6);
  assert.equal(firstWeekday("dv-MV"), 5);
  assert.equal(firstWeekday("en-US-u-ca-gregory"), 0);
  // No region: Monday, as CLDR has it for the world.
  assert.equal(firstWeekday("fr"), 1);
});

test("the calendar's names are the locale's", () => {
  const english = calendarNames("en-US");
  assert.equal(english.firstDay, 0);
  assert.equal(english.month("2026-03"), "March 2026");
  assert.deepEqual(english.initials, ["S", "M", "T", "W", "T", "F", "S"]);
  assert.equal(english.day("2026-03-10"), "Tuesday, March 10, 2026");
  assert.equal(english.medium("2026-03-10"), "Mar 10, 2026");
  const british = calendarNames("en-GB");
  assert.deepEqual(british.initials, ["M", "T", "W", "T", "F", "S", "S"]);
  const korean = calendarNames("ko-KR");
  assert.equal(korean.month("2026-03"), "2026년 3월");
  assert.equal(korean.initials[0], "일");
  // Read at noon UTC and formatted in UTC: no zone shows another day.
  for (const zone of ZONES)
    inZone(zone, () =>
      assert.equal(calendarNames("en-US").day("2026-01-01"), "Thursday, January 1, 2026", zone),
    );
});
