// Loads the DTCG token files and turns them into a small, validated model that the emitters share.
//
// Everything platform-specific happens in emit.ts, so a value that some platform cannot express
// is rejected here, once, for all of them. This file has no dependencies, so the generator runs
// with Node alone: `node tools/design-build/src/build.ts`.

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export type Mode = "light" | "dark";
export const MODES: readonly Mode[] = ["light", "dark"];

/** sRGB, channels 0-255, straight alpha 0-1. */
export type Rgba = { r: number; g: number; b: number; a: number };

export type Shadow = {
  color: Rgba;
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
};

/** A text style. `lineHeight` is a multiple of the size, as in the token files. */
export type Typography = {
  families: string[];
  sizePx: number;
  weight: number;
  lineHeight: number;
  letterSpacingPx: number;
};

export type Value =
  | { kind: "dimension"; px: number }
  | { kind: "duration"; ms: number }
  | { kind: "number"; value: number }
  | { kind: "fontWeight"; value: number }
  | { kind: "fontFamily"; families: string[] }
  | { kind: "cubicBezier"; points: [number, number, number, number] }
  | { kind: "shadow"; shadow: Shadow }
  | { kind: "typography"; typography: Typography };

/** How the person points at the screen. Sizes differ between the two; nothing else does. */
export type InputMode = "pointer" | "touch";
export const INPUT_MODES: readonly InputMode[] = ["pointer", "touch"];

export type ColorToken = { path: string[]; description?: string; light: Rgba; dark: Rgba };
export type ValueToken = { path: string[]; description?: string; value: Value };
/** A length that depends on the input mode, in pixels. */
export type SizeToken = { path: string[]; description?: string; pointer: number; touch: number };

export type Model = {
  /** Paths are relative to the top-level `color` group. */
  colors: ColorToken[];
  values: ValueToken[];
  /** Paths are relative to the top-level `size` group. */
  sizes: SizeToken[];
};

type RawToken = { path: string[]; $type?: string; $value: unknown; $description?: string };

export class TokenError extends Error {}

