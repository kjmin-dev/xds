import assert from "node:assert/strict";
import { test } from "node:test";
import { sliderArrowValue, sliderPageSize } from "./slider.ts";

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

test("Up and Down move a step, or a page with Shift, within the range", () => {
  const options = { value: 60, min: 0, max: 100, step: 1, pageSize: 10 };
  assert.equal(sliderArrowValue({ key: "ArrowUp", shiftKey: false }, options), 61);
  assert.equal(sliderArrowValue({ key: "ArrowDown", shiftKey: true }, options), 50);
  assert.equal(
    sliderArrowValue({ key: "ArrowUp", shiftKey: true }, { ...options, value: 95 }),
    100,
  );
  assert.equal(sliderArrowValue({ key: "ArrowRight", shiftKey: false }, options), undefined);
});
