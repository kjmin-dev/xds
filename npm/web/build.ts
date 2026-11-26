// Builds the npm packages of the web library into npm/dist/web, ready for `npm publish`:
//
//   node npm/web/build.ts [--out <dir>]
//
// @xds/tokens and @xds/core, and one package per framework (@xds/react, @xds/solid, @xds/vue,
// @xds/svelte), all at the release version. They are built from the same sources the scaffold
// copies, and renamed from the placeholder `acme` to `xds` the way `xds create` renames a
// project: package names, custom properties, utilities and part classes. Each framework package
// carries two stylesheets: `styles.css`, finished, for an app with no build tools of xds's, and
// `tailwind.css`, for an app that compiles it with its own Tailwind CSS.

import { execFileSync } from "node:child_process";
import { copyFile, cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { __unstable__loadDesignSystem, compile, Instrumentation } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { build as viteBuild, type InlineConfig, type PluginOption } from "vite";
import { emitThemeCss } from "../../tools/design-build/src/emit.ts";
import { loadModel } from "../../tools/design-build/src/model.ts";
import { listThemes } from "../../tools/design-build/src/themes.ts";
import { PACKAGE_METADATA } from "../package-metadata.ts";
import { releaseVersion } from "../release-version.ts";

const root = resolve(import.meta.dirname, "../..");
const here = import.meta.dirname;
const { values: options } = parseArgs({
  options: { out: { type: "string", default: join(root, "npm/dist/web") } },
});
const out = resolve(options.out);
const work = join(out, ".work");

export type Framework = "react" | "solid" | "vue" | "svelte";

/** Each package: where its sources are, the name it has in the template and when published. */
const PACKAGES = {
  tokens: { dir: "packages/tokens", from: "@acme/tokens", name: "@xds/tokens" },
  core: { dir: "packages/ui-core", from: "@acme/ui-core", name: "@xds/core" },
  react: { dir: "packages/ui", from: "@acme/ui", name: "@xds/react" },
  solid: { dir: "packages/ui-solid", from: "@acme/ui-solid", name: "@xds/solid" },
  vue: { dir: "packages/ui-vue", from: "@acme/ui-vue", name: "@xds/vue" },
  svelte: { dir: "packages/ui-svelte", from: "@acme/ui-svelte", name: "@xds/svelte" },
} as const;
type PackageKey = keyof typeof PACKAGES;
const FRAMEWORKS: Framework[] = ["react", "solid", "vue", "svelte"];

const DESCRIPTIONS: Record<PackageKey, string> = {
  tokens:
    "The design tokens of xds as CSS custom properties and TypeScript constants, with its preset themes.",
  core: "What the xds web component libraries share: prop types, class recipes and DOM helpers. Install a framework's package instead.",
  react: "The xds design system's components for React.",
  solid: "The xds design system's components for Solid.",
  vue: "The xds design system's components for Vue.",
  svelte: "The xds design system's components for Svelte.",
};

// ----------------------------------------------------------------------------- helpers

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

async function writeJson(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function files(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name));
}

function run(command: string, args: string[], cwd: string) {
  execFileSync(command, args, { cwd, stdio: ["ignore", "inherit", "inherit"] });
}

/** A tool installed in a workspace package's node_modules/.bin. */
function bin(packageDir: string, name: string) {
  return join(root, packageDir, "node_modules/.bin", name);
}

/** A module as a package of the workspace resolves it, for a plugin only that package has. */
async function importFrom<T>(packageDir: string, specifier: string): Promise<T> {
  const require = createRequire(join(root, packageDir, "package.json"));
  return (await import(pathToFileURL(require.resolve(specifier)).href)) as T;
}

