import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { DEFAULT_OPTIONS, mergeDefaults } from "./defaults.ts";
import { rootPart } from "./parts.ts";

type Contract = {
  components: {
    name: string;
    options: Record<string, unknown>;
    clients: Record<string, unknown>;
  }[];
};

// An option whose values the contract lists one by one, short of `surface`, which only the
// touch clients have.
const ENUMERATED = ["variant", "size", "tone", "shape", "ratio", "layout"];

test("every enumerated option of a web component in the contract can be given a default", () => {
  const contract = JSON.parse(
    readFileSync(join(import.meta.dirname, "../../../design/components.json"), "utf8"),
  ) as Contract;
  const expected: Record<string, string[]> = {};
  for (const component of contract.components) {
    if (!Object.keys(component.clients).some((client) => client.startsWith("web-"))) continue;
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
  assert.deepEqual(mergeDefaults(undefined, { Text: { tone: "secondary" } }), {
    Text: { tone: "secondary" },
  });
  assert.equal(mergeDefaults(outer, undefined), outer);
});

test("a root part is the component's name in kebab case", () => {
  assert.equal(rootPart("Button"), "acme-button");
  assert.equal(rootPart("IconButton"), "acme-icon-button");
  assert.equal(rootPart("DateRangePicker"), "acme-date-range-picker");
});
