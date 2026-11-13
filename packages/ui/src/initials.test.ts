import assert from "node:assert/strict";
import { test } from "node:test";
import { initials } from "./initials.ts";

test("initials take the first letter of the first two words", () => {
  assert.equal(initials("Ada Lovelace"), "AL");
  assert.equal(initials("  grace   brewster hopper "), "GB");
  assert.equal(initials("Plato"), "P");
  assert.equal(initials(""), "");
});

test("initials keep whole characters", () => {
  assert.equal(initials("김 민준"), "김민");
  assert.equal(initials("𝒜da"), "𝒜");
  assert.equal(initials("Ada Lovelace", 1), "A");
});