/** The versions pnpm-workspace.yaml's default catalog gives. */
async function catalog(): Promise<Record<string, string>> {
  const text = await readFile(join(root, "pnpm-workspace.yaml"), "utf8");
  const block = text.split(/^catalog:\n/m)[1]?.split(/^\S/m)[0] ?? "";
  const versions: Record<string, string> = {};
  for (const line of block.split("\n")) {
    const match = line.match(/^\s+"?([^":#]+)"?:\s*(\S+)/);
    if (match?.[1] && match[2]) versions[match[1]] = match[2];
  }
  return versions;
}

/**
 * The placeholder name becomes the library's: first the package names, which do not follow the
 * pattern (`@acme/ui` is `@xds/react`), then every other `acme`.
 */
function rename(text: string): string {
  let renamed = text;
  for (const { from, name } of Object.values(PACKAGES)) {
    renamed = renamed.replace(new RegExp(`${from.replace("/", "\\/")}(?=["'/\`])`, "g"), name);
  }
  return renamed.replaceAll("acme", "xds").replaceAll("Acme", "Xds").replaceAll("ACME", "XDS");
}

const TEXT = new Set([".js", ".jsx", ".ts", ".css", ".svelte", ".json", ".md", ".map"]);

async function renameTree(dir: string) {
  for (const file of await files(dir)) {
    if (!TEXT.has(extname(file))) continue;
    const text = await readFile(file, "utf8");
    const renamed = rename(text);
    if (renamed !== text) await writeFile(file, renamed);
  }
}

// ----------------------------------------------------------------------------- JavaScript

/**
 * Compiles a package's TypeScript with tsrs: the JavaScript without comments, which also keeps
 * prose out of the classes Tailwind looks for, and the declarations with their documentation.
 * Only `src` is kept.
 */
async function emitTypeScript(key: PackageKey, target: string, jsx?: "preserve") {
  const dir = join(root, PACKAGES[key].dir);
  const temp = join(work, "tsc", key);
  await rm(temp, { recursive: true, force: true });
  const common = ["-p", dir, "--noEmit", "false", "--rootDir", dir, "--outDir", temp];
  const tsrs = bin("npm/web", "tsrs");
  run(
    tsrs,
    [
      ...common,
      "--rewriteRelativeImportExtensions",
      "--removeComments",
      "--declaration",
      "false",
    ].concat(jsx ? ["--jsx", jsx] : []),
    root,
  );
  run(tsrs, [...common, "--declaration", "--emitDeclarationOnly"], root);
  await rm(target, { recursive: true, force: true });
  await cp(join(temp, "src"), target, { recursive: true });
  for (const file of await files(target)) {
    if (/\.test\.(js|jsx|d\.ts)$/.test(file)) await rm(file);
  }
}

/** A framework's compiled modules, one per source module, with every package left external. */
async function viteLibrary(
  key: PackageKey,
  entries: string[],
  plugins: PluginOption[],
  target: string,
) {
  const dir = join(root, PACKAGES[key].dir);
  const config: InlineConfig = {
    root: dir,
    configFile: false,
    logLevel: "warn",
    plugins,
    build: {
      outDir: target,
      emptyOutDir: true,
      minify: false,
      copyPublicDir: false,
      lib: {
        entry: Object.fromEntries(
          entries.map((entry) => [basename(entry, extname(entry)), join(dir, entry)]),
        ),
        formats: ["es"],
      },
      rolldownOptions: {
        external: (id) => !id.startsWith(".") && !id.startsWith("/") && !id.startsWith("\0"),
        output: {
          preserveModules: true,
          preserveModulesRoot: join(dir, "src"),
          entryFileNames: "[name].js",
        },
      },
    },
  };
  await viteBuild(config);
}

async function buildJavaScript(key: PackageKey, dist: string) {
  switch (key) {
    case "tokens":
    case "core":
    case "react":
      await emitTypeScript(key, dist);
      return;
    case "solid": {
      // `solid` is the export condition Solid's own build tools look for: the components with
      // their JSX, compiled by the app for the DOM or the server. Every other tool takes the
      // DOM build beside it.
      await emitTypeScript(key, join(dist, "source"), "preserve");
      const { default: solid } = await importFrom<{ default: () => PluginOption }>(
        PACKAGES.solid.dir,
        "@solidjs/vite-plugin",
      );
      await viteLibrary(key, ["src/index.ts", "src/preview.tsx"], [solid()], join(dist, "dom"));
      return;
    }
    case "vue": {
      const { default: vue } = await importFrom<{ default: () => PluginOption }>(
        PACKAGES.vue.dir,
        "@vitejs/plugin-vue",
      );
      await viteLibrary(key, ["src/index.ts", "src/preview.ts"], [vue()], dist);
      const temp = join(work, "vue-types");
      await rm(temp, { recursive: true, force: true });
      const dir = PACKAGES.vue.dir;
      run(
        bin(dir, "vue-tsc"),
        [
          "-p",
          ".",
          "--noEmit",
          "false",
          "--declaration",
          "--emitDeclarationOnly",
          "--rootDir",
          ".",
          "--outDir",
          temp,
        ],
        join(root, dir),
      );
      await cp(join(temp, "src"), dist, { recursive: true });
      return;
    }
    case "svelte": {
      // The components stay Svelte components, which the app's compiler compiles: their
      // TypeScript becomes JavaScript, and each gets its declarations.
      run(
        bin("npm/web", "svelte-package"),
        ["--input", "src", "--output", dist, "--tsconfig", "tsconfig.json"],
        join(root, PACKAGES.svelte.dir),
      );
      // svelte-package compiles each `.ts` module to `.js` but leaves the imports of a
      // component's script as written, with the extension of the source.
      for (const file of await files(dist)) {
        if (!/\.(svelte|js|d\.ts)$/.test(file)) continue;
        const text = await readFile(file, "utf8");
        const fixed = text.replace(
          /((?:from|import)\s*\(?\s*["'])(\.{1,2}\/[^"']+)\.ts(["'])/g,
          "$1$2.js$3",
        );
        if (fixed !== text) await writeFile(file, fixed);
      }
      // svelte-package works in the package's .svelte-kit, which nothing else there uses.
      await rm(join(root, PACKAGES.svelte.dir, ".svelte-kit"), { recursive: true, force: true });
      return;
    }
  }
}

// ----------------------------------------------------------------------------- stylesheets

const SCOPE = ':where([class^="acme-"], [class*=" acme-"])';

/** Splits a selector list at its top-level commas. */
function selectors(list: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < list.length; index++) {
    const character = list[index];
    if (character === "(") depth++;
    else if (character === ")") depth--;
    else if (character === "," && depth === 0) {
      parts.push(list.slice(start, index).trim());
      start = index + 1;
    }
  }
  parts.push(list.slice(start).trim());
  return parts;
}

/**
 * A selector for the library's elements and what they hold: the element itself when it is one
 * (its last compound selector also matches SCOPE, before any pseudo-element), and any element
 * inside one. `:where` keeps the selector's specificity.
 */
function scoped(selector: string): string[] {
  let depth = 0;
  let cut = 0;
  for (let index = 0; index < selector.length; index++) {
    const character = selector[index] ?? "";
    if (character === "(" || character === "[") depth++;
    else if (character === ")" || character === "]") depth--;
    else if (depth === 0 && /[\s>+~]/.test(character)) cut = index + 1;
  }
  const last = selector.slice(cut);
  const pseudo = last.indexOf("::");
  const own =
    pseudo < 0 ? `${last}${SCOPE}` : `${last.slice(0, pseudo)}${SCOPE}${last.slice(pseudo)}`;
  return [`${selector.slice(0, cut)}${own}`, `${SCOPE} ${selector}`];
}

/**
 * Tailwind's preflight, for the library's own elements only: each of its selectors becomes one
 * for an element whose class starts with `acme-` (a component's root or part) and one for what
 * such an element holds. The rule for the root element is left out: it gives the page its font,
 * and styles/base.css gives that to the outermost component instead.
 */
async function scopedPreflight(): Promise<string> {
  const require = createRequire(join(here, "package.json"));
  const preflight = (await readFile(require.resolve("tailwindcss/preflight.css"), "utf8")).replace(
    /\/\*[\s\S]*?\*\//g,
    "",
  );
  let result = "";
  let start = 0;
  let skip = -1;
  let depth = 0;
  for (let index = 0; index < preflight.length; index++) {
    const character = preflight[index];
    if (character === "{") {
      const prelude = preflight.slice(start, index).trim();
      if (skip < 0 && /^html,\s*:host$/.test(prelude)) skip = depth;
      else if (skip < 0) {
        result += prelude.startsWith("@")
          ? `${prelude} {\n`
          : `${selectors(prelude).flatMap(scoped).join(",\n")} {\n`;
      }
      depth++;
      start = index + 1;
    } else if (character === "}") {
      depth--;
      if (skip < 0) result += `${preflight.slice(start, index).trim()}\n}\n`;
      else if (depth === skip) skip = -1;
      start = index + 1;
    } else if (character === ";" && skip < 0) {
      // A declaration, or a statement at the top level.
      result += `${preflight.slice(start, index + 1).trim()}\n`;
      start = index + 1;
    }
  }
  if (!result.includes(`${SCOPE} button`))
    throw new Error("tailwindcss/preflight.css changed shape");
  return `/* Tailwind CSS's preflight, for the library's elements. */\n${result}`;
}

/** The classes a framework package's components and preview draw with: Tailwind's candidates. */
function scan(dirs: string[]): string[] {
  const scanner = new Scanner({
    sources: dirs.flatMap((base) =>
      ["**/*.js", "**/*.jsx", "**/*.svelte"].map((pattern) => ({ base, pattern, negated: false })),
    ),
  });
  return scanner.scan();
}

/**
 * The finished stylesheet: Tailwind's theme inlined, so its utilities read no custom property but
 * the library's own; the tokens; Tailwind's preflight and the base, scoped to the library's
 * elements; the components; and the utilities they use. All of it in the `acme` layer and the
 * layers inside it, so any style of the app's own wins.
 */
async function finishedStylesheet(framework: Framework, sources: string[]): Promise<string> {
  const dir = join(work, "css", framework);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "preflight.css"), await scopedPreflight());
  const tokens = join(root, PACKAGES.tokens.dir, "src/generated");
  const styles = join(root, PACKAGES.core.dir, "src/styles");
  const entry = [
    "@layer acme.properties, acme.theme, acme.base, acme.components, acme.utilities;",
    '@import "tailwindcss/theme.css" layer(acme.theme) theme(inline);',
    '@import "tailwindcss/utilities.css" layer(acme.utilities);',
    `@import "${join(tokens, "tailwind.css")}";`,
    `@import "${join(tokens, "theme.css")}" layer(acme.theme);`,
    `@import "${join(dir, "preflight.css")}" layer(acme.base);`,
    `@import "${join(here, "styles/base.css")}" layer(acme);`,
    `@import "${join(styles, "components.css")}" layer(acme);`,
  ].join("\n");
  const compiler = await compile(entry, { base: here, onDependency: () => {} });
  using _ = new Instrumentation();
  const css = compiler.build(scan(sources));
  // Tailwind's fallback for browsers without @property sits in a layer of its own name.
  let layered = css
    .replace("@layer properties;\n", "")
    .replaceAll("@layer properties {", "@layer acme.properties {");
  // Tailwind's own animations (`animate-spin`) bring keyframes with common names. A page's
  // keyframes of the same name would replace them, so they take the library's prefix and its
  // layer.
  for (const name of new Set([...layered.matchAll(/^@keyframes ([\w-]+) \{/gm)].map((m) => m[1]))) {
    if (!name || name.startsWith("acme-")) continue;
    layered = layered
      .replace(
        new RegExp(`^@keyframes ${name} \\{`, "m"),
        `@layer acme.theme {\n@keyframes acme-${name} {`,
      )
      .replace(new RegExp(`(@keyframes acme-${name} \\{[\\s\\S]*?\\n\\})`), "$1\n}")
      .replace(
        new RegExp(`(animation(?:-name)?:[^;{}]*?)(?<![\\w-])${name}(?![\\w-])`, "g"),
        `$1acme-${name}`,
      );
  }
  for (const prelude of topLevel(layered)) {
    if (!/^(@layer acme[.\s{;,]|@property )/.test(prelude)) {
      throw new Error(`${framework}: a rule outside the acme layer: ${prelude}`);
    }
  }
  // Not run through Lightning CSS, which would write `rgb(0 0 0 / 0.06)` as `#0000000f`: an alpha
  // rounded to 255ths, which draws a shadow a shade off the scaffolded app's.
  return layered;
}

/** What starts each rule at the top level of a stylesheet, short of comments. */
function topLevel(css: string): string[] {
  const preludes: string[] = [];
  let depth = 0;
  let start = 0;
  const text = css.replace(/\/\*[\s\S]*?\*\//g, (comment) => " ".repeat(comment.length));
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (character === "{") {
      if (depth === 0) preludes.push(text.slice(start, index + 1).trim());
      depth++;
    } else if (character === "}") {
      depth--;
      if (depth === 0) start = index + 1;
    } else if (character === ";" && depth === 0) {
      preludes.push(text.slice(start, index + 1).trim());
      start = index + 1;
    }
  }
  return preludes;
}

/** CSS without its leading comment, to be put inside another stylesheet. */
async function body(path: string) {
  return (await readFile(path, "utf8")).replace(/^\/\*[\s\S]*?\*\/\s*/, "");
}

/**
 * The unbuilt stylesheet, for an app with Tailwind CSS of its own, which it imports before
 * Tailwind: the library's layers between the app's base and components, the tokens as a Tailwind
 * theme, and every utility the library uses named for the app's Tailwind to generate. Its
 * utilities are then the app's own, and its preflight resets the library's elements too.
 */
async function unbuiltStylesheet(framework: Framework, candidates: string[]): Promise<string> {
  const tokens = join(root, PACKAGES.tokens.dir, "src/generated");
  const styles = join(root, PACKAGES.core.dir, "src/styles");
  const system = await __unstable__loadDesignSystem(
    ['@import "tailwindcss/theme.css";', `@import "${join(tokens, "tailwind.css")}";`].join("\n"),
    { base: here },
  );
  // Only the candidates that are utilities: a word of a string is a candidate too.
  const css = system.candidatesToCss(candidates);
  const used = candidates.filter((_, index) => css[index] !== null).sort();
  const components: string[] = [];
  for (const line of (await readFile(join(styles, "components.css"), "utf8")).split("\n")) {
    const path = line.match(/^@import "(.+)";$/)?.[1];
    if (path) components.push(await body(join(styles, path)));
  }
  return [
    `/* The ${PACKAGES[framework].name} stylesheet for an app that compiles it with Tailwind CSS 4.1`,
    "   or later. Import it before Tailwind:",
    "",
    `     @import "${PACKAGES[framework].name}/tailwind.css";`,
    '     @import "tailwindcss";',
    "",
    "   The library's layer sits between Tailwind's base and components, as its components do in",
    "   a scaffolded app, so the app's components and utilities win over it. */",
    "@layer theme, base, acme, components, utilities;",
    "@layer acme.theme, acme.base, acme.components;",
    "",
    await body(join(tokens, "tailwind.css")),
    "@layer acme.theme {",
    await body(join(tokens, "theme.css")),
    "}",
    "",
    "@layer acme {",
    await body(join(here, "styles/base.css")),
    ...components,
    "}",
    "",
    `@source inline(${JSON.stringify(used.join(" "))});`,
    "",
  ].join("\n");
}

// ----------------------------------------------------------------------------- packages

type Manifest = {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

/** A dependency's version as published: the catalog's, or the release's for a workspace one. */
function published(
  version: string,
  name: string,
  versions: Record<string, string>,
  release: string,
) {
  if (version.startsWith("workspace:")) return release;
  if (version === "catalog:") {
    const pinned = versions[name];
    if (!pinned) throw new Error(`the catalog has no ${name}`);
    return pinned;
  }
  return version;
}

/** A framework is a peer: the app has its own, at a version in this range. */
function peerRange(version: string) {
  return version.startsWith("^") || version.startsWith("~") ? version : `^${version}`;
}

async function manifest(
  key: PackageKey,
  release: string,
  versions: Record<string, string>,
  exports: Record<string, unknown>,
  files: string[],
) {
  const source = await readJson<Manifest>(join(root, PACKAGES[key].dir, "package.json"));
  const dependencies = Object.fromEntries(
    Object.entries(source.dependencies ?? {}).map(([name, version]) => [
      Object.values(PACKAGES).find(({ from }) => from === name)?.name ?? name,
      published(version, name, versions, release),
    ]),
  );
  // The finished stylesheet needs no Tailwind, and the unbuilt one says which it needs.
  const peers = Object.fromEntries(
    Object.entries(source.peerDependencies ?? {})
      .filter(([name]) => name !== "tailwindcss")
      .map(([name, version]) => [name, peerRange(published(version, name, versions, release))]),
  );
  return {
    name: PACKAGES[key].name,
    version: release,
    description: DESCRIPTIONS[key],
    keywords: [
      "design-system",
      "design-tokens",
      "components",
      ...(key in { react: 1, solid: 1, vue: 1, svelte: 1 } ? [key] : []),
    ],
    license: PACKAGE_METADATA.license,
    homepage: "https://github.com/kjmin-dev/xds/blob/main/docs/library.md",
    bugs: PACKAGE_METADATA.bugs,
    repository: { ...PACKAGE_METADATA.repository, directory: PACKAGES[key].dir },
    type: "module",
    sideEffects: ["*.css"],
    exports: { ...exports, "./package.json": "./package.json" },
    files,
    ...(Object.keys(dependencies).length > 0 ? { dependencies } : {}),
    ...(Object.keys(peers).length > 0 ? { peerDependencies: peers } : {}),
  };
}

const typed = (types: string, js: string) => ({ types, default: js });

function exportsOf(key: PackageKey): Record<string, unknown> {
  switch (key) {
    case "tokens":
      return {
        ".": typed("./dist/index.d.ts", "./dist/index.js"),
        "./theme.css": "./theme.css",
        "./tailwind.css": "./tailwind.css",
        "./themes/*.css": "./themes/*.css",
      };
    case "core":
      return {
        ".": typed("./dist/index.d.ts", "./dist/index.js"),
        "./preview": typed("./dist/preview/index.d.ts", "./dist/preview/index.js"),
      };
    case "react":
      return {
        ".": typed("./dist/index.d.ts", "./dist/index.js"),
        "./preview": typed("./dist/preview.d.ts", "./dist/preview.js"),
        ...STYLESHEETS,
      };
    case "solid":
      return {
        ".": {
          types: "./dist/source/index.d.ts",
          solid: "./dist/source/index.jsx",
          default: "./dist/dom/index.js",
        },
        "./preview": {
          types: "./dist/source/preview.d.ts",
          solid: "./dist/source/preview.jsx",
          default: "./dist/dom/preview.js",
        },
        ...STYLESHEETS,
      };
    case "vue":
      return {
        ".": typed("./dist/index.d.ts", "./dist/index.js"),
        "./preview": typed("./dist/preview.d.ts", "./dist/preview.js"),
        ...STYLESHEETS,
      };
    case "svelte":
      return {
        ".": { types: "./dist/index.d.ts", svelte: "./dist/index.js", default: "./dist/index.js" },
        "./preview": {
          types: "./dist/preview/index.d.ts",
          svelte: "./dist/preview/index.js",
          default: "./dist/preview/index.js",
        },
        ...STYLESHEETS,
      };
  }
}

const STYLESHEETS = {
  "./styles.css": "./styles.css",
  "./tailwind.css": "./tailwind.css",
  "./page.css": "./page.css",
};

function readme(key: PackageKey): string {
  const name = PACKAGES[key].name;
  const docs = "https://github.com/kjmin-dev/xds/blob/main/docs/library.md";
  if (key === "core") {
    return `# ${name}\n\nWhat the xds web component libraries share. Install the package for your framework instead: \`@xds/react\`, \`@xds/solid\`, \`@xds/vue\` or \`@xds/svelte\`.\n\nSee [xds as a library](${docs}).\n`;
  }
  if (key === "tokens") {
    return [
      `# ${name}`,
      "",
      "The design tokens of xds: CSS custom properties, the same values as TypeScript constants, and the preset themes.",
      "",
      "The framework packages already include the default theme. Install this package to apply another preset to the page or to part of it:",
      "",
      "```css",
      '@import "@xds/tokens/themes/ocean.css";',
      "```",
      "",
      "```html",
      '<html data-xds-theme="ocean">',
      "```",
      "",
      `See [xds as a library](${docs}).`,
      "",
    ].join("\n");
  }
  const component = { react: "<Button>", solid: "<Button>", vue: "<Button>", svelte: "<Button>" }[
    key
  ];
  return [
    `# ${name}`,
    "",
    `The components of the xds design system for ${key[0]?.toUpperCase()}${key.slice(1)}, with the look of an app made with \`xds create\`.`,
    "",
    "```sh",
    `npm install ${name}`,
    "```",
    "",
    "Import the stylesheet once, then use the components:",
    "",
    "```js",
    `import "${name}/styles.css";`,
    `import { Button } from "${name}";`,
    "```",
    "",
    `\`${component}\` and every other component take the app's class and style on their root element, which also carries a stable class such as \`xds-button\`. The \`Defaults\` component sets what the components inside it take when the app passes no variant, size or tone.`,
    "",
    `The stylesheet keeps to the \`xds\` cascade layer and to the library's own elements, so the app's styles win. \`${name}/page.css\` gives the page the library's background, text color and font. An app with Tailwind CSS 4.1 or later can import \`${name}/tailwind.css\` before Tailwind instead of \`styles.css\`.`,
    "",
    `This channel is a preview while its behavior library, Zag.js 2, is a prerelease. See [xds as a library](${docs}) for modes, themes and the rest of the customization.`,
    "",
  ].join("\n");
}

// ----------------------------------------------------------------------------- main

async function exists(path: string) {
  return stat(path).then(
    () => true,
    () => false,
  );
}

const release = await releaseVersion(root);
const versions = await catalog();
await rm(out, { recursive: true, force: true });
await mkdir(work, { recursive: true });

const built: PackageKey[] = [];
for (const key of Object.keys(PACKAGES) as PackageKey[]) {
  const target = join(out, key);
  const dist = join(target, "dist");
  await buildJavaScript(key, dist);
  const extra: string[] = [];
  if (key === "tokens") {
    const generated = join(root, PACKAGES.tokens.dir, "src/generated");
    await copyFile(join(generated, "theme.css"), join(target, "theme.css"));
    await copyFile(join(generated, "tailwind.css"), join(target, "tailwind.css"));
    await mkdir(join(target, "themes"), { recursive: true });
    for (const { name } of await listThemes(root)) {
      const model = await loadModel(
        join(root, "design/tokens"),
        join(root, "design/themes", `${name}.json`),
      );
      const css = emitThemeCss(model, { name, source: `the ${name} preset`, layer: "acme.theme" });
      await writeFile(join(target, "themes", `${name}.css`), css);
    }
    extra.push("theme.css", "tailwind.css", "themes");
  }
  if ((FRAMEWORKS as string[]).includes(key)) {
    const framework = key as Framework;
    const sources = [join(out, "core/dist"), dist];
    const candidates = scan(sources);
    await writeFile(join(target, "styles.css"), await finishedStylesheet(framework, sources));
    await writeFile(join(target, "tailwind.css"), await unbuiltStylesheet(framework, candidates));
    const page = await readFile(join(root, PACKAGES.core.dir, "src/styles/page.css"), "utf8");
    await writeFile(
      join(target, "page.css"),
      `${page.replace(/^(\/\*[\s\S]*?\*\/\s*)/, "$1@layer acme.base {\n")}}\n`,
    );
    extra.push("styles.css", "tailwind.css", "page.css");
  }
  await writeJson(
    join(target, "package.json"),
    await manifest(key, release, versions, exportsOf(key), ["dist", ...extra]),
  );
  await writeFile(join(target, "README.md"), readme(key));
  await copyFile(join(root, "LICENSE"), join(target, "LICENSE"));
  built.push(key);
}

await rm(work, { recursive: true, force: true });
for (const key of built) await renameTree(join(out, key));

// Nothing of the placeholder may reach a published file.
const left: string[] = [];
for (const key of built) {
  for (const file of await files(join(out, key))) {
    if (!TEXT.has(extname(file))) continue;
    if (/acme/i.test(await readFile(file, "utf8"))) left.push(relative(out, file));
  }
}
if (left.length > 0) {
  console.error(`The placeholder name is left in:\n  ${left.join("\n  ")}`);
  process.exit(1);
}
if (!(await exists(join(out, "react/styles.css")))) process.exit(1);

console.log(`xds ${release} web packages in ${out}`);
for (const key of built) console.log(`  ${PACKAGES[key].name}`);
