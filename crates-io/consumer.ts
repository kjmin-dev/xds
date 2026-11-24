// The GPUI library's external consumer check: what must pass before the crates join a release
// (docs/library.md, L4).
//
//   node crates-io/consumer.ts [--skip-build] [--xds <binary>]
//
// It builds the crates with build.ts, then consumes them from a new crate outside this
// repository, which has nothing of xds's but its dependency on `xds-ui` at the release version,
// served from the packaged crates in place of crates.io's ([patch.crates-io]), and on the GPUI Kit
// that `xds-ui` is built for. The crate draws every page and overlay of the design preview off
// screen with the program a scaffolded project runs as
// `cargo run --package <name>-ui --example render_preview`, and each picture is compared, pixel
// for pixel, with the scaffolded project's: the project that `xds create` makes from this
// repository under the name `xds`, as the library is named, in both color modes. Once with the
// default theme, and once with a custom theme (npm/web/consumer/brand.json, which the web
// library's check uses too): the library's crate registers it with the constant
// `xds export-theme --format gpui` writes, and the scaffolded project draws it with its token
// build.
//
// GPUI draws with Metal, so the check runs on macOS. `--xds <binary>` names the CLI to scaffold
// and export with; by default it is built from this repository.

import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { run, xdsBinary } from "../maven/build.ts";
import { decodePng, differingPixels } from "../maven/png.ts";
import { releaseVersion } from "../npm/release-version.ts";
import { emitRust } from "../tools/design-build/src/emit.ts";
import { loadIcons } from "../tools/design-build/src/icons.ts";
import { readContract, themeModel } from "../tools/design-build/src/theme-contract.ts";
import { CRATES, type Crate, buildCrates, cargo, gpuiKit, scaffold } from "./build.ts";

type Theme = "default" | "brand";
const THEMES: Theme[] = ["default", "brand"];

const { values: options } = parseArgs({
  options: {
    "skip-build": { type: "boolean", default: false },
    xds: { type: "string" },
  },
});
const root = join(import.meta.dirname, "..");
const work = join(tmpdir(), "xds-crates-io-consumer");
const out = join(tmpdir(), "xds-crates-io-consumer-compare");
const dist = join(root, "crates-io/dist");
const themeFile = join(root, "npm/web/consumer/brand.json");
const RENDERER = "crates/xds-ui/examples/render_preview.rs";

// ----------------------------------------------------------------------------- the consumer

/**
 * The consumer's program: the scaffold's renderer, which reaches the tokens through `xds-ui`,
 * and registers the custom theme when XDS_CONSUMER_THEME asks for it.
 */
function consumerProgram(renderer: string): string {
  const init = "xds_ui::init(cx);";
  if (renderer.split(init).length !== 2 || !renderer.includes("xds_tokens::")) {
    throw new Error(
      `${RENDERER} sets up the components in a way this check does not know how to give a theme to`,
    );
  }
  return `mod brand;\n\n${renderer.replaceAll("xds_tokens::", "xds_ui::tokens::").replace(
    init,
    `${init}
        if std::env::var("XDS_CONSUMER_THEME").as_deref() == Ok("brand") {
            xds_ui::set_theme(&brand::BRAND_THEME, cx);
        }`,
  )}`;
}

/**
 * A crate outside the repository with the scaffold's renderer as its program. It takes the
 * scaffold's profile, under which GPUI is optimized in a development build, and its Cargo.lock,
 * so both sides draw with the same GPUI.
 */
async function consumerCrate(
  xds: string,
  reference: string,
  crates: Record<Crate, string>,
  version: string,
) {
  const dir = join(work, "consumer");
  await rm(dir, { recursive: true, force: true });
  await mkdir(join(dir, "src"), { recursive: true });
  const workspace = await readFile(join(reference, "Cargo.toml"), "utf8");
  const profiles = [
    ...workspace.matchAll(/^\[profile\.dev\.package\.[^\]]+\]\nopt-level = \d+\n/gm),
  ]
    .map((match) => match[0])
    .join("\n");
  if (!profiles) throw new Error("Cargo.toml of the scaffold no longer optimizes GPUI");
  const ui = await readFile(join(reference, "crates/xds-ui/Cargo.toml"), "utf8");
  const image = ui.match(/^image = .*$/m)?.[0];
  if (!image) throw new Error("the renderer no longer writes its pictures with the image crate");
  await writeFile(
    join(dir, "Cargo.toml"),
    `[package]
name = "xds-consumer"
version = "0.0.0"
edition = "2024"
publish = false

[dependencies]
xds-ui = "=${version}"
# The GPUI Kit xds-ui is built for, with what draws off screen.
gpui-kit = { version = "${await gpuiKit()}", features = ["test-support"] }
${image}

# The crates as build.ts packaged them, in place of crates.io's.
[patch.crates-io]
${CRATES.map((name) => `${name} = { path = "${crates[name]}" }`).join("\n")}

${profiles}`,
  );
  await writeFile(join(dir, "Cargo.lock"), await readFile(join(reference, "Cargo.lock"), "utf8"));
  await writeFile(
    join(dir, "src/main.rs"),
    consumerProgram(await readFile(join(reference, RENDERER), "utf8")),
  );
  // Run outside any project, so it is written for the published library's types.
  run(
    xds,
    [
      "export-theme",
      themeFile,
      "--name",
      "brand",
      "--format",
      "gpui",
      "--out",
      join(dir, "src/brand.rs"),
    ],
    work,
  );
  return dir;
}

