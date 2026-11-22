// Checks a theme file and writes it for a client: run by `xds export-theme`, with the binary's
// embedded copy of this tool when it runs outside a project.
//
//   node src/export-theme.ts <project> <file> <cli version> <name> css [<prefix> [<layer>]]
//   node src/export-theme.ts <project> <file> <cli version> <name> compose <package> <tokens package>
//
// `css` writes a stylesheet for the web; `compose` a Kotlin file with the theme as a value for
// the Compose components. Prints one JSON document: the check's result and, when it passes,
// what was written for the client.
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { checkContrast } from "./contrast.ts";
import { emitKotlinTheme, emitThemeCss } from "./emit.ts";
import type { Model } from "./model.ts";
import { readContract, themeModel } from "./theme-contract.ts";

const [directory, file, cliVersion, name, format, first, second] = process.argv.slice(2);

function emit(model: Model, source: string): string {
  switch (format) {
    case "css":
      return emitThemeCss(model, {
        name: name ?? "",
        source,
        ...(first ? { prefix: first } : {}),
        ...(second ? { layer: second } : {}),
      });
    case "compose":
      if (!first || !second) throw new Error("expected a package and the tokens' package");
      return emitKotlinTheme(model, {
        name: name ?? "",
        source,
        packageName: first,
        tokensPackage: second,
      });
    default:
      throw new Error(`no such format: "${format}"`);
  }
}

try {
  if (!directory || !file || !name) throw new Error("expected a project, a theme file and a name");
  const root = resolve(directory);
  const contract = await readContract(root, cliVersion || undefined);
  const input: unknown = JSON.parse(await readFile(file, "utf8"));
  const model = await themeModel(root, input, contract);
  const failures = checkContrast(model);
  const ok = failures.length === 0;
  const output = ok ? emit(model, basename(file)) : undefined;
  console.log(JSON.stringify({ version: contract.version, ok, failures, output }));
  process.exitCode = ok ? 0 : 1;
} catch (error) {
  console.error((error as Error).message);
  process.exitCode = 1;
}
