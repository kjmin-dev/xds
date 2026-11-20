import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** The version of the crate: every package of a release carries the same one. */
export async function releaseVersion(root: string) {
  const manifest = await readFile(join(root, "cli/Cargo.toml"), "utf8");
  const version = manifest.match(/^\[package\][^[]*?^version\s*=\s*"([^"]+)"/ms)?.[1];
  if (!version) throw new Error("cli/Cargo.toml has no version in [package]");
  return version;
}
