import assert from "node:assert/strict";
import { test } from "node:test";
import { glassTier } from "./glassTier.ts";

test("accessibility, power and an absent backdrop take priority over the preview", () => {
  for (const forced of [undefined, "native", "blur", "solid"] as const) {
    assert.equal(glassTier(false, true, true, forced), "solid");
    assert.equal(glassTier(true, false, true, forced), "solid");
  }
});
test("a preview can exercise each supported tier", () => {
  assert.equal(glassTier(true, true, true), "native");
  assert.equal(glassTier(true, true, false, "native"), "blur");
  assert.equal(glassTier(true, true, true, "blur"), "blur");
  assert.equal(glassTier(true, true, true, "solid"), "solid");
});