// ----------------------------------------------------------------------------- comparing

let differences = 0;

async function pictures(dir: string): Promise<Map<string, Buffer>> {
  const found = new Map<string, Buffer>();
  for (const name of (await readdir(dir)).filter((file) => file.endsWith(".png")).sort()) {
    found.set(name, await readFile(join(dir, name)));
  }
  return found;
}

/** Compares two sets of pictures by name; a picture that differs is kept, both sides of it. */
async function compare(
  label: string,
  scaffolded: Map<string, Buffer>,
  library: Map<string, Buffer>,
) {
  const where = join(out, label.replaceAll(/\W+/g, "-"));
  let differ = 0;
  for (const [name, picture] of scaffolded) {
    const other = library.get(name);
    if (other?.equals(picture)) continue;
    // The same pixels may be encoded differently; only the pixels count.
    const pixels = other && differingPixels(decodePng(picture), decodePng(other));
    if (pixels === 0) continue;
    differ++;
    await mkdir(where, { recursive: true });
    await writeFile(join(where, `scaffold-${name}`), picture);
    if (other) await writeFile(join(where, `library-${name}`), other);
    const how = !other
      ? "is missing"
      : pixels === undefined
        ? "differs in size"
        : `differs in ${pixels} pixels`;
    console.log(`  ${label}: ${name} ${how}`);
  }
  for (const name of library.keys()) {
    if (!scaffolded.has(name)) {
      differ++;
      console.log(`  ${label}: ${name} is drawn by the library only`);
    }
  }
  differences += differ;
  console.log(`${label}: ${scaffolded.size} pictures compared, ${differ} differ`);
}

/**
 * Fails the run when the custom theme changed none of the library's pictures: the comparison
 * would then show only that both sides ignore it.
 */
function checkThemed(drawn: Map<Theme, Map<string, Buffer>>) {
  const plain = drawn.get("default") ?? new Map<string, Buffer>();
  const branded = drawn.get("brand") ?? new Map<string, Buffer>();
  const same = [...plain].filter(([name, picture]) => branded.get(name)?.equals(picture));
  console.log(`the custom theme changes ${plain.size - same.length} of ${plain.size} pictures`);
  if (same.length === plain.size) {
    differences++;
    console.log("  the custom theme changed nothing");
  }
}

// ----------------------------------------------------------------------------- the run

if (process.platform !== "darwin") {
  throw new Error("GPUI draws the design preview with Metal: run this check on macOS.");
}
const version = await releaseVersion(root);
const xds = xdsBinary(options.xds);
const crates = options["skip-build"]
  ? (Object.fromEntries(
      CRATES.map((name) => [name, join(dist, "unpacked", `${name}-${version}`)]),
    ) as Record<Crate, string>)
  : await buildCrates(dist, xds);
await rm(work, { recursive: true, force: true });
await rm(out, { recursive: true, force: true });
await mkdir(work, { recursive: true });
const { command, env } = cargo();

// The scaffolded project, named as the library is, and the custom theme as its token build
// writes it.
const reference = join(work, "scaffold");
await scaffold(xds, reference);
const tokensFile = join(reference, "crates/xds-tokens/src/generated.rs");
const defaultTokens = await readFile(tokensFile, "utf8");
const contract = await readContract(reference);
const brandModel = await themeModel(
  reference,
  JSON.parse(await readFile(themeFile, "utf8")),
  contract,
);
brandModel.icons = await loadIcons(join(reference, "design/icons"));
const brandTokens = emitRust(brandModel);

const consumer = await consumerCrate(xds, reference, crates, version);
const drawn = new Map<Theme, Map<string, Buffer>>();
for (const theme of THEMES) {
  const scaffolded = join(work, `scaffold-${theme}`);
  await writeFile(tokensFile, theme === "brand" ? brandTokens : defaultTokens);
  run(
    command,
    ["run", "--package", "xds-ui", "--example", "render_preview", "--", scaffolded],
    reference,
    env,
  );
  const library = join(work, `library-${theme}`);
  run(command, ["run", "--", library], consumer, { ...env, XDS_CONSUMER_THEME: theme });
  const drawnByLibrary = await pictures(library);
  drawn.set(theme, drawnByLibrary);
  await compare(`${theme} theme`, await pictures(scaffolded), drawnByLibrary);
}
checkThemed(drawn);

if (differences > 0) {
  console.error(`The library differs from the scaffold; both sides are in ${out}`);
  process.exit(1);
}
console.log("The GPUI library draws the design preview as the scaffolded project does.");
