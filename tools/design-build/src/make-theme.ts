// Writes a color theme: an accent ramp and a neutral ramp for design/themes.
//
//   node src/make-theme.ts <name> --hue 245 [--chroma 1] [--neutral-hue 250] [--neutral-chroma 1]
//                          [--description "..."]
//
// `--chroma` and `--neutral-chroma` scale the chroma of the reference: 1 is as vivid as the
// reference, 0 is grey.
//
// Every step gets the same relative luminance as the same step of the reference theme
// (design/themes/indigo.json). Contrast depends on luminance alone, so a new theme keeps every
// contrast ratio the reference has, and only hue and chroma change.

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";

type Rgb = [number, number, number];

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

/** WCAG relative luminance of a linear-light color. */
const luminance = ([r, g, b]: Rgb) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function oklchToLinear(l: number, c: number, hueDegrees: number): Rgb {
  const hue = (hueDegrees * Math.PI) / 180;
  const a = c * Math.cos(hue);
  const b = c * Math.sin(hue);
  const l3 = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m3 = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s3 = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  ];
}

function linearToOklch([r, g, b]: Rgb): { l: number; c: number } {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const b2 = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, c: Math.hypot(a, b2) };
}

const inGamut = (rgb: Rgb) => rgb.every((channel) => channel >= -1e-4 && channel <= 1 + 1e-4);

/** The color at this hue with the wanted luminance, and as much of the wanted chroma as sRGB has. */
function solve(targetLuminance: number, wantedChroma: number, hue: number): Rgb {
  let chroma = wantedChroma;
  for (;;) {
    let [low, high] = [0, 1];
    for (let i = 0; i < 40; i++) {
      const mid = (low + high) / 2;
      if (luminance(oklchToLinear(mid, chroma, hue)) < targetLuminance) low = mid;
      else high = mid;
    }
    const rgb = oklchToLinear((low + high) / 2, chroma, hue);
    if (inGamut(rgb) || chroma < 0.002) return rgb;
    chroma *= 0.96;
  }
}

type ColorToken = { $value: { colorSpace: "srgb"; components: Rgb; hex: string } };
type Ramp = Record<string, ColorToken>;

function token(linear: Rgb): ColorToken {
  const channels = linear.map((channel) =>
    Math.round(fromLinear(Math.min(1, Math.max(0, channel))) * 255),
  );
  return {
    $value: {
      colorSpace: "srgb",
      components: channels.map((channel) => Math.round((channel / 255) * 10000) / 10000) as Rgb,
      hex: `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`,
    },
  };
}

function ramp(reference: Ramp, hue: number, chroma: (referenceChroma: number) => number): Ramp {
  return Object.fromEntries(
    Object.entries(reference).map(([step, { $value }]) => {
      const linear = $value.components.map(toLinear) as Rgb;
      // Pure white and pure black stay as they are.
      if (linear.every((c) => c === 1) || linear.every((c) => c === 0)) {
        return [step, token(linear)];
      }
      return [step, token(solve(luminance(linear), chroma(linearToOklch(linear).c), hue))];
    }),
  );
}

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    hue: { type: "string" },
    chroma: { type: "string", default: "1" },
    "neutral-hue": { type: "string" },
    "neutral-chroma": { type: "string", default: "1" },
    description: { type: "string" },
  },
});
const name = positionals[0];
if (!name || !/^[a-z][a-z0-9-]*$/.test(name) || values.hue === undefined) {
  console.error("usage: node src/make-theme.ts <name> --hue <0-360> [--chroma <scale>]");
  console.error(
    "         [--neutral-hue <0-360>] [--neutral-chroma <scale>] [--description <text>]",
  );
  process.exit(2);
}

const themes = join(import.meta.dirname, "../../../design/themes");
const reference = JSON.parse(await readFile(join(themes, "indigo.json"), "utf8")) as {
  palette: { accent: Ramp; neutral: Ramp };
};
const hue = Number(values.hue);
const chromaScale = Number(values.chroma);
const neutralHue = Number(values["neutral-hue"] ?? hue);
const neutralScale = Number(values["neutral-chroma"]);

const theme = {
  $description: values.description ?? `Accent hue ${hue}.`,
  palette: {
    accent: ramp(reference.palette.accent, hue, (c) => c * chromaScale),
    // Neutrals carry a trace of the hue. Following the reference keeps that trace faint near
    // white, where more of it would read as a tint.
    neutral: ramp(reference.palette.neutral, neutralHue, (c) => c * neutralScale),
  },
};
await writeFile(join(themes, `${name}.json`), `${JSON.stringify(theme, null, 2)}\n`);
console.log(`wrote design/themes/${name}.json`);