function fail(path: string[], message: string): never {
  throw new TokenError(`${path.join(".")}: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toHex(channels: number[]): string {
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function parseColor(path: string[], value: unknown): Rgba {
  if (!isRecord(value)) fail(path, "a color must be a DTCG color object");
  // GPUI and React Native only take sRGB, so wide-gamut tokens would silently differ per platform.
  if (value.colorSpace !== "srgb") {
    fail(path, `color space "${String(value.colorSpace)}" is not supported, use "srgb"`);
  }
  const components = value.components;
  if (!Array.isArray(components) || components.length !== 3) {
    fail(path, "an sRGB color needs exactly three components");
  }
  const channels = components.map((component) => {
    if (typeof component !== "number" || component < 0 || component > 1) {
      fail(path, "sRGB components must be numbers between 0 and 1");
    }
    return Math.round(component * 255);
  });
  const alpha = value.alpha ?? 1;
  if (typeof alpha !== "number" || alpha < 0 || alpha > 1) {
    fail(path, "alpha must be a number between 0 and 1");
  }
  if (typeof value.hex === "string" && value.hex.toLowerCase() !== toHex(channels)) {
    fail(path, `hex ${value.hex} does not match the components, which give ${toHex(channels)}`);
  }
  const [r, g, b] = channels as [number, number, number];
  return { r, g, b, a: alpha };
}

function parseUnit(path: string[], value: unknown, unit: string, what: string): number {
  if (!isRecord(value) || typeof value.value !== "number" || value.unit !== unit) {
    fail(path, `${what} must be written as { "value": <number>, "unit": "${unit}" }`);
  }
  return value.value;
}

function parseValue(token: RawToken): Value {
  const { path, $value: value } = token;
  switch (token.$type) {
    case "dimension":
      return { kind: "dimension", px: parseUnit(path, value, "px", "a dimension") };
    case "duration":
      return { kind: "duration", ms: parseUnit(path, value, "ms", "a duration") };
    case "number":
    case "fontWeight":
      if (typeof value !== "number") fail(path, `a ${token.$type} must be a number`);
      return { kind: token.$type, value };
    case "fontFamily": {
      const families = typeof value === "string" ? [value] : value;
      if (!Array.isArray(families) || !families.every((family) => typeof family === "string")) {
        fail(path, "a fontFamily must be a string or a list of strings");
      }
      return { kind: "fontFamily", families };
    }
    case "cubicBezier":
      if (
        !Array.isArray(value) ||
        value.length !== 4 ||
        !value.every((point) => typeof point === "number")
      ) {
        fail(path, "a cubicBezier must be four numbers");
      }
      return { kind: "cubicBezier", points: value as [number, number, number, number] };
    case "shadow": {
      if (!isRecord(value)) fail(path, "a shadow must be a single shadow object");
      // GPUI draws outer shadows only.
      if (value.inset === true) fail(path, "inset shadows are not supported on every platform");
      return {
        kind: "shadow",
        shadow: {
          color: parseColor(path, value.color),
          offsetX: parseUnit(path, value.offsetX, "px", "offsetX"),
          offsetY: parseUnit(path, value.offsetY, "px", "offsetY"),
          blur: parseUnit(path, value.blur, "px", "blur"),
          spread: parseUnit(path, value.spread, "px", "spread"),
        },
      };
    }
    case "typography": {
      if (!isRecord(value)) fail(path, "a typography token must be an object");
      const part = ($type: string, key: string) =>
        parseValue({ path: [...path, key], $type, $value: value[key] });
      const family = part("fontFamily", "fontFamily");
      const size = part("dimension", "fontSize");
      const weight = part("fontWeight", "fontWeight");
      const lineHeight = part("number", "lineHeight");
      const spacing = part("dimension", "letterSpacing");
      if (
        family.kind !== "fontFamily" ||
        size.kind !== "dimension" ||
        weight.kind !== "fontWeight" ||
        lineHeight.kind !== "number" ||
        spacing.kind !== "dimension"
      ) {
        return fail(path, "a typography token is malformed");
      }
      return {
        kind: "typography",
        typography: {
          families: family.families,
          sizePx: size.px,
          weight: weight.value,
          lineHeight: lineHeight.value,
          letterSpacingPx: spacing.px,
        },
      };
    }
    default:
      return fail(path, `token type "${String(token.$type)}" is not supported`);
  }
}

type Group = { [key: string]: unknown };

/** Later files add to earlier ones, and replace a token that both define. */
function merge(into: Group, from: Group): void {
  for (const [key, value] of Object.entries(from)) {
    const current = into[key];
    if (isRecord(value) && isRecord(current) && !("$value" in value) && !("$value" in current)) {
      merge(current, value);
    } else {
      into[key] = structuredClone(value);
    }
  }
}

/** A group's `$type` applies to every token below it that does not set its own. */
function flatten(group: Group, path: string[], type: string | undefined, out: RawToken[]): void {
  const inherited = typeof group.$type === "string" ? group.$type : type;
  if ("$value" in group) {
    out.push({
      path,
      $value: group.$value,
      ...(inherited ? { $type: inherited } : {}),
      ...(typeof group.$description === "string" ? { $description: group.$description } : {}),
    });
    return;
  }
  for (const [key, value] of Object.entries(group)) {
    if (!key.startsWith("$") && isRecord(value)) flatten(value, [...path, key], inherited, out);
  }
}

const ALIAS = /^\{([^{}]+)\}$/;

/**
 * Reads DTCG files and returns their tokens with every alias replaced by the value it points to.
 * An alias is a whole value, such as "{palette.accent.600}", or a part of a composite value,
 * such as the `fontSize` of a typography token.
 */
async function loadFiles(tokensDir: string, files: string[]): Promise<RawToken[]> {
  const root: Group = {};
  for (const file of files) {
    const path = resolve(tokensDir, file);
    if (!existsSync(path)) continue;
    let content: unknown;
    try {
      content = JSON.parse(await readFile(path, "utf8"));
    } catch (error) {
      throw new TokenError(`${file}: ${(error as Error).message}`);
    }
    if (!isRecord(content)) throw new TokenError(`${file}: a token file must hold a JSON object`);
    merge(root, content);
  }
  const tokens: RawToken[] = [];
  flatten(root, [], undefined, tokens);
  const byPath = new Map(tokens.map((token) => [token.path.join("."), token]));

  const resolved = new Map<string, unknown>();
  const resolveToken = (token: RawToken, trail: string[]): unknown => {
    const key = token.path.join(".");
    if (resolved.has(key)) return resolved.get(key);
    if (trail.includes(key)) fail(token.path, `refers to itself through ${trail.join(" -> ")}`);
    const value = resolveValue(token, token.$value, [...trail, key]);
    resolved.set(key, value);
    return value;
  };
  const resolveValue = (owner: RawToken, value: unknown, trail: string[]): unknown => {
    if (typeof value === "string") {
      const target = ALIAS.exec(value)?.[1];
      if (target === undefined) return value;
      const token = byPath.get(target);
      if (!token) fail(owner.path, `refers to ${value}, which does not exist`);
      // A token that is nothing but an alias takes the type of what it points to.
      if (value === owner.$value && owner.$type === undefined && token.$type) {
        owner.$type = token.$type;
      }
      return resolveToken(token, trail);
    }
    if (Array.isArray(value)) return value.map((item) => resolveValue(owner, item, trail));
    if (isRecord(value)) {
      return Object.fromEntries(
        Object.entries(value).map(([key, part]) => [key, resolveValue(owner, part, trail)]),
      );
    }
    return value;
  };
  for (const token of tokens) token.$value = resolveToken(token, []);
  return tokens;
}

/** Pairs up a token set that exists once per mode, and insists that both modes define it. */
function pairUp<M extends string>(
  [first, second]: readonly [M, M],
  sets: readonly [RawToken[], RawToken[]],
  each: (token: RawToken, counterpart: RawToken) => void,
): void {
  const others = new Map(sets[1].map((token) => [token.path.join("."), token]));
  for (const token of sets[0]) {
    const key = token.path.join(".");
    const counterpart = others.get(key);
    if (!counterpart) fail(token.path, `is defined for ${first} mode but not for ${second} mode`);
    others.delete(key);
    each(token, counterpart);
  }
  for (const token of others.values()) {
    fail(token.path, `is defined for ${second} mode but not for ${first} mode`);
  }
}

/**
 * `theme` is the path of a theme file to use in place of the palette's accent and neutral ramps,
 * for checking a theme without applying it.
 */
export async function loadModel(tokensDir: string, theme?: string): Promise<Model> {
  // The palette is loaded so that the color files can refer to it, and then left out: only
  // colors with a meaning reach the platforms.
  const colorFiles = (mode: Mode) => [
    "palette.json",
    ...(theme ? [theme] : []),
    "base.json",
    `color.${mode}.json`,
  ];
  const [light, dark, pointer, touch] = await Promise.all([
    loadFiles(tokensDir, colorFiles("light")),
    loadFiles(tokensDir, colorFiles("dark")),
    loadFiles(tokensDir, ["size.pointer.json"]),
    loadFiles(tokensDir, ["size.touch.json"]),
  ]);

  const colors: ColorToken[] = [];
  const values: ValueToken[] = [];
  pairUp(["light", "dark"], [light, dark], (token, counterpart) => {
    const description = token.$description ? { description: token.$description } : {};
    if (token.path[0] === "palette") {
      // Checked even though it is not emitted: a bad ramp value would surface as a bad alias.
      parseColor(token.path, token.$value);
    } else if (token.$type === "color") {
      if (token.path[0] !== "color") fail(token.path, 'color tokens must live under "color"');
      colors.push({
        path: token.path.slice(1),
        ...description,
        light: parseColor(token.path, token.$value),
        dark: parseColor(token.path, counterpart.$value),
      });
    } else {
      values.push({ path: token.path, ...description, value: parseValue(token) });
    }
  });

  const sizes: SizeToken[] = [];
  pairUp(["pointer", "touch"], [pointer, touch], (token, counterpart) => {
    if (token.path[0] !== "size" || token.$type !== "dimension") {
      fail(token.path, 'the size files hold dimensions under "size" and nothing else');
    }
    sizes.push({
      path: token.path.slice(1),
      ...(token.$description ? { description: token.$description } : {}),
      pointer: parseUnit(token.path, token.$value, "px", "a size"),
      touch: parseUnit(token.path, counterpart.$value, "px", "a size"),
    });
  });
  return { colors, values, sizes };
}
