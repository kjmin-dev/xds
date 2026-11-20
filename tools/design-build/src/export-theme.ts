// Checks a theme file and writes it as a stylesheet: run by `xds export-theme`, with the
// binary's embedded copy of this tool when it runs outside a project.
//
//   node src/export-theme.ts <project> <file> <cli version> <name> [<prefix> <layer>]
//
// Prints one JSON document: the check's result and, when it passes, the stylesheet.
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { checkContrast } from "./contrast.ts";
import { emitThemeCss } from "./emit.ts";
import { readContract, themeModel } from "./theme-contract.ts";

const [directory, file, cliVersion, name, prefix, layer] = process.argv.slice(2);
try {
  if (!directory || !file || !name) throw new Error("expected a project, a theme file and a name");
  const root = resolve(directory);
  const contract = await readContract(root, cliVersion || undefined);
  const input: unknown = JSON.parse(await readFile(file, "utf8"));
  const model = await themeModel(root, input, contract);
  const failures = checkContrast(model);
  const ok = failures.length === 0;
  const css = ok
    ? emitThemeCss(model, {
        name,
        source: basename(file),
        ...(prefix ? { prefix } : {}),
        ...(layer ? { layer } : {}),
      })
    : undefined;
  console.log(JSON.stringify({ version: contract.version, ok, failures, css }));
  process.exitCode = ok ? 0 : 1;
} catch (error) {
  console.error((error as Error).message);
  process.exitCode = 1;
}
