import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { checkContrast } from "./contrast.ts";
import {
  INPUT_MODES,
  isRecord,
  loadModel,
  MODES,
  type Model,
  type ThemeOverrides,
  type TokenOverrides,
  TokenError,
} from "./model.ts";
import { listThemes } from "./themes.ts";

export function themeContract(model: Model, version: string) {
  return {
    version,
    colors: Object.fromEntries(
      model.colors.map(({ path }) => [`color.${path.join(".")}`, "color"]),
    ),
    sizes: Object.fromEntries(
      model.sizes.map(({ path }) => [`size.${path.join(".")}`, "dimension"]),
    ),
    values: Object.fromEntries(model.values.map(({ path, value }) => [path.join("."), value.kind])),
  };
}

export type Contract = ReturnType<typeof themeContract>;
const SECTIONS = ["values", ...MODES, ...INPUT_MODES] as const;

function object(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) throw new TokenError(`${label} must be an object`);
  return value;
}

function knownKeys(values: object, allowed: string[], label: string) {
  for (const key of Object.keys(values)) {
    if (!allowed.includes(key)) throw new TokenError(`${label}: unknown key "${key}"`);
  }
}

function overrides(file: Record<string, unknown>, contract: Contract) {
  knownKeys(file, ["version", "preset", ...SECTIONS], "theme");
  if (file.version !== contract.version) {
    throw new TokenError(`theme.version must match the contract version "${contract.version}"`);
  }
  const sections: ThemeOverrides = {};
  for (const section of SECTIONS) {
    const paths =
      section === "values"
        ? contract.values
        : section === "pointer" || section === "touch"
          ? contract.sizes
          : contract.colors;
    const values = Object.hasOwn(file, section) ? object(file[section], section) : {};
    const changes: TokenOverrides = {};
    for (const [key, value] of Object.entries(values)) {
      const type = Object.hasOwn(paths, key) ? paths[key] : undefined;
      if (type === undefined) throw new TokenError(`${section}: unknown key "${key}"`);
      changes[key] = { $type: type, $value: value };
    }
    if (file.preset === undefined) {
      for (const path of Object.keys(paths)) {
        if (!Object.hasOwn(values, path))
          throw new TokenError(`full theme is missing ${section}.${path}`);
      }
    }
    sections[section] = changes;
  }
  return sections;
}

/** A generated palette file uses the same accent and neutral steps as a built-in preset. */
function rampOverrides(
  file: Record<string, unknown>,
  reference: { accent: object; neutral: object },
) {
  knownKeys(file, ["$description", "palette"], "theme");
  const palette = object(file.palette, "palette");
  knownKeys(palette, ["accent", "neutral"], "palette");
  const values: TokenOverrides = {};
  for (const ramp of ["accent", "neutral"] as const) {
    const steps = object(palette[ramp], `palette.${ramp}`);
    knownKeys(steps, Object.keys(reference[ramp]), `palette.${ramp}`);
    for (const key of Object.keys(reference[ramp])) {
      const path = `palette.${ramp}.${key}`;
      const token = object(steps[key], path);
      knownKeys(token, ["$value", "$type", "$description"], path);
      if (token.$type !== undefined && token.$type !== "color")
        throw new TokenError(`${path} must be a color`);
      if (!Object.hasOwn(token, "$value")) throw new TokenError(`${path} needs a $value`);
      values[path] = { $type: "color", $value: token.$value };
    }
  }
  return values;
}

export async function readContract(root: string, cliVersion?: string): Promise<Contract> {
  const path = join(root, "design/theme-contract.json");
  const model = await loadModel(join(root, "design/tokens"));
  if (!existsSync(path) && cliVersion) {
    const config = object(
      JSON.parse(await readFile(join(root, "design/build.json"), "utf8")),
      "design/build.json",
    );
    if (!config.contractVersion && !existsSync(join(root, "template.json")))
      return themeContract(model, cliVersion);
    throw new TokenError(`${path} is missing; run mise run tokens`);
  }
  const data = object(JSON.parse(await readFile(path, "utf8")), path);
  if (typeof data.version !== "string" || !data.version)
    throw new TokenError(`${path} needs a version`);
  if (cliVersion && data.version !== cliVersion) {
    throw new TokenError(
      `this project's contract requires xds ${data.version}; the checker is ${cliVersion}`,
    );
  }
  const expected = themeContract(model, data.version);
  if (!isDeepStrictEqual(data, expected))
    throw new TokenError(`${path} differs from the tokens; run mise run tokens`);
  return expected;
}

export async function checkTheme(root: string, input: unknown, contract: Contract) {
  const file = object(input, "theme");
  const presets = await listThemes(root);
  const tokens = join(root, "design/tokens");
  let model: Model;
  if (Object.hasOwn(file, "palette")) {
    const reference = presets.find(({ name }) => name === "indigo");
    if (!reference) throw new TokenError("the indigo reference preset is missing");
    model = await loadModel(tokens, undefined, { values: rampOverrides(file, reference.palette) });
  } else {
    const preset = file.preset === undefined ? "indigo" : file.preset;
    if (!presets.some(({ name }) => name === preset) || typeof preset !== "string") {
      throw new TokenError(`unknown preset; choose ${presets.map(({ name }) => name).join(", ")}`);
    }
    const theme = join(root, "design/themes", `${preset}.json`);
    model = await loadModel(tokens, theme, overrides(file, contract));
  }
  const failures = checkContrast(model);
  return { version: contract.version, ok: failures.length === 0, failures };
}
