// Builds the React Native library's npm package into npm/dist/react-native, ready for
// `npm publish`:
//
//   node npm/react-native/build.ts [--out <dir>]
//
// @xds/react-native, at the release version: the components of packages/ui-native compiled to
// JavaScript with their declarations, the tokens they draw with inside the package (the channel
// is one package, docs/library.md), the preset themes as values, and the native module the glass
// surfaces read the system's settings with. It is renamed from the placeholder `acme` to `xds`
// the way `xds create` renames a project, and the build fails if `acme` is left anywhere.

import { execFileSync } from "node:child_process";
import { copyFile, cp, mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";
import { emitTypeScriptTheme } from "../../tools/design-build/src/emit.ts";
import { loadModel } from "../../tools/design-build/src/model.ts";
import { listThemes } from "../../tools/design-build/src/themes.ts";
import { releaseVersion } from "../release-version.ts";

export const root = resolve(import.meta.dirname, "../..");
export const NAME = "@xds/react-native";

/**
 * What an app must already have, at a version in these ranges: the support window of the
 * channel. The oldest React Native is the oldest minor release the React Native team supports,
 * and the newest the one the Expo SDK of the template runs; consumer.ts checks both ends. The
 * Expo modules are optional: without them the glass surfaces take their opaque material.
 */
export const PEERS = {
  react: "^19.2.3",
  "react-native": ">=0.86.0 <0.89.0",
  "react-native-safe-area-context": "^5.11.1",
  "react-native-svg": "^15.16.0",
  expo: "^58.0.25",
  "expo-blur": "^58.0.6",
  "expo-glass-effect": "^58.0.5",
  "expo-linear-gradient": "^58.0.4",
} as const;
export const OPTIONAL_PEERS = ["expo", "expo-blur", "expo-glass-effect", "expo-linear-gradient"];

export function run(command: string, args: string[], cwd: string) {
  execFileSync(command, args, { cwd, stdio: ["ignore", "inherit", "inherit"] });
}

async function files(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name));
}

/** The placeholder name becomes the library's, in a file's text or in a path. */
function renamed(text: string): string {
  return text.replaceAll("acme", "xds").replaceAll("Acme", "Xds").replaceAll("ACME", "XDS");
}

/**
 * Compiles a workspace package's TypeScript with tsrs: the JavaScript, and the declarations with
 * their documentation. Relative imports name the `.js` files that are emitted.
 */
function compile(dir: string, out: string) {
  const tsrs = join(root, "npm/react-native/node_modules/.bin/tsrs");
  const common = ["-p", dir, "--noEmit", "false", "--rootDir", dir, "--outDir", out];
  run(tsrs, [...common, "--rewriteRelativeImportExtensions", "--declaration", "false"], root);
  run(tsrs, [...common, "--declaration", "--emitDeclarationOnly"], root);
}

/** The preset themes as values, as `xds export-theme --format react-native` writes a theme. */
async function presets(lib: string) {
  const js = ["// The preset themes, generated from design/themes.", ""];
  const dts = [
    "// The preset themes, generated from design/themes.",
    "",
    'import type { Theme } from "./tokens/index.js";',
    "",
  ];
  for (const { name, description } of await listThemes(root)) {
    const model = await loadModel(
      join(root, "design/tokens"),
      join(root, "design/themes", `${name}.json`),
    );
    const module = emitTypeScriptTheme(model, {
      name,
      source: `${name}.json`,
      importFrom: "./tokens/index.js",
    });
    const value = module.slice(module.indexOf("export const "));
    const declaration = value.match(/^export const (\w+): Theme = /)?.[1];
    if (!declaration) throw new Error(`no theme value for ${name}`);
    js.push(`/** ${description} */`, value.replace(": Theme = ", " = ").trimEnd(), "");
    dts.push(`/** ${description} */`, `export declare const ${declaration}: Theme;`, "");
  }
  await writeFile(join(lib, "themes.js"), js.join("\n"));
  await writeFile(join(lib, "themes.d.ts"), dts.join("\n"));
}

function readme(): string {
  const docs = "https://github.com/kjmin-dev/xds/blob/main/docs/react-native-library.md";
  return [
    `# ${NAME}`,
    "",
    "The xds design system's components for React Native and Expo apps.",
    "",
    "```tsx",
    'import { Button, XdsTheme } from "@xds/react-native";',
    "",
    "<XdsTheme>",
    '  <Button variant="primary" label="Save" onPress={save} />',
    "</XdsTheme>;",
    "```",
    "",
    `See [the React Native library](${docs}).`,
    "",
  ].join("\n");
}

