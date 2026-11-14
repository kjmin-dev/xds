import assert from "node:assert/strict";
import { test } from "node:test";
import { sliderPageSize } from "./slider.ts";

test("a page is a tenth of the range in whole steps", () => {
  assert.equal(sliderPageSize({ min: 0, max: 100, step: 1 }), 10);
  assert.equal(sliderPageSize({ min: 0, max: 1, step: 0.1 }), 0.1);
  assert.equal(sliderPageSize({ min: 0, max: 3, step: 0.1 }), 0.3);
  assert.equal(sliderPageSize({ min: 0, max: 1000, step: 25 }), 100);
});

test("a page is never less than one step", () => {
  assert.equal(sliderPageSize({ min: 12, max: 24, step: 2 }), 2);
  assert.equal(sliderPageSize({ min: 0, max: 10, step: 5 }), 5);
});
