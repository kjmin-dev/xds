// Also run by the standalone xds binary with its embedded copy of the checker.
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { checkTheme, readContract } from "./theme-contract.ts";

const [directory, file, cliVersion] = process.argv.slice(2);
try {
  if (!directory || !file) throw new Error("expected a project directory and a theme file");
  const root = resolve(directory);
  const contract = await readContract(root, cliVersion);
  const input: unknown = JSON.parse(await readFile(file, "utf8"));
  const result = await checkTheme(root, input, contract);
  console.log(JSON.stringify(result));
  process.exitCode = result.ok ? 0 : 1;
} catch (error) {
  console.error((error as Error).message);
  process.exitCode = 1;
}