export async function buildPackage(out: string): Promise<string> {
  const version = await releaseVersion(root);
  const work = join(out, ".work");
  const target = join(out, "package");
  await rm(out, { recursive: true, force: true });
  await mkdir(work, { recursive: true });

  compile(join(root, "packages/ui-native"), join(work, "ui-native"));
  compile(join(root, "packages/tokens"), join(work, "tokens"));
  const lib = join(target, "lib");
  await cp(join(work, "ui-native/src"), lib, { recursive: true });
  await cp(join(work, "tokens/src"), join(lib, "tokens"), { recursive: true });
  for (const file of await files(lib)) {
    if (!/\.(js|d\.ts)$/.test(file)) continue;
    let text = await readFile(file, "utf8");
    // The tokens are inside the package: its modules are flat in lib/, beside lib/tokens/.
    if (!file.includes("/lib/tokens/"))
      text = text.replaceAll('"@acme/tokens"', '"./tokens/index.js"');
    // The declarations name the modules that are published, as the JavaScript does.
    text = text.replace(/((?:from|import\()\s*"\.{1,2}\/[^"]+)\.tsx?"/g, '$1.js"');
    await writeFile(file, text);
  }
  await presets(lib);

  // The native module the glass surfaces read the system's settings with. Expo's autolinking
  // links it; react-native.config.js keeps the React Native CLI's from linking it in an app
  // without Expo, where it has nothing to build against and the surfaces stay opaque.
  const native = join(root, "packages/ui-native");
  for (const dir of ["android", "ios"]) {
    await cp(join(native, dir), join(target, dir), {
      recursive: true,
      filter: (path) =>
        !/\/(build|\.gradle|\.cxx)(\/|$)/.test(path) && !path.endsWith(".gitignore"),
    });
  }
  await copyFile(join(native, "expo-module.config.json"), join(target, "expo-module.config.json"));
  await writeFile(
    join(target, "react-native.config.js"),
    [
      "// Expo's autolinking links the native module (expo-module.config.json). Without Expo it",
      "// cannot build, so the React Native CLI's autolinking leaves it out.",
      "module.exports = { dependency: { platforms: { ios: null, android: null } } };",
      "",
    ].join("\n"),
  );

  const typed = (path: string) => ({ types: `./lib/${path}.d.ts`, default: `./lib/${path}.js` });
  const launcher = JSON.parse(await readFile(join(root, "npm/xds-cli/package.json"), "utf8")) as {
    license: string;
    bugs: string;
    repository: { type: string; url: string };
  };
  const manifest = {
    name: NAME,
    version,
    description: "The xds design system's components for React Native and Expo apps.",
    keywords: ["design-system", "design-tokens", "components", "react-native", "expo"],
    license: launcher.license,
    homepage: "https://github.com/kjmin-dev/xds/blob/main/docs/react-native-library.md",
    bugs: launcher.bugs,
    repository: { ...launcher.repository, directory: "packages/ui-native" },
    type: "module",
    main: "./lib/index.js",
    types: "./lib/index.d.ts",
    exports: {
      ".": typed("index"),
      "./scheme": typed("scheme"),
      "./glass": typed("glassScene"),
      "./glass-preview": typed("glassPreview"),
      "./themes": typed("themes"),
      "./tokens": typed("tokens/index"),
      "./package.json": "./package.json",
    },
    files: ["lib", "android", "ios", "expo-module.config.json", "react-native.config.js"],
    peerDependencies: PEERS,
    peerDependenciesMeta: Object.fromEntries(
      OPTIONAL_PEERS.map((name) => [name, { optional: true }]),
    ),
  };
  await writeFile(join(target, "package.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(join(target, "README.md"), readme());
  await copyFile(join(root, "LICENSE"), join(target, "LICENSE"));

  // The placeholder becomes the library's name, in the text and in the paths.
  for (const file of await files(target)) {
    if ([".png", ".jar"].includes(extname(file))) continue;
    const text = await readFile(file, "utf8");
    const next = renamed(text);
    if (next !== text) await writeFile(file, next);
  }
  for (const file of (await files(target)).sort((a, b) => b.length - a.length)) {
    const path = relative(target, file);
    if (renamed(path) === path) continue;
    await mkdir(dirname(join(target, renamed(path))), { recursive: true });
    await rename(file, join(target, renamed(path)));
  }
  for (const dir of ["android/src/main/java/acme", "android/src/main/java/acme/ui"]) {
    await rm(join(target, dir), { recursive: true, force: true });
  }
  const left: string[] = [];
  for (const file of await files(target)) {
    const text = await readFile(file, "utf8");
    if (/acme|Acme|ACME/.test(text) || /acme/i.test(relative(target, file))) left.push(file);
  }
  if (left.length > 0) {
    throw new Error(`The placeholder name is left in:\n  ${left.join("\n  ")}`);
  }
  await rm(work, { recursive: true, force: true });
  return target;
}

if (import.meta.main) {
  const { values } = parseArgs({
    options: { out: { type: "string", default: join(root, "npm/dist/react-native") } },
  });
  const target = await buildPackage(resolve(values.out));
  console.log(`Built ${NAME} into ${target}`);
}
