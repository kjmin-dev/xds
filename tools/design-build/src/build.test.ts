import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { checkContrast, contrastRatio } from "./contrast.ts";
import { emitCss, emitKotlin, emitRust, emitTailwind, emitTypeScript } from "./emit.ts";
import { loadModel, type Model, TokenError } from "./model.ts";
import { listThemes } from "./themes.ts";

const root = join(import.meta.dirname, "../../..");
const tokensDir = join(root, "design/tokens");

const srgb = (components: number[], extra: object = {}) => ({
  $type: "color",
  $value: { colorSpace: "srgb", components, ...extra },
});

/**
 * Writes a minimal token set, with `base` as base.json, and loads it. `extra` adds more files,
 * such as the palette or the size files.
 */
async function loadWith(
  base: object,
  dark: object = { color: { ink: srgb([1, 1, 1]) } },
  extra: Record<string, object> = {},
) {
  const dir = await mkdtemp(join(tmpdir(), "acme-tokens-"));
  for (const [name, content] of Object.entries(extra)) {
    await writeFile(join(dir, name), JSON.stringify(content));
  }
  await writeFile(join(dir, "base.json"), JSON.stringify(base));
  await writeFile(
    join(dir, "color.light.json"),
    JSON.stringify({ color: { ink: srgb([0, 0, 0]) } }),
  );
  await writeFile(join(dir, "color.dark.json"), JSON.stringify(dark));
  return loadModel(dir);
}

test("the committed tokens load and pass every contrast check", async () => {
  const model = await loadModel(tokensDir);
  assert.ok(model.colors.length > 0);
  assert.deepEqual(checkContrast(model), []);
});

test("every theme passes every contrast check", async () => {
  const themes = await listThemes(root);
  assert.ok(themes.length > 1);
  for (const theme of themes) {
    const model = await loadModel(tokensDir, join(root, "design/themes", `${theme.name}.json`));
    assert.deepEqual(checkContrast(model), [], theme.name);
  }
});

test("the committed palette is one of the themes", async () => {
  const palette = JSON.parse(await readFile(join(tokensDir, "palette.json"), "utf8")).palette;
  const values = (ramp: Record<string, { $value?: { hex: string } }>) =>
    Object.values(ramp).flatMap((token) => (token.$value ? [token.$value.hex] : []));
  const themes = await listThemes(root);
  assert.ok(
    themes.some(
      (theme) =>
        JSON.stringify(values(theme.palette.accent as never)) ===
          JSON.stringify(values(palette.accent)) &&
        JSON.stringify(values(theme.palette.neutral as never)) ===
          JSON.stringify(values(palette.neutral)),
    ),
  );
});

test("an alias to a token that does not exist is rejected", async () => {
  const base = { color: { text: { $type: "color", $value: "{palette.ink.900}" } } };
  await assert.rejects(
    loadWith(base),
    /color\.text: refers to \{palette\.ink\.900\}, which does not exist/,
  );
});

test("an alias that leads back to itself is rejected", async () => {
  const base = {
    color: {
      $type: "color",
      a: { $value: "{color.b}" },
      b: { $value: "{color.a}" },
    },
  };
  await assert.rejects(loadWith(base), /refers to itself/);
});

test("a low-contrast pairing is reported with its mode", async () => {
  const model = await loadModel(tokensDir);
  const colors = model.colors.map((token) =>
    token.path.join(".") === "text.secondary"
      ? { ...token, light: { r: 240, g: 240, b: 240, a: 1 } }
      : token,
  );
  const failures = checkContrast({ ...model, colors });
  // Every pairing that draws secondary text fails, and only in the mode that was changed.
  assert.ok(failures.length > 0 && failures.every((failure) => failure.includes("(light)")));
  assert.match(
    failures[0] ?? "",
    /^text\.secondary on background\.base \(light\): 1\.\d\d:1, needs 4\.5:1$/,
  );
});

test("contrast ratio matches the WCAG reference values", () => {
  const black = { r: 0, g: 0, b: 0, a: 1 };
  const white = { r: 255, g: 255, b: 255, a: 1 };
  assert.equal(contrastRatio(black, white), 21);
  assert.equal(contrastRatio(white, white), 1);
});

test("a color outside sRGB is rejected", async () => {
  const base = {
    color: {
      wide: { $type: "color", $value: { colorSpace: "display-p3", components: [1, 0, 0] } },
    },
  };
  await assert.rejects(loadWith(base), (error: unknown) => {
    assert.ok(error instanceof TokenError);
    assert.match(error.message, /^color\.wide: color space "display-p3" is not supported/);
    return true;
  });
});

