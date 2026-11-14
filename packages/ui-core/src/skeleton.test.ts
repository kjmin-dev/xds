import assert from "node:assert/strict";
import { test } from "node:test";
import { skeletonSize } from "./skeleton.ts";

test("skeleton lengths are in pixels or as given", () => {
  assert.deepEqual(skeletonSize({}), {});
  assert.deepEqual(skeletonSize({ width: "60%" }), { width: "60%" });
  assert.deepEqual(skeletonSize({ shape: "rect", width: 96, height: 64 }), {
    width: "96px",
    height: "64px",
  });
});

test("a skeleton circle is as wide as it is tall", () => {
  assert.deepEqual(skeletonSize({ shape: "circle", width: 40 }), { width: "40px", height: "40px" });
  assert.deepEqual(skeletonSize({ shape: "circle", height: "2rem" }), {
    width: "2rem",
    height: "2rem",
  });
});
