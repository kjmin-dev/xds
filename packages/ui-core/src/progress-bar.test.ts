import assert from "node:assert/strict";
import { test } from "node:test";
import { progressPercent } from "./progress-bar.ts";

test("progress is a whole percentage", () => {
  assert.equal(progressPercent(0.6), 60);
  assert.equal(progressPercent(0.333), 33);
  assert.equal(progressPercent(0.005), 1);
});

test("progress outside 0 to 1 is clamped", () => {
  assert.equal(progressPercent(-0.2), 0);
  assert.equal(progressPercent(1.5), 100);
});
