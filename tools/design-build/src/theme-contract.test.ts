import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { isRecord, loadModel } from "./model.ts";
import { checkTheme, readContract, themeContract } from "./theme-contract.ts";

const root = join(import.meta.dirname, "../../..");
const tokens = join(root, "design/tokens");
const contract = await readContract(root);
const { version } = contract;
const partial = { version, preset: "ocean" };

test("the generated contract describes every public token, including both kinds of glass tokens", async () => {
  assert.deepEqual(themeContract(await loadModel(tokens), version), contract);
  assert.equal(
    await readFile(join(root, "design/theme-contract.json"), "utf8"),
    `${JSON.stringify(contract, null, 2)}\n`,
  );
  assert.equal(contract.colors["color.glass.tint"], "color");
  assert.equal(contract.values["glass.saturation"], "number");
  assert.equal(contract.sizes["size.control.md"], "dimension");
});

test("a full theme supplies every section and resolves the original DTCG aliases", async () => {
  async function raw(file: string) {
    const entries: Record<string, unknown> = {};
    function visit(value: unknown, path: string[]) {
      if (!isRecord(value)) return;
      if (Object.hasOwn(value, "$value")) {
        entries[path.join(".")] = value.$value;
        return;
      }
      for (const [key, child] of Object.entries(value)) {
        if (!key.startsWith("$")) visit(child, [...path, key]);
      }
    }
    visit(JSON.parse(await readFile(join(tokens, file), "utf8")), []);
    return entries;
  }
  const base = await raw("base.json");
  const values = Object.fromEntries(
    Object.entries(base).filter(([path]) => !path.startsWith("color.")),
  );
  const baseColors = Object.fromEntries(
    Object.entries(base).filter(([path]) => path.startsWith("color.")),
  );
  const full = {
    version,
    values,
    light: { ...baseColors, ...(await raw("color.light.json")) },
    dark: { ...baseColors, ...(await raw("color.dark.json")) },
    pointer: await raw("size.pointer.json"),
    touch: await raw("size.touch.json"),
  };
  assert.equal((await checkTheme(root, full, contract)).ok, true);
  delete full.touch["size.control.md"];
  await assert.rejects(checkTheme(root, full, contract), /missing touch.size.control.md/);
});

test("a partial theme validates foundation and size values and follows aliases before checking contrast", async () => {
  const result = await checkTheme(
    root,
    {
      ...partial,
      values: { "glass.blur": { value: 12, unit: "px" } },
      pointer: { "size.control.md": { value: 36, unit: "px" } },
      touch: { "size.control.md": { value: 48, unit: "px" } },
      dark: { "color.text.primary": "{color.background.base}" },
    },
    contract,
  );
  assert.equal(result.ok, false);
  assert.ok(result.failures.every((failure) => failure.includes("(dark)")));
  assert.ok(
    result.failures.some((failure) => failure.startsWith("field.text on field.background")),
  );
});

test("custom glass uses the same stacked backgrounds and thresholds as the token build", async () => {
  const result = await checkTheme(
    root,
    {
      ...partial,
      dark: { "color.glass.highlight": { colorSpace: "srgb", components: [1, 1, 1], alpha: 0.7 } },
    },
    contract,
  );
  assert.ok(
    result.failures.some((line) =>
      line.includes(
        "sheet.handle on glass.highlight over glass.tint-strong over scrim over rgb(255 255 255) (dark)",
      ),
    ),
  );
});

test("malformed themes identify the bad section, token, type, alias or version", async () => {
  const cases: [object, RegExp][] = [
    [{ version: "other" }, /contract version/],
    [{ preset: "../indigo" }, /unknown preset/],
    [{ lights: {} }, /unknown key "lights"/],
    [{ dark: null }, /dark must be an object/],
    [{ light: { "color.typo": 1 } }, /unknown key "color.typo"/],
    [{ values: { "color.text.primary": 1 } }, /unknown key/],
    [{ touch: { "size.control.md": { value: 2, unit: "em" } } }, /size.control.md.*px/],
    [{ values: { "font.weight.medium": "{glass.saturation}" } }, /fontWeight.*number/],
    [{ values: { "glass.blur": { value: Infinity, unit: "px" } } }, /glass.blur/],
    [{ dark: { "color.text.primary": "{color.text.primary}" } }, /refers to itself/],
  ];
  for (const [fields, message] of cases) {
    await assert.rejects(checkTheme(root, { ...partial, ...fields }, contract), message);
  }
});

test("ramp files must provide exactly the preset's steps", async () => {
  const ramp = JSON.parse(await readFile(join(root, "design/themes/ocean.json"), "utf8"));
  assert.equal((await checkTheme(root, ramp, contract)).ok, true);
  delete ramp.palette.accent["500"];
  await assert.rejects(checkTheme(root, ramp, contract), /palette.accent.500/);
});
