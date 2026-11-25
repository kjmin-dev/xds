// Publishes the GPUI library's crates to crates.io for a release, or rehearses it:
//
//   node crates-io/publish.ts [--dry-run]
//
// It publishes the `.crate` files that build.ts wrote to crates-io/dist and the consumer check
// consumed. cargo cannot upload a file it did not package itself, so cargo packages the crates
// again from the same project, and this fails unless what it makes is byte for byte what was
// checked. The crates go out in dependency order, xds-tokens before xds-ui, and cargo waits until
// crates.io serves each before publishing the next. A version crates.io already has is skipped,
// so a rerun after a partial failure publishes the rest. crates.io keeps every version it
// publishes: one can be yanked, never replaced.
//
// CARGO_REGISTRY_TOKEN authenticates: an API token of an owner of the crates, scoped to
// publish-new and publish-update. With --dry-run nothing is published: cargo packages the crates
// and goes up to the upload, and crates.io must accept the token for each crate. The rehearsal
// fails when it is missing or refused, after cargo has packaged every crate.

import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { root, run } from "../maven/build.ts";
import { releaseVersion } from "../npm/release-version.ts";
import { CRATES, cargo } from "./build.ts";

const API = "https://crates.io/api/v1";
// crates.io asks automated clients to name themselves.
const USER_AGENT = "xds-release (https://github.com/kjmin-dev/xds)";

const { values } = parseArgs({ options: { "dry-run": { type: "boolean", default: false } } });
const dryRun = values["dry-run"];
const version = await releaseVersion(root);
const dist = join(root, "crates-io/dist");
// build.ts packages the crates from this project, and leaves it there.
const project = join(dist, ".work/project");

// GitHub Actions gives a secret that is not set as an empty variable.
const token = process.env.CARGO_REGISTRY_TOKEN || undefined;
// cargo reads the token from the environment, and an empty one is not the same as none.
if (!token) delete process.env.CARGO_REGISTRY_TOKEN;
if (!token && !dryRun) {
  throw new Error("Set CARGO_REGISTRY_TOKEN to a crates.io token that may publish the crates.");
}

/** Whether crates.io has this version of the crate, as cargo reads it: from the sparse index. */
async function published(name: string): Promise<boolean> {
  const response = await fetch(
    `https://index.crates.io/${name.slice(0, 2)}/${name.slice(2, 4)}/${name}`,
    { headers: { "User-Agent": USER_AGENT } },
  );
  if (response.status === 404) return false;
  if (!response.ok) throw new Error(`crates.io's index failed for ${name} (${response.status})`);
  return (await response.text())
    .split("\n")
    .filter(Boolean)
    .some((line) => (JSON.parse(line) as { vers: string }).vers === version);
}

/**
 * What crates.io answers a publication of this crate whose crate file is empty. It reads the
 * crate's name and version, then checks the token and its scopes for that crate, and only then
 * reads the crate file: so the answer shows whether the token may publish the crate, and an
 * empty file can never be published.
 */
async function tryPublishing(name: string, authorization?: string) {
  const metadata = Buffer.from(
    JSON.stringify({
      name,
      vers: version,
      deps: [],
      features: {},
      authors: [],
      description: "",
      license: "MIT",
      keywords: [],
      categories: [],
      badges: {},
      links: null,
    }),
  );
  const length = (n: number) => {
    const bytes = Buffer.alloc(4);
    bytes.writeUInt32LE(n);
    return bytes;
  };
  const response = await fetch(`${API}/crates/new`, {
    method: "PUT",
    headers: {
      "User-Agent": USER_AGENT,
      ...(authorization ? { Authorization: authorization } : {}),
    },
    body: Buffer.concat([length(metadata.length), metadata, length(0)]),
  });
  const detail = ((await response.json()) as { errors?: { detail: string }[] }).errors
    ?.map((error) => error.detail)
    .join("; ");
  return { status: response.status, detail: detail ?? "" };
}

/** Why crates.io would refuse to let the token publish the crate, or nothing if it would not. */
async function refusal(name: string, token: string): Promise<string | undefined> {
  // Without a token, crates.io must refuse for want of one: anything else means it did not get
  // as far as the token, and the answer with it would show nothing.
  const anonymous = await tryPublishing(name);
  if (anonymous.status !== 403) {
    throw new Error(
      `crates.io no longer checks the token first (${anonymous.status}: ${anonymous.detail}): change how publish.ts tries it`,
    );
  }
  const answer = await tryPublishing(name, token);
  if (answer.status === 401 || answer.status === 403) {
    return `crates.io does not let CARGO_REGISTRY_TOKEN publish ${name}: ${answer.detail}`;
  }
  console.log(
    `crates.io lets CARGO_REGISTRY_TOKEN publish ${name}, and refused only the empty crate file (${answer.status}: ${answer.detail}).`,
  );
  return undefined;
}

const sha256 = async (file: string) =>
  createHash("sha256")
    .update(await readFile(file))
    .digest("hex");

const pending: string[] = [];
for (const name of CRATES) {
  if (await published(name))
    console.log(`${name} ${version} is already on crates.io, so a release skips it.`);
  else pending.push(name);
}
if (pending.length === 0) process.exit(0);

const { command, env } = cargo();
const packages = pending.flatMap((name) => ["--package", name]);

// cargo packages the crates again, without building them, apart from its own target directory:
// the files must be the ones the consumer check consumed.
const again = await mkdtemp(join(tmpdir(), "xds-crates-io-publish-"));
try {
  run(command, ["package", "--no-verify", ...packages], project, {
    ...env,
    CARGO_TARGET_DIR: again,
  });
  for (const name of pending) {
    const file = `${name}-${version}.crate`;
    if ((await sha256(join(again, "package", file))) !== (await sha256(join(dist, file)))) {
      throw new Error(`cargo packages ${file} differently from the one checked: build it again`);
    }
  }
} finally {
  await rm(again, { recursive: true, force: true });
}

const problems: string[] = [];
if (dryRun && !token) {
  problems.push("CARGO_REGISTRY_TOKEN is not set, so crates.io would refuse to publish.");
} else if (dryRun && token) {
  for (const name of pending) {
    const problem = await refusal(name, token);
    if (problem) problems.push(problem);
  }
}

// build.ts built each crate from its packaged sources, so cargo does not build them again.
const publish = ["publish", "--no-verify", ...packages];
if (dryRun) publish.push("--dry-run");
run(command, publish, project, env);

if (problems.length > 0) {
  console.error(
    `The crates were packaged, but publishing them would fail:\n${problems.join("\n")}`,
  );
  process.exit(1);
}
if (dryRun) console.log(`Rehearsed: a release would publish ${pending.join(" and ")} ${version}.`);
