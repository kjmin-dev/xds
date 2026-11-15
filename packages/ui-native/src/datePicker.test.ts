import assert from "node:assert/strict";
import { test } from "node:test";
import {
  androidInitialDay,
  clampDay,
  fieldName,
  formatDay,
  localDay,
  localNoon,
  localRange,
  openingDay,
  selectableDays,
  utcDay,
  utcMidnight,
} from "./datePicker.ts";

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

/** What Expo UI's Android view does with `selectableDates`: the local day, as a UTC day. */
const asUtcDay = (local: Date) => Date.UTC(local.getFullYear(), local.getMonth(), local.getDate());

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

test("iOS: a day goes to the calendar at local noon and comes back the same day", () => {
  for (const zone of ZONES) {
    inZone(zone, () => {
      for (const day of DAYS) {
        const noon = localNoon(day);
        assert.equal(noon.getHours(), 12, `${day} in ${zone}`);
        assert.equal(localDay(noon), day, `${day} in ${zone}`);
      }
    });
  }
});

test("iOS: the calendar's instant is read as a day on the device", () => {
  // 20:00 UTC on March 10 is the 10th in the west and already the 11th in the east.
  const instant = new Date("2026-03-10T20:00:00Z");
  inZone("Pacific/Pago_Pago", () => assert.equal(localDay(instant), "2026-03-10"));
  inZone("America/Los_Angeles", () => assert.equal(localDay(instant), "2026-03-10"));
  inZone("Asia/Seoul", () => assert.equal(localDay(instant), "2026-03-11"));
  inZone("Pacific/Kiritimati", () => assert.equal(localDay(instant), "2026-03-11"));
});

test("iOS: min and max hold every time of day on the first and the last day", () => {
  assert.equal(localRange(undefined, undefined), undefined);
  for (const zone of ZONES) {
    inZone(zone, () => {
      for (const day of DAYS) {
        const { start, end } = localRange(day, day) ?? {};
        assert.ok(start && end, `${day} in ${zone}`);
        assert.equal(localDay(start), day, `start of ${day} in ${zone}`);
        assert.equal(localDay(end), day, `end of ${day} in ${zone}`);
        assert.ok(start <= localNoon(day) && localNoon(day) <= end, `${day} in ${zone}`);
        // Nothing of the day is left out at either end.
        assert.notEqual(localDay(new Date(start.getTime() - 1)), day, `${day} in ${zone}`);
        assert.notEqual(localDay(new Date(end.getTime() + 1)), day, `${day} in ${zone}`);
      }
      assert.deepEqual(Object.keys(localRange("2026-03-05", undefined) ?? {}), ["start"]);
      assert.deepEqual(Object.keys(localRange(undefined, "2026-04-20") ?? {}), ["end"]);
    });
  }
});

test("Android: a day goes to the calendar as midnight UTC and comes back the same day", () => {
  for (const zone of ZONES) {
    inZone(zone, () => {
      for (const day of DAYS) {
        const [year = 0, month = 1, date = 1] = day.split("-").map(Number);
        const sent = new Date(utcMidnight(day));
        assert.equal(sent.getTime(), Date.UTC(year, month - 1, date), `${day} in ${zone}`);
        assert.equal(utcDay(sent), day, `${day} in ${zone}`);
      }
    });
  }
});

test("Android: min and max are days on the device, which Expo UI turns into UTC days", () => {
  assert.equal(selectableDays(undefined, undefined), undefined);
  for (const zone of ZONES) {
    inZone(zone, () => {
      for (const day of DAYS) {
        const { start, end } = selectableDays(day, day) ?? {};
        assert.ok(start && end, `${day} in ${zone}`);
        // The day itself, the first and the last that can be chosen, is the day the calendar
        // would hand back for it.
        assert.equal(asUtcDay(start), new Date(utcMidnight(day)).getTime(), `${day} in ${zone}`);
        assert.equal(utcDay(new Date(asUtcDay(end))), day, `${day} in ${zone}`);
      }
      assert.deepEqual(Object.keys(selectableDays("2026-03-05", undefined) ?? {}), ["start"]);
      assert.deepEqual(Object.keys(selectableDays(undefined, "2026-04-20") ?? {}), ["end"]);
    });
  }
});

test("Android: with no day chosen the calendar opens empty, unless today cannot be chosen", () => {
  const range = { min: "2026-03-05", max: "2026-04-20" };
  assert.equal(androidInitialDay({ value: "2026-03-10", ...range }, "2026-11-14"), "2026-03-10");
  assert.equal(androidInitialDay(range, "2026-03-20"), undefined);
  assert.equal(androidInitialDay({}, "2026-11-14"), undefined);
  // Today is after the last day or before the first: the month of the nearest one.
  assert.equal(androidInitialDay(range, "2026-11-14"), "2026-04-20");
  assert.equal(androidInitialDay(range, "2026-01-02"), "2026-03-05");
});
