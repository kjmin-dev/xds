import assert from "node:assert/strict";
import { test } from "node:test";
import { type GlassMilestones, measurableGlassTier } from "./glassPreview.ts";

test("sheet measurements wait for the actual material, native modal and completed entrance in any order", () => {
  const bar: GlassMilestones = { bar: { tier: "native", atMs: 15 } };
  assert.equal(measurableGlassTier("bar", bar), "native");
  assert.equal(measurableGlassTier("sheet", bar), null);
  const material: GlassMilestones = { ...bar, sheet: { tier: "blur", atMs: 31 } };
  assert.equal(measurableGlassTier("sheet", { ...material, enteredMs: 280 }), null);
  assert.equal(measurableGlassTier("sheet", { ...material, shownMs: 80 }), null);
  assert.equal(measurableGlassTier("sheet", { ...bar, shownMs: 80, enteredMs: 280 }), null);
  assert.equal(measurableGlassTier("sheet", { ...material, shownMs: 80, enteredMs: 280 }), "blur");
});
