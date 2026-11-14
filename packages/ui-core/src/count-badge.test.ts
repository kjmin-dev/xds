import assert from "node:assert/strict";
import { test } from "node:test";
import { countBadgeText } from "./count-badge.ts";

test("a count past its maximum reads as the maximum and a plus", () => {
  assert.equal(countBadgeText(3), "3");
  assert.equal(countBadgeText(99), "99");
  assert.equal(countBadgeText(120), "99+");
  assert.equal(countBadgeText(7, 5), "5+");
});
