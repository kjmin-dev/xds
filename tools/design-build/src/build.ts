// Generates the platform token files from design/tokens.
//
//   node src/build.ts           write the generated files
//   node src/build.ts --check   fail if the committed files are out of date (used by CI)

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { checkContrast } from "./contrast.ts";
import { emitCss, emitKotlin, emitRust, emitTailwind, emitTypeScript } from "./emit.ts";
import { loadIcons } from "./icons.ts";
import { loadModel, type Model, TokenError } from "./model.ts";

const root = join(import.meta.dirname, "../../..");
const check = process.argv.includes("--check");

/** One emitter per kind of output. `design/build.json` says which to write, and where. */
const EMITTERS: Record<string, (model: Model, path: string) => string> = {
  css: emitCss,
  tailwind: emitTailwind,
  typescript: emitTypeScript,
  rust: emitRust,
  // The package is the path below the Kotlin source root: .../kotlin/acme/tokens/Tokens.kt.
  kotlin: (model, path) =>
    emitKotlin(model, dirname(path).split("/kotlin/").at(-1)?.replaceAll("/", ".") ?? "tokens"),
};

async function main(): Promise<number> {
  const model = await loadModel(join(root, "design/tokens"));
  model.icons = await loadIcons(join(root, "design/icons"));

  const failures = checkContrast(model);
  if (failures.length > 0) {
    console.error("Contrast is too low:");
    for (const failure of failures) console.error(`  ${failure}`);
    return 1;
  }

  const config = JSON.parse(await readFile(join(root, "design/build.json"), "utf8")) as {
    outputs: Record<string, string>;
  };
  const outputs: [path: string, content: string][] = [];
  for (const [kind, path] of Object.entries(config.outputs)) {
    const emit = EMITTERS[kind];
    if (!emit) {
      console.error(`design/build.json: "${kind}" is not an output this tool can write.`);
      console.error(`  It can write: ${Object.keys(EMITTERS).join(", ")}`);
      return 1;
    }
    outputs.push([path, emit(model, path)]);
  }

  const stale: string[] = [];
  for (const [path, content] of outputs) {
    const file = join(root, path);
    const current = await readFile(file, "utf8").catch(() => undefined);
    if (current === content) continue;
    stale.push(path);
    if (!check) {
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, content);
    }
  }

  const summary = `${model.colors.length} colors, ${model.sizes.length} sizes, ${model.values.length} other tokens, ${model.icons.length} icons`;
  if (check && stale.length > 0) {
    console.error(`Generated token files are out of date (${summary}):`);
    for (const path of stale) console.error(`  ${path}`);
    console.error("Run `mise run tokens` and commit the result.");
    return 1;
  }
  const verb = check
    ? "up to date"
    : stale.length > 0
      ? `wrote ${stale.length} files`
      : "no changes";
  console.log(`tokens: ${summary}, ${verb}`);
  return 0;
}

try {
  process.exitCode = await main();
} catch (error) {
  if (!(error instanceof TokenError)) throw error;
  console.error(`Invalid token in ${relative(process.cwd(), join(root, "design/tokens"))}:`);
  console.error(`  ${error.message}`);
  process.exitCode = 1;
}