test("a hex that disagrees with the components is rejected", async () => {
  const base = { color: { off: srgb([1, 0, 0], { hex: "#00ff00" }) } };
  await assert.rejects(
    loadWith(base),
    /hex #00ff00 does not match the components, which give #ff0000/,
  );
});

test("an inset shadow is rejected", async () => {
  const px = (value: number) => ({ value, unit: "px" });
  const shadow = {
    $type: "shadow",
    $value: {
      color: srgb([0, 0, 0]).$value,
      offsetX: px(0),
      offsetY: px(1),
      blur: px(2),
      spread: px(0),
      inset: true,
    },
  };
  await assert.rejects(
    loadWith({ shadow: { pressed: shadow } }),
    /inset shadows are not supported/,
  );
});

test("a color missing from one mode is rejected", async () => {
  await assert.rejects(
    loadWith({}, { color: {} }),
    /color\.ink: is defined for light mode but not for dark mode/,
  );
});

test("palette colors resolve through aliases but are not emitted", async () => {
  const palette = { palette: { ink: { 900: srgb([0, 0, 0]) } } };
  const base = { color: { text: { $type: "color", $value: "{palette.ink.900}" } } };
  const model = await loadWith(base, undefined, { "palette.json": palette });
  assert.deepEqual(
    model.colors.map((token) => token.path.join(".")),
    ["text", "ink"],
  );
  assert.deepEqual(model.colors[0]?.light, { r: 0, g: 0, b: 0, a: 1 });
  assert.doesNotMatch(emitCss(model) + emitTypeScript(model) + emitRust(model), /palette/i);
});

test("the committed palette never reaches the generated files", async () => {
  const model = await loadModel(tokensDir);
  assert.equal(
    model.colors.some((token) => token.path[0] === "palette"),
    false,
  );
});

const px = (value: number) => ({ $type: "dimension", $value: { value, unit: "px" } });

test("a size must exist for both input modes", async () => {
  await assert.rejects(
    loadWith({}, undefined, {
      "size.pointer.json": { size: { control: px(36) } },
      "size.touch.json": { size: {} },
    }),
    /size\.control: is defined for pointer mode but not for touch mode/,
  );
});

test("a typography token resolves its parts", async () => {
  const base = {
    font: { size: { md: px(16) }, weight: { bold: { $type: "fontWeight", $value: 700 } } },
    typography: {
      title: {
        $type: "typography",
        $value: {
          fontFamily: ["Pretendard", "sans-serif"],
          fontSize: "{font.size.md}",
          fontWeight: "{font.weight.bold}",
          lineHeight: 1.25,
          letterSpacing: { value: -0.2, unit: "px" },
        },
      },
    },
  };
  const model = await loadWith(base);
  const title = model.values.find((token) => token.path.join(".") === "typography.title");
  assert.deepEqual(title?.value, {
    kind: "typography",
    typography: {
      families: ["Pretendard", "sans-serif"],
      sizePx: 16,
      weight: 700,
      lineHeight: 1.25,
      letterSpacingPx: -0.2,
    },
  });
});

const sample: Model = {
  colors: [
    {
      path: ["text", "on-accent"],
      description: "Text on accent.",
      light: { r: 255, g: 255, b: 255, a: 1 },
      dark: { r: 16, g: 16, b: 20, a: 0.5 },
    },
    {
      path: ["overlay", "surface"],
      light: { r: 16, g: 16, b: 20, a: 0.72 },
      dark: { r: 16, g: 16, b: 20, a: 0.72 },
    },
  ],
  values: [
    { path: ["radius", "md"], value: { kind: "dimension", px: 10 } },
    { path: ["font", "line-height", "tight"], value: { kind: "number", value: 1.25 } },
    { path: ["motion", "duration", "fast"], value: { kind: "duration", ms: 120 } },
    { path: ["font", "size", "md"], value: { kind: "dimension", px: 16 } },
    {
      path: ["typography", "body"],
      value: {
        kind: "typography",
        typography: {
          families: ["Pretendard"],
          sizePx: 15,
          weight: 400,
          lineHeight: 1.5,
          letterSpacingPx: 0,
        },
      },
    },
  ],
  sizes: [{ path: ["control", "md"], pointer: 36, touch: 48 }],
};

