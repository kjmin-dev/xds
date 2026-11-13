// Color themes. A theme is a file in design/themes that holds an accent ramp and a neutral ramp.
// Applying one copies those two ramps into design/tokens/palette.json; the semantic and component
// colors refer to the palette by step, so they follow.

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

type Group = Record<string, unknown>;
export type Theme = {
  name: string;
  description: string;
  palette: { accent: Group; neutral: Group };
};

const themesDir = (root: string) => join(root, "design/themes");

export async function listThemes(root: string): Promise<Theme[]> {
  const files = (await readdir(themesDir(root))).filter((file) => file.endsWith(".json")).sort();
  return Promise.all(files.map((file) => readTheme(root, file.slice(0, -".json".length))));
}

export async function readTheme(root: string, name: string): Promise<Theme> {
  const file = join(themesDir(root), `${name}.json`);
  const content = JSON.parse(await readFile(file, "utf8")) as {
    $description?: string;
    palette?: { accent?: Group; neutral?: Group };
  };
  if (!content.palette?.accent || !content.palette.neutral) {
    throw new Error(`${file}: a theme needs palette.accent and palette.neutral`);
  }
  return {
    name,
    description: content.$description ?? "",
    palette: { accent: content.palette.accent, neutral: content.palette.neutral },
  };
}

/** Replaces the accent and neutral ramps of the palette. The other ramps are left alone. */
export async function applyTheme(root: string, name: string): Promise<void> {
  const theme = await readTheme(root, name);
  const file = join(root, "design/tokens/palette.json");
  const tokens = JSON.parse(await readFile(file, "utf8")) as { palette: Group };
  tokens.palette.accent = theme.palette.accent;
  tokens.palette.neutral = theme.palette.neutral;
  await writeFile(file, `${JSON.stringify(tokens, null, 2)}\n`);
}
