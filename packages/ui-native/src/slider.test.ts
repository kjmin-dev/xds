import assert from "node:assert/strict";
import { test } from "node:test";
import { formatValue, fraction, snap, valueAt } from "./slider.ts";

const PERCENT = { min: 0, max: 100, step: 1 };

test("snap rounds to the nearest step and stays in the range", () => {
  assert.equal(snap(42.4, PERCENT), 42);
  assert.equal(snap(42.5, PERCENT), 43);
  assert.equal(snap(-5, PERCENT), 0);
  assert.equal(snap(140, PERCENT), 100);
  assert.equal(snap(7.4, { min: 1, max: 9, step: 2 }), 7);
});

test("snap counts decimal steps without rounding errors", () => {
  const tenths = { min: 0, max: 1, step: 0.1 };
  assert.equal(snap(0.1 + 0.2, tenths), 0.3);
  assert.equal(snap(0.96, tenths), 1);
  assert.equal(snap(1.12, { min: 0.5, max: 2, step: 0.25 }), 1);
  assert.equal(snap(1.13, { min: 0.5, max: 2, step: 0.25 }), 1.25);
});

test("snap stops at the last step that fits when max is not a step", () => {
  assert.equal(snap(10, { min: 0, max: 10, step: 3 }), 9);
  assert.equal(snap(9.6, { min: 0, max: 10, step: 3 }), 9);
});

test("snap gives min for a range with no room", () => {
  assert.equal(snap(5, { min: 3, max: 3, step: 1 }), 3);
  assert.equal(snap(5, { min: 0, max: 10, step: 0 }), 0);
});

test("fraction places the value in the range", () => {
  assert.equal(fraction(25, PERCENT), 0.25);
  assert.equal(fraction(15, { min: 10, max: 20, step: 1 }), 0.5);
  assert.equal(fraction(-1, PERCENT), 0);
  assert.equal(fraction(101, PERCENT), 1);
  assert.equal(fraction(3, { min: 3, max: 3, step: 1 }), 0);
});

test("valueAt keeps the thumb's center half a thumb from either end", () => {
  // 224 wide with a 24 thumb: the center travels from 12 to 212.
  assert.equal(valueAt(12, 224, 24, false, PERCENT), 0);
  assert.equal(valueAt(0, 224, 24, false, PERCENT), 0);
  assert.equal(valueAt(112, 224, 24, false, PERCENT), 50);
  assert.equal(valueAt(212, 224, 24, false, PERCENT), 100);
  assert.equal(valueAt(224, 224, 24, false, PERCENT), 100);
  assert.equal(valueAt(62, 224, 24, false, PERCENT), 25);
});

test("valueAt runs from the right in a right-to-left layout", () => {
  assert.equal(valueAt(12, 224, 24, true, PERCENT), 100);
  assert.equal(valueAt(212, 224, 24, true, PERCENT), 0);
  assert.equal(valueAt(62, 224, 24, true, PERCENT), 75);
});

test("valueAt gives min before the track has a width", () => {
  assert.equal(valueAt(10, 0, 24, false, { min: 5, max: 10, step: 1 }), 5);
});

test("formatValue shows as many decimals as the steps have", () => {
  assert.equal(formatValue(40, PERCENT), "40");
  assert.equal(formatValue(1, { min: 0.5, max: 2, step: 0.25 }), "1.00");
  assert.equal(formatValue(0.3, { min: 0, max: 1, step: 0.1 }), "0.3");
});