test("CSS follows the color scheme only where the modes differ", () => {
  const css = emitCss(sample);
  assert.match(css, /--acme-color-text-on-accent: light-dark\(#ffffff, rgb\(16 16 20 \/ 0\.5\)\);/);
  assert.match(css, /--acme-color-overlay-surface: rgb\(16 16 20 \/ 0\.72\);/);
  assert.match(css, /--acme-radius-md: 10px;/);
});

test("CSS switches sizes on the input device and spells out text styles", () => {
  const css = emitCss(sample);
  assert.match(css, /:root \{[^}]*--acme-size-control-md: 36px;/);
  assert.match(
    css,
    /@media \(pointer: coarse\) \{\n {2}:root \{\n {4}--acme-size-control-md: 48px;/,
  );
  assert.match(css, /--acme-typography-body-size: 15px;\n {2}--acme-typography-body-weight: 400;/);
  assert.match(css, /--acme-typography-body-line-height: 1\.5;/);
});

test("the Tailwind theme is namespaced and skips groups without a utility", () => {
  const theme = emitTailwind(sample);
  assert.match(theme, /--color-acme-overlay-surface: var\(--acme-color-overlay-surface\);/);
  assert.match(theme, /--radius-acme-md: var\(--acme-radius-md\);/);
  assert.match(theme, /--leading-acme-tight: var\(--acme-font-line-height-tight\);/);
  assert.doesNotMatch(theme, /duration/);
  // A text role is one utility; a raw font size is none.
  assert.match(theme, /--text-acme-body: var\(--acme-typography-body-size\);/);
  assert.match(theme, /--text-acme-body--line-height: var\(--acme-typography-body-line-height\);/);
  assert.doesNotMatch(theme, /--text-acme-md/);
  assert.match(theme, /--spacing-acme-control-md: var\(--acme-size-control-md\);/);
});

test("TypeScript uses camelCase keys and plain numbers", () => {
  const source = emitTypeScript(sample);
  assert.match(source, /"textOnAccent": "rgba\(16, 16, 20, 0\.5\)"/);
  assert.match(source, /export const font = \{\n {2}"lineHeight": \{\n {4}"tight": 1\.25/);
  assert.match(source, /"fast": 120/);
  // React Native wants the line height in pixels: 15 * 1.5, rounded.
  assert.match(source, /"body": \{\n {4}"fontSize": 15,\n {4}"lineHeight": 23,/);
  assert.match(source, /export const size = \{\n {2}"pointer": \{\n {4}"controlMd": 36/);
});

test("Kotlin gets Compose types, one object per group", () => {
  const source = emitKotlin(sample, "acme.tokens");
  assert.match(source, /^\/\/ Generated.*\n\npackage acme\.tokens\n/);
  assert.match(source, /\/\*\* Text on accent\. \*\/\n {4}val textOnAccent: Color/);
  assert.match(
    source,
    /object DarkColors : Colors \{\n {4}override val textOnAccent = Color\(0x80101014\)/,
  );
  assert.match(source, /"text-on-accent" to textOnAccent,/);
  assert.match(source, /object Radius \{\n {4}val md: Dp = 10\.dp/);
  // Type sizes are sp, so they follow the system text size.
  assert.match(source, /val sizeMd: TextUnit = 16\.sp/);
  assert.match(source, /val durationFast: Int = 120/);
  assert.match(source, /val body: TextStyle = TextStyle\(fontSize = 15\.sp, lineHeight = 23\.sp, /);
  assert.match(source, /val TouchSizes = Sizes\(\n {4}controlMd = 48\.dp,/);
});

test("Rust gets one struct field per color and typed constants", () => {
  const source = emitRust(sample);
  assert.match(source, /\/\/\/ Text on accent\.\n {4}pub text_on_accent: Color,/);
  assert.match(source, /text_on_accent: Color::rgba\(16, 16, 20, 0\.5\),/);
  assert.match(source, /pub const RADIUS_MD: f32 = 10\.0;/);
  assert.match(source, /pub const fn entries\(&self\) -> \[\(&'static str, Color\); 2\]/);
  assert.match(source, /\("text-on-accent", self\.text_on_accent\),/);
  assert.match(source, /pub const MOTION_DURATION_FAST: Duration = Duration::from_millis\(120\);/);
  assert.match(source, /pub const TYPOGRAPHY_BODY: Typography = Typography \{ size: 15\.0, /);
  assert.match(source, /pub const TOUCH: Sizes = Sizes \{\n {4}control_md: 48\.0,/);
});
