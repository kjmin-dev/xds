import { expect, test } from "vitest";
import { initials } from "./initials.ts";

test("initials take the first letter of the first two words", () => {
  expect(initials("Ada Lovelace")).toBe("AL");
  expect(initials("  grace   brewster hopper ")).toBe("GB");
  expect(initials("Plato")).toBe("P");
  expect(initials("")).toBe("");
});

test("initials keep whole characters", () => {
  expect(initials("김 민준")).toBe("김민");
  expect(initials("𝒜da")).toBe("𝒜");
  expect(initials("Ada Lovelace", 1)).toBe("A");
});
