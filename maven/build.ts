// Builds the Compose library into a Maven repository directory, ready for Maven Central:
//
//   node maven/build.ts [--out <dir>] [--xds <binary>]
//
// `io.github.kjmin-dev:xds-ui` and its platform artifacts (`xds-ui-android`, `xds-ui-jvm`,
// `xds-ui-iosarm64`, `xds-ui-iossimulatorarm64`), at the release version. They are built from the
// `ui` module of a project that `xds create` makes from this repository under the name `xds`, so
// they are renamed from the placeholder `acme` exactly as a scaffolded project is, and carry the
// same code. The library adds the preset themes as values (`xds.themes.OceanTheme`) and the
// publication (publish.gradle.kts). The iOS artifacts are built on macOS only.
//
// With the SIGNING_KEY and SIGNING_PASSWORD environment variables (an ASCII-armored PGP secret
// key and its passphrase), every file is signed, as Maven Central requires. upload.ts sends the
// result there.

import { execFileSync } from "node:child_process";
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { releaseVersion } from "../npm/release-version.ts";
import { emitKotlinTheme } from "../tools/design-build/src/emit.ts";
import { loadModel } from "../tools/design-build/src/model.ts";
import { listThemes } from "../tools/design-build/src/themes.ts";

export const root = resolve(import.meta.dirname, "..");
const here = import.meta.dirname;

/** The group and the root artifact on Maven Central (docs/library.md, "Names and ownership"). */
export const GROUP = "io.github.kjmin-dev";
export const ARTIFACT = "xds-ui";

export function run(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv = {}) {
  execFileSync(command, args, {
    cwd,
    stdio: ["ignore", "inherit", "inherit"],
    env: { ...process.env, ...env },
  });
}

/** The xds binary: the one given, or one built from this repository. */
export function xdsBinary(given: string | undefined): string {
  if (given) return resolve(given);
  run("cargo", ["build", "--quiet", "--package", "xds"], root);
  return join(root, "target/debug/xds");
}

/** A Kotlin Compose project that `xds create` makes from this repository, named as the library. */
export async function scaffold(xds: string, directory: string) {
  await rm(directory, { recursive: true, force: true });
  run(xds, ["create", directory, "--name", "xds", "--targets", "kotlin-compose", "--yes"], root);
}

/** The Gradle wrapper of a project's Kotlin build. */
export function gradlew(kotlin: string) {
  return join(kotlin, process.platform === "win32" ? "gradlew.bat" : "gradlew");
}

async function replaceIn(file: string, pairs: [from: string, to: string][]) {
  let text = await readFile(file, "utf8");
  for (const [from, to] of pairs) {
    if (!text.includes(from)) throw new Error(`${file} no longer contains ${JSON.stringify(from)}`);
    text = text.replace(from, to);
  }
  await writeFile(file, text);
}

async function files(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name));
}

/** The files of a directory and, inside a jar, an AAR or a klib, what they hold, at any depth. */
async function contents(directory: string, scratch: string): Promise<string[]> {
  const found: string[] = [];
  for (const file of await files(directory)) {
    if (!/\.(jar|aar|klib)$/.test(file)) {
      found.push(file);
      continue;
    }
    const inside = join(scratch, String(found.length), file.slice(directory.length));
    await mkdir(inside, { recursive: true });
    execFileSync("unzip", ["-q", "-o", file, "-d", inside]);
    found.push(...(await contents(inside, `${inside}.inner`)));
  }
  return found;
}

/**
 * Fails if the placeholder is left in a published file, or in what one holds: sources, class
 * files and Kotlin metadata all carry package names as text.
 */
async function checkRenamed(repository: string, scratch: string) {
  await rm(scratch, { recursive: true, force: true });
  const left = new Set<string>();
  for (const file of await contents(repository, scratch)) {
    const content = await readFile(file);
    if (["acme", "Acme", "ACME"].some((word) => content.includes(word))) left.add(file);
  }
  await rm(scratch, { recursive: true, force: true });
  if (left.size > 0) {
    throw new Error(`The placeholder name is left in:\n  ${[...left].join("\n  ")}`);
  }
}

/** Builds the library into `<out>/repository` and returns that directory. */
export async function buildLibrary(out: string, xds: string): Promise<string> {
  const version = await releaseVersion(root);
  const work = join(out, ".work");
  const project = join(work, "project");
  const repository = join(out, "repository");
  await rm(repository, { recursive: true, force: true });
  await scaffold(xds, project);
  const kotlin = join(project, "kotlin");

  // Only the library: its artifact is named `xds-ui`, and the apps beside it are not built.
  await replaceIn(join(kotlin, "settings.gradle.kts"), [
    ['include(":ui")', `include(":${ARTIFACT}")\nproject(":${ARTIFACT}").projectDir = file("ui")`],
    ['include(":shared")\n', ""],
    ['include(":androidApp")\n', ""],
    ['include(":desktopApp")\n', ""],
  ]);
  const module = join(kotlin, "ui");
  await replaceIn(join(module, "build.gradle.kts"), [
    // The Android namespace is the Kotlin package rather than an example domain's.
    ['namespace = "com.example.xds.ui"', 'namespace = "xds.ui"'],
  ]);
  await writeFile(
    join(module, "build.gradle.kts"),
    `${await readFile(join(module, "build.gradle.kts"), "utf8")}\napply(from = "publish.gradle.kts")\n`,
  );
  await copyFile(join(here, "publish.gradle.kts"), join(module, "publish.gradle.kts"));

  // The presets, as the values `xds export-theme --format compose` writes for a theme file.
  const themes = join(module, "src/commonMain/kotlin/xds/themes");
  await mkdir(themes, { recursive: true });
  for (const { name } of await listThemes(project)) {
    const model = await loadModel(
      join(project, "design/tokens"),
      join(project, "design/themes", `${name}.json`),
    );
    const source = emitKotlinTheme(model, {
      name,
      source: `${name}.json`,
      packageName: "xds.themes",
      tokensPackage: "xds.tokens",
    }).replace(
      /^\/\/ Generated by xds from .*$/m,
      `// The ${name} preset, generated by maven/build.ts from design/themes/${name}.json.`,
    );
    const file = `${name.charAt(0).toUpperCase()}${name.slice(1)}Theme.kt`;
    await writeFile(join(themes, file), source);
  }

  run(
    gradlew(kotlin),
    [
      `:${ARTIFACT}:publishAllPublicationsToReleaseRepository`,
      `-Pxds.version=${version}`,
      `-Pxds.repository=${repository}`,
      "--console=plain",
    ],
    kotlin,
  );
  await checkRenamed(repository, join(work, "unpacked"));
  return repository;
}

if (import.meta.main) {
  const { values } = parseArgs({
    options: {
      out: { type: "string", default: join(root, "maven/dist") },
      xds: { type: "string" },
    },
  });
  const repository = await buildLibrary(resolve(values.out), xdsBinary(values.xds));
  const artifacts = (await readdir(join(repository, ...GROUP.split(".")))).sort();
  console.log(`Built ${artifacts.join(", ")} into ${repository}`);
}
