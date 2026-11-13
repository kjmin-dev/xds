// Reads the icons in design/icons: one SVG file each, drawn on a 24 by 24 grid with a stroke
// and no fill. Every shape becomes path data, so each platform only has to draw paths.

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { TokenError } from "./model.ts";

export type Icon = {
  /** The file name without its extension, in kebab case. */
  name: string;
  /** SVG path data, one entry per shape, in drawing order. */
  paths: string[];
};

/** The grid every icon is drawn on, and the stroke it is drawn with. */
export const ICON_GRID = 24;
export const ICON_STROKE = 2;

type Attributes = Record<string, string>;

function number(attributes: Attributes, key: string, fallback = 0): number {
  const value = attributes[key];
  return value === undefined ? fallback : Number(value);
}

function circle(cx: number, cy: number, rx: number, ry: number): string {
  // Two half arcs: a single arc cannot return to its own starting point.
  return `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0`;
}

function rect(x: number, y: number, width: number, height: number, r: number): string {
  if (r === 0) return `M${x} ${y}h${width}v${height}h${-width}z`;
  const [w, h] = [width - r * 2, height - r * 2];
  return (
    `M${x + r} ${y}h${w}a${r} ${r} 0 0 1 ${r} ${r}v${h}a${r} ${r} 0 0 1 ${-r} ${r}` +
    `h${-w}a${r} ${r} 0 0 1 ${-r} ${-r}v${-h}a${r} ${r} 0 0 1 ${r} ${-r}z`
  );
}

function shape(file: string, tag: string, a: Attributes): string {
  switch (tag) {
    case "path":
      if (!a.d) throw new TokenError(`${file}: a path without "d"`);
      return a.d;
    case "circle":
      return circle(number(a, "cx"), number(a, "cy"), number(a, "r"), number(a, "r"));
    case "ellipse":
      return circle(number(a, "cx"), number(a, "cy"), number(a, "rx"), number(a, "ry"));
    case "line":
      return `M${number(a, "x1")} ${number(a, "y1")}L${number(a, "x2")} ${number(a, "y2")}`;
    case "rect": {
      const r = number(a, "rx", number(a, "ry"));
      return rect(number(a, "x"), number(a, "y"), number(a, "width"), number(a, "height"), r);
    }
    case "polyline":
    case "polygon":
      return `M${(a.points ?? "").trim().replace(/\s+/g, " ")}${tag === "polygon" ? "z" : ""}`;
    default:
      throw new TokenError(`${file}: <${tag}> is not a shape this tool can turn into a path`);
  }
}

export function parseIcon(file: string, svg: string): string[] {
  const root = /<svg\b([^>]*)>/.exec(svg);
  if (!root) throw new TokenError(`${file}: not an SVG file`);
  const viewBox = /viewBox="([^"]*)"/.exec(root[1] ?? "")?.[1];
  if (viewBox !== `0 0 ${ICON_GRID} ${ICON_GRID}`) {
    throw new TokenError(`${file}: icons are drawn on a ${ICON_GRID} by ${ICON_GRID} grid`);
  }
  const paths: string[] = [];
  const body = svg.slice((root.index ?? 0) + root[0].length);
  for (const [, tag, text] of body.matchAll(/<([a-z]+)\b([^>]*?)\/?>/g)) {
    const attributes = Object.fromEntries(
      [...(text ?? "").matchAll(/([a-z0-9-]+)="([^"]*)"/g)].map(([, key, value]) => [key, value]),
    ) as Attributes;
    paths.push(shape(file, tag as string, attributes));
  }
  if (paths.length === 0) throw new TokenError(`${file}: no shapes`);
  return paths;
}

/** The icons in `directory`, by name. A project without the directory has no icons. */
export async function loadIcons(directory: string): Promise<Icon[]> {
  const files = await readdir(directory).catch(() => [] as string[]);
  const icons: Icon[] = [];
  for (const file of files.filter((name) => name.endsWith(".svg")).sort()) {
    const name = file.slice(0, -".svg".length);
    if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) {
      throw new TokenError(`${file}: icon file names are kebab-case`);
    }
    icons.push({ name, paths: parseIcon(file, await readFile(join(directory, file), "utf8")) });
  }
  return icons;
}
