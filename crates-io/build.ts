// Builds the GPUI library's crates, ready for crates.io:
//
//   node crates-io/build.ts [--out <dir>] [--xds <binary>]
//
// `xds-tokens` and `xds-ui`, at the release version, as the `.crate` files `cargo package` makes
// and crates.io takes, and unpacked beside them. They are packaged from a project that
// `xds create` makes from this repository under the name `xds`, so they are renamed from the
// placeholder `acme` exactly as a scaffolded project is, and carry the same code. The library
// adds the preset themes as constants (`xds_tokens::themes::OCEAN_THEME`) and what crates.io
// shows: a description, a README, the license and the repository. `cargo package` builds each
// crate from its packaged sources, as crates.io will serve them. It fails if `acme` is left in a
// packaged file, or if `xds-ui` does not ask for exactly the GPUI Kit that this repository pins
// and docs/gpui-library.md names, since GPUI keeps no compatibility between its releases.
//
// GPUI draws on macOS, the one platform the desktop target is checked on, so the crates are
// built there. publish.ts publishes them.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { root, run, xdsBinary } from "../maven/build.ts";
import { releaseVersion } from "../npm/release-version.ts";
import { emitRustTheme, rustThemeConstant } from "../tools/design-build/src/emit.ts";
import { loadModel } from "../tools/design-build/src/model.ts";
import { listThemes } from "../tools/design-build/src/themes.ts";

/** The crates, in the order a release publishes them: each before the crates that need it. */
export const CRATES = ["xds-tokens", "xds-ui"] as const;
export type Crate = (typeof CRATES)[number];

const REPOSITORY = "https://github.com/kjmin-dev/xds";
const DOCS = `${REPOSITORY}/blob/main/docs/gpui-library.md`;

/** What crates.io shows for each crate. */
const ABOUT: Record<Crate, { description: string; keywords: string[]; readme: string }> = {
  "xds-tokens": {
    description:
      "The design tokens of the xds design system as a Rust value: a Theme, the default theme and the presets.",
    keywords: ["design-system", "design-tokens", "theme", "xds"],
    readme: `# xds-tokens

The design tokens of [xds](${REPOSITORY}) as plain Rust types: a \`Theme\` holds the colors of
both modes, the control sizes and the shared values, \`DEFAULT_THEME\` is the one the token files
describe, and \`themes\` holds the presets. The crate has no dependencies.

The GPUI components in [\`xds-ui\`](https://crates.io/crates/xds-ui) draw with a \`Theme\`, and
re-export this crate as \`xds_ui::tokens\`. See [the GPUI library](${DOCS}).
`,
  },
  "xds-ui": {
    description:
      "The components of the xds design system for GPUI desktop apps, drawn from a theme the app registers.",
    keywords: ["gpui", "design-system", "ui", "components", "xds"],
    readme: `# xds-ui

The components of [xds](${REPOSITORY}) for GPUI desktop apps: the same components, variants and
tokens as its web, React Native, Compose and Flutter libraries, drawn on GPUI and GPUI Component.
An app registers a theme with them, and may register defaults for their options.

\`\`\`rust
gpui_kit::application()
    .with_assets(gpui_kit::assets::Assets)
    .run(|cx| {
        xds_ui::init(cx);
        xds_ui::set_theme(&xds_ui::tokens::themes::OCEAN_THEME, cx);
        // Open a window, and build it from xds_ui::button, xds_ui::text, ...
    });
\`\`\`

GPUI keeps no compatibility between its releases, so each release of this crate is built for
exactly one GPUI Kit. See [the GPUI library](${DOCS}).
`,
  },
};

/**
 * What runs cargo outside this repository: the toolchain this repository pins, called by its
 * path. mise's shims would read the project's own mise.toml, which mise does not trust. All the
 * projects share one target directory, so GPUI is compiled once for all of them.
 */
export function cargo(): { command: string; env: NodeJS.ProcessEnv } {
  const sysroot = execFileSync("rustc", ["--print", "sysroot"], { cwd: root, encoding: "utf8" });
  const bin = join(sysroot.trim(), "bin");
  return {
    command: join(bin, "cargo"),
    env: {
      PATH: `${bin}:${process.env.PATH ?? ""}`,
      RUSTC: join(bin, "rustc"),
      CARGO_TARGET_DIR: join(root, "target/crates-io"),
      CARGO_TERM_COLOR: "always",
    },
  };
}

