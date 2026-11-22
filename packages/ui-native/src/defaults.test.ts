import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { DEFAULT_OPTIONS, mergeDefaults } from "./defaults.ts";

type Contract = {
  components: {
    name: string;
    options: Record<string, unknown>;
    clients: Record<string, unknown>;
  }[];
};

// An option whose values the contract lists one by one: what the web libraries' and Compose's
// `Defaults` cover too.
const ENUMERATED = ["variant", "size", "tone", "shape", "ratio", "layout"];

test("every enumerated option of a React Native component in the contract can be given a default", () => {
  const contract = JSON.parse(
    readFileSync(join(import.meta.dirname, "../../../design/components.json"), "utf8"),
  ) as Contract;
  const expected: Record<string, string[]> = {};
  for (const component of contract.components) {
    if (!("mobile-react-native" in component.clients)) continue;
    const options = ENUMERATED.filter((option) => Array.isArray(component.options[option]));
    if (options.length > 0) expected[component.name] = options;
  }
  assert.deepEqual(
    Object.fromEntries(Object.entries(DEFAULT_OPTIONS).map(([name, list]) => [name, [...list]])),
    expected,
  );
});

test("an inner provider replaces only the options it names", () => {
  const outer = { Button: { variant: "primary", size: "lg" }, Badge: { tone: "accent" } } as const;
  assert.deepEqual(mergeDefaults(outer, { Button: { size: "sm" } }), {
    Button: { variant: "primary", size: "sm" },
    Badge: { tone: "accent" },
  });
  assert.equal(mergeDefaults(outer, undefined), outer);
});
