// Assembles the npm packages for a release into npm/dist, ready for `npm publish`.
//
//   node npm/build-packages.mjs --binaries <dir> [--out <dir>] [--require-all]
//
// <dir> holds one directory per Rust target with the binary inside, which is how the release
// workflow unpacks its archives:
//
//   <dir>/aarch64-apple-darwin/xds
//   <dir>/x86_64-pc-windows-msvc/xds.exe
//
// A platform whose binary is missing is skipped, so the packages can be built and tried on one
// machine. A release passes --require-all, which makes a missing binary an error.

import { chmod, copyFile, cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";

const root = resolve(import.meta.dirname, "..");

/** The Rust target each npm platform package is built from. `os` and `cpu` are Node's names. */
const PLATFORMS = [
  { target: "aarch64-apple-darwin", os: "darwin", cpu: "arm64", label: "macOS on Apple silicon" },
  { target: "x86_64-apple-darwin", os: "darwin", cpu: "x64", label: "macOS on Intel" },
  { target: "aarch64-unknown-linux-musl", os: "linux", cpu: "arm64", label: "Linux on arm64" },
  { target: "x86_64-unknown-linux-musl", os: "linux", cpu: "x64", label: "Linux on x64" },
  { target: "x86_64-pc-windows-msvc", os: "win32", cpu: "x64", label: "Windows on x64" },
];

const { values: options } = parseArgs({
  options: {
    binaries: { type: "string" },
    out: { type: "string", default: join(root, "npm/dist") },
    "require-all": { type: "boolean", default: false },
  },
});
if (!options.binaries) {
  console.error(
    "Usage: node npm/build-packages.mjs --binaries <dir> [--out <dir>] [--require-all]",
  );
  process.exit(1);
}
const binaries = resolve(options.binaries);
const out = resolve(options.out);

/** The version of the crate: every package of a release carries the same one. */
async function crateVersion() {
  const manifest = await readFile(join(root, "cli/Cargo.toml"), "utf8");
  const version = manifest.match(/^\[package\][^[]*?^version\s*=\s*"([^"]+)"/ms)?.[1];
  if (!version) throw new Error("cli/Cargo.toml has no version in [package]");
  return version;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function exists(path) {
  return stat(path).then(
    () => true,
    () => false,
  );
}

/** Copies a package from npm/<name> and stamps the version on it and on the listed dependencies. */
async function buildFromSource(name, version, dependencyFields) {
  const directory = join(out, name);
  await cp(join(root, "npm", name), directory, { recursive: true });
  await copyFile(join(root, "LICENSE"), join(directory, "LICENSE"));
  const manifest = await readJson(join(directory, "package.json"));
  manifest.version = version;
  for (const field of dependencyFields) {
    for (const dependency of Object.keys(manifest[field])) manifest[field][dependency] = version;
  }
  await writeJson(join(directory, "package.json"), manifest);
  return manifest;
}

async function buildPlatformPackage(platform, version, launcher) {
  const name = `xds-cli-${platform.os}-${platform.cpu}`;
  const file = platform.os === "win32" ? "xds.exe" : "xds";
  const binary = join(binaries, platform.target, file);
  if (!(await exists(binary))) return undefined;

  const directory = join(out, name);
  await mkdir(join(directory, "bin"), { recursive: true });
  await copyFile(binary, join(directory, "bin", file));
  await chmod(join(directory, "bin", file), 0o755);
  await copyFile(join(root, "LICENSE"), join(directory, "LICENSE"));
  await writeFile(
    join(directory, "README.md"),
    `# ${name}\n\nThe xds binary for ${platform.label}. Install [xds-cli](https://www.npmjs.com/package/xds-cli) instead: it picks the package for your machine.\n`,
  );
  await writeJson(join(directory, "package.json"), {
    name,
    version,
    description: `The xds binary for ${platform.label}.`,
    license: launcher.license,
    homepage: launcher.homepage,
    bugs: launcher.bugs,
    repository: { ...launcher.repository, directory: "cli" },
    os: [platform.os],
    cpu: [platform.cpu],
    files: ["bin"],
    // Yarn Plug'n'Play would otherwise keep the binary inside a zip, where it cannot run.
    preferUnplugged: true,
  });
  return name;
}

const version = await crateVersion();
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

const launcher = await buildFromSource("xds-cli", version, ["optionalDependencies"]);
await buildFromSource("create-xds", version, ["dependencies"]);

const built = [];
const missing = [];
for (const platform of PLATFORMS) {
  const name = await buildPlatformPackage(platform, version, launcher);
  if (name) built.push(name);
  else missing.push(`xds-cli-${platform.os}-${platform.cpu} (${platform.target})`);
}

// The launcher must not promise a platform package this script does not know how to build.
const promised = Object.keys(launcher.optionalDependencies).sort();
const known = PLATFORMS.map((platform) => `xds-cli-${platform.os}-${platform.cpu}`).sort();
if (promised.join() !== known.join()) {
  console.error("npm/xds-cli/package.json and PLATFORMS in this script list different packages.");
  process.exit(1);
}

console.log(`xds ${version} in ${out}`);
// Platform packages first: xds-cli depends on them, and create-xds on xds-cli.
for (const name of [...built, "xds-cli", "create-xds"]) console.log(`  ${name}`);
if (missing.length > 0) {
  console.error(`No binary under ${binaries} for:`);
  for (const name of missing) console.error(`  ${name}`);
  if (options["require-all"]) process.exit(1);
}