/**
 * A GPUI project that `xds create` makes from this repository, named as the library. It takes
 * this repository's Cargo.lock, so it is built with the dependencies the repository is checked
 * with; cargo drops what the project does not use.
 */
export async function scaffold(xds: string, directory: string) {
  await rm(directory, { recursive: true, force: true });
  run(xds, ["create", directory, "--name", "xds", "--targets", "desktop-gpui", "--yes"], root);
  const lock = await readFile(join(root, "Cargo.lock"), "utf8");
  await writeFile(join(directory, "Cargo.lock"), lock.replaceAll('"acme-', '"xds-'));
}

/** The GPUI Kit this repository pins, as its workspace manifest writes the requirement. */
export async function gpuiKit(): Promise<string> {
  const manifest = await readFile(join(root, "Cargo.toml"), "utf8");
  const requirement = manifest.match(/^gpui-kit = "(=[^"]+)"$/m)?.[1];
  if (!requirement)
    throw new Error('Cargo.toml no longer pins gpui-kit as `gpui-kit = "=<version>"`');
  return requirement;
}

async function replaceIn(file: string, pairs: [from: string | RegExp, to: string][]) {
  let text = await readFile(file, "utf8");
  for (const [from, to] of pairs) {
    if (typeof from === "string" ? !text.includes(from) : !from.test(text)) {
      throw new Error(`${file} no longer contains ${String(from)}`);
    }
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

/** The presets, as `xds export-theme --format gpui` writes a theme file, in `xds_tokens::themes`. */
async function addPresets(project: string) {
  const directory = join(project, "crates/xds-tokens/src/themes");
  await mkdir(directory, { recursive: true });
  const names = (await listThemes(project)).map((theme) => theme.name);
  for (const name of names) {
    const model = await loadModel(
      join(project, "design/tokens"),
      join(project, "design/themes", `${name}.json`),
    );
    const source = emitRustTheme(model, {
      name,
      source: `${name}.json`,
      tokensPath: "crate",
    }).replace(
      /^\/\/ Generated by xds from .*$/m,
      `// The ${name} preset, generated by crates-io/build.ts from design/themes/${name}.json.`,
    );
    await writeFile(join(directory, `${name.replaceAll("-", "_")}.rs`), source);
  }
  await writeFile(
    join(directory, "mod.rs"),
    [
      "//! The preset themes: what `xds export-theme --format gpui` writes for each theme file the",
      "//! library ships. Register one with the components: `set_theme(&OCEAN_THEME, cx)`.",
      "",
      ...names.map((name) => `mod ${name.replaceAll("-", "_")};`),
      "",
      ...names.map((name) => `pub use ${name.replaceAll("-", "_")}::${rustThemeConstant(name)};`),
      "",
    ].join("\n"),
  );
  await replaceIn(join(project, "crates/xds-tokens/src/lib.rs"), [
    [
      "pub use generated::*;\n",
      "pub use generated::*;\n\n// Generated code is laid out by its generator, not by rustfmt.\n#[rustfmt::skip]\npub mod themes;\n",
    ],
  ]);
}

/**
 * The manifests as crates.io takes them: the release version, the metadata it shows, and an
 * exact requirement from `xds-ui` on the `xds-tokens` of the same release. The examples, the
 * design preview's off-screen renderer among them, and the dev-dependencies they need stay out.
 */
async function prepareManifests(project: string, version: string) {
  await replaceIn(join(project, "Cargo.toml"), [
    [/^version = "[^"]+"$/m, `version = "${version}"`],
    ["publish = false\n", `license = "MIT"\nrepository = "${REPOSITORY}"\nhomepage = "${DOCS}"\n`],
    [
      'xds-tokens = { path = "crates/xds-tokens" }',
      `xds-tokens = { path = "crates/xds-tokens", version = "=${version}" }`,
    ],
  ]);
  // The app beside the crates is not published.
  await replaceIn(join(project, "apps/desktop/Cargo.toml"), [
    ["publish.workspace = true\n", "publish = false\n"],
  ]);
  for (const name of CRATES) {
    const about = ABOUT[name];
    const directory = join(project, "crates", name);
    await writeFile(join(directory, "README.md"), about.readme);
    await replaceIn(join(directory, "Cargo.toml"), [
      [/^description = ".*"$/m, `description = "${about.description}"`],
      [
        "publish.workspace = true\n",
        [
          "license.workspace = true",
          "repository.workspace = true",
          "homepage.workspace = true",
          'readme = "README.md"',
          `keywords = [${about.keywords.map((keyword) => JSON.stringify(keyword)).join(", ")}]`,
          'categories = ["gui"]',
          "",
        ].join("\n"),
      ],
    ]);
    if (existsSync(join(directory, "examples"))) {
      await replaceIn(join(directory, "Cargo.toml"), [
        [
          'readme = "README.md"\n',
          'readme = "README.md"\nexclude = ["examples"]\nautoexamples = false\n',
        ],
      ]);
    }
    const manifest = join(directory, "Cargo.toml");
    const text = await readFile(manifest, "utf8");
    await writeFile(manifest, text.replace(/\[dev-dependencies\]\n[\s\S]*?\n\n(?=\[)/, ""));
  }
}

/** Fails if the placeholder is left in a packaged file. */
async function checkRenamed(directory: string) {
  const left: string[] = [];
  for (const file of await files(directory)) {
    const content = await readFile(file);
    if (["acme", "Acme", "ACME"].some((word) => content.includes(word))) left.push(file);
  }
  if (left.length > 0) {
    throw new Error(`The placeholder name is left in:\n  ${left.join("\n  ")}`);
  }
}

/**
 * Fails unless the packaged `xds-ui` asks for exactly the GPUI Kit this repository pins, and
 * docs/gpui-library.md names that requirement in what it tells an app to write.
 */
async function checkGpuiKit(unpacked: string) {
  const pinned = await gpuiKit();
  const manifest = await readFile(join(unpacked, "Cargo.toml"), "utf8");
  const asked = manifest.match(/^\[dependencies\.gpui-kit\]\nversion = "([^"]+)"$/m)?.[1];
  if (asked !== pinned) {
    throw new Error(`xds-ui asks for gpui-kit ${asked ?? "(nothing)"}, not exactly ${pinned}`);
  }
  const docs = await readFile(join(root, "docs/gpui-library.md"), "utf8");
  if (!docs.includes(`gpui-kit = "${pinned}"`)) {
    throw new Error(`docs/gpui-library.md does not tell an app to write gpui-kit = "${pinned}"`);
  }
}

/**
 * Builds the crates into `out`: `<crate>-<version>.crate` for each, and its contents unpacked in
 * `out/unpacked/<crate>-<version>`. Returns the unpacked directories.
 */
export async function buildCrates(out: string, xds: string): Promise<Record<Crate, string>> {
  if (process.platform !== "darwin") {
    throw new Error("The GPUI crates are built and checked on macOS, where GPUI draws.");
  }
  const version = await releaseVersion(root);
  const project = join(out, ".work/project");
  await scaffold(xds, project);
  await addPresets(project);
  await prepareManifests(project, version);

  const { command, env } = cargo();
  const packages = CRATES.flatMap((name) => ["--package", name]);
  // Each crate is built from its packaged sources, against the other one as packaged.
  run(command, ["package", ...packages], project, env);

  const packaged = join(env.CARGO_TARGET_DIR ?? "", "package");
  const unpacked = join(out, "unpacked");
  await rm(unpacked, { recursive: true, force: true });
  await mkdir(unpacked, { recursive: true });
  const directories = {} as Record<Crate, string>;
  for (const name of CRATES) {
    const file = `${name}-${version}.crate`;
    await copyFile(join(packaged, file), join(out, file));
    execFileSync("tar", ["-xzf", join(out, file), "-C", unpacked]);
    directories[name] = join(unpacked, `${name}-${version}`);
  }
  await checkRenamed(unpacked);
  await checkGpuiKit(directories["xds-ui"]);
  return directories;
}

if (import.meta.main) {
  const { values } = parseArgs({
    options: {
      out: { type: "string", default: join(root, "crates-io/dist") },
      xds: { type: "string" },
    },
  });
  const out = resolve(values.out);
  await mkdir(out, { recursive: true });
  const built = await buildCrates(out, xdsBinary(values.xds));
  console.log(`Built ${Object.keys(built).join(", ")} into ${out}`);
}
