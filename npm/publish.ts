// Publishes one channel's npm packages for a release, or rehearses it:
//
//   node npm/publish.ts <web|react-native> [--dry-run]
//
// Every package is under the @xds scope: nothing of xds is published under a name of its own.
// The packages are the ones the channel's build wrote under npm/dist, and they go out in
// dependency order, under the channel's dist-tag; a prerelease version goes out under `next`.
// A version npm already has is skipped, so a rerun after a partial failure publishes the rest.
//
// NPM_TOKEN authenticates, through a configuration file of this run's own, so a run on a
// developer's machine never reads or changes their npm configuration. With --dry-run nothing is
// published: npm packs each package as it would publish it, and the token must be one npm
// accepts. The rehearsal fails when it is missing or refused, after it has packed every package.

import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { releaseVersion } from "./release-version.ts";

const root = resolve(import.meta.dirname, "..");
const dist = join(root, "npm/dist");
const REGISTRY = "https://registry.npmjs.org/";

type Channel = { tag: string; packages: () => Promise<string[]> };

const CHANNELS: Record<string, Channel> = {
  // A preview channel while its behavior library, Zag.js 2, is a prerelease (docs/library.md,
  // "Stability levels"). The tokens, then what the frameworks share, then the frameworks.
  web: {
    tag: "preview",
    packages: async () =>
      ["tokens", "core", "react", "solid", "vue", "svelte"].map((name) => join(dist, "web", name)),
  },
  // A preview channel while React Native is 0.x.
  "react-native": {
    tag: "preview",
    packages: async () => [join(dist, "react-native/package")],
  },
};

const { values, positionals } = parseArgs({
  options: { "dry-run": { type: "boolean", default: false } },
  allowPositionals: true,
});
const channel = CHANNELS[positionals[0] ?? ""];
if (!channel || positionals.length !== 1) {
  console.error(`Usage: node npm/publish.ts <${Object.keys(CHANNELS).join("|")}> [--dry-run]`);
  process.exit(1);
}
const dryRun = values["dry-run"];
const version = await releaseVersion(root);
const tag = version.includes("-") ? "next" : channel.tag;

// GitHub Actions gives a secret that is not set as an empty variable.
const token = process.env.NPM_TOKEN || undefined;
if (!token && !dryRun) throw new Error("Set NPM_TOKEN to a token that may publish the packages.");

const work = await mkdtemp(join(tmpdir(), "xds-npm-publish-"));
const userconfig = join(work, "npmrc");
// The file names the variable, so the token itself is never written to disk. npm fails on a
// variable it cannot find, so without a token the line is left out.
// oxlint-disable-next-line eslint/no-template-curly-in-string -- npm reads ${NPM_TOKEN}, not JS
const auth = "//registry.npmjs.org/:_authToken=${NPM_TOKEN}\n";
await writeFile(userconfig, `registry=${REGISTRY}\n${token ? auth : ""}`);
const env = { ...process.env, npm_config_userconfig: userconfig };

/** Runs npm outside the repository, so that no project configuration applies. */
function npm(args: string[], output: "pipe" | "inherit" = "pipe") {
  const result = spawnSync("npm", [...args, "--registry", REGISTRY], {
    cwd: work,
    env,
    encoding: "utf8",
    stdio: ["ignore", output, output],
  });
  if (result.error) throw result.error;
  return result;
}

/** Whether npm has this version of the package: a missing package or version is a 404. */
function published(name: string, version: string): boolean {
  const result = npm(["view", `${name}@${version}`, "version"]);
  if (result.status === 0) return result.stdout.trim() === version;
  if (/\bE404\b/.test(result.stderr)) return false;
  throw new Error(`npm could not look up ${name}@${version}:\n${result.stderr.trim()}`);
}

const problems: string[] = [];
try {
  if (dryRun) {
    if (!token) {
      problems.push("NPM_TOKEN is not set, so npm would refuse to publish.");
    } else {
      const whoami = npm(["whoami"]);
      if (whoami.status === 0)
        console.log(`npm accepts NPM_TOKEN, a token of ${whoami.stdout.trim()}.`);
      else problems.push(`npm does not accept NPM_TOKEN:\n${whoami.stderr.trim()}`);
    }
  }

  for (const dir of await channel.packages()) {
    const manifest = JSON.parse(await readFile(join(dir, "package.json"), "utf8")) as {
      name: string;
      version: string;
    };
    // Every package of a release carries the crate's version: another one is a stale build.
    if (manifest.version !== version) {
      throw new Error(
        `${dir} is ${manifest.name}@${manifest.version}, not ${version}: build it again`,
      );
    }
    if (published(manifest.name, version)) {
      console.log(`${manifest.name}@${version} is already published, so a release skips it.`);
      continue;
    }
    const args = ["publish", dir, "--access", "public", "--tag", tag];
    if (dryRun) args.push("--dry-run");
    if (npm(args, "inherit").status !== 0) {
      throw new Error(`npm publish ${dryRun ? "--dry-run " : ""}failed for ${manifest.name}`);
    }
  }
} finally {
  await rm(work, { recursive: true, force: true });
}

if (problems.length > 0) {
  console.error(
    `The packages were packed, but publishing them would fail:\n${problems.join("\n")}`,
  );
  process.exit(1);
}
if (dryRun)
  console.log(`Rehearsed: a release would publish these packages under the \`${tag}\` tag.`);
