#!/usr/bin/env node
// Runs the xds binary for this machine. The binary is not in this package: each platform has
// its own package (xds-cli-darwin-arm64 and so on), listed here as optional dependencies, and
// npm installs only the one whose `os` and `cpu` match.

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { constants } from "node:os";

const require = createRequire(import.meta.url);
const platformPackage = `xds-cli-${process.platform}-${process.arch}`;
const binaryName = process.platform === "win32" ? "xds.exe" : "xds";

function findBinary() {
  // For trying a binary that was built locally.
  if (process.env.XDS_BINARY) return process.env.XDS_BINARY;
  try {
    return require.resolve(`${platformPackage}/bin/${binaryName}`);
  } catch {
    return undefined;
  }
}

const binary = findBinary();
if (!binary) {
  console.error(
    `xds: the package ${platformPackage} is not installed.\n` +
      "Either there is no xds build for this platform, or optional dependencies were skipped\n" +
      "(npm install --omit=optional, or a lockfile written on another platform).\n" +
      "Builds exist for macOS (arm64, x64), Linux (arm64, x64) and Windows (x64).\n" +
      "From source: https://github.com/kjmin-dev/xds/blob/main/docs/cli.md",
  );
  process.exit(1);
}

// The terminal goes straight to the binary: its prompts read keys and redraw in place.
const result = spawnSync(binary, process.argv.slice(2), { stdio: "inherit" });
if (result.error) {
  console.error(`xds: could not run ${binary}: ${result.error.message}`);
  process.exit(1);
}
if (result.signal) {
  // What a shell reports for a command that was stopped by a signal.
  process.exit(128 + (constants.signals[result.signal] ?? 0));
}
process.exit(result.status ?? 1);
