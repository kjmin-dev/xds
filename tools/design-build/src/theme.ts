// Switches the color theme and regenerates the platform files.
//
//   node src/theme.ts            list the themes
//   node src/theme.ts <name>     apply one

import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { applyTheme, listThemes } from "./themes.ts";

const root = join(import.meta.dirname, "../../..");
const themes = await listThemes(root);
const name = process.argv[2];

if (!name) {
  for (const theme of themes) console.log(`${theme.name.padEnd(10)} ${theme.description}`);
} else if (!themes.some((theme) => theme.name === name)) {
  console.error(
    `There is no theme "${name}". Themes: ${themes.map((theme) => theme.name).join(", ")}`,
  );
  process.exitCode = 1;
} else {
  await applyTheme(root, name);
  // The build checks the contrast of the new colors before it writes anything.
  const build = spawnSync(process.execPath, [join(import.meta.dirname, "build.ts")], {
    stdio: "inherit",
  });
  process.exitCode = build.status ?? 1;
}
