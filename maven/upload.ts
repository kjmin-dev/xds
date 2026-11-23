// Sends the repository build.ts wrote to Maven Central, through the Central Portal's Publisher
// API (https://central.sonatype.org/publish/publish-portal-api/), or rehearses it:
//
//   node maven/upload.ts [--repository <dir>] [--dry-run]
//
// It needs MAVEN_CENTRAL_USERNAME and MAVEN_CENTRAL_PASSWORD, a user token from
// central.sonatype.com, and a repository built with SIGNING_KEY set, since Central takes only
// signed files. The bundle is published automatically once Central has validated it; this waits
// for that and fails if Central rejects it.
//
// With --dry-run Central validates the bundle as it would before publishing it, and the
// deployment is dropped once it has: the namespace, the signatures against the key servers, the
// POMs and the checksums are checked, and nothing is published.

import { execFileSync } from "node:child_process";
import { readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { parseArgs } from "node:util";
import { releaseVersion } from "../npm/release-version.ts";
import { ARTIFACT, GROUP, root } from "./build.ts";

const API = "https://central.sonatype.com/api/v1/publisher";
const { values } = parseArgs({
  options: {
    repository: { type: "string", default: join(root, "maven/dist/repository") },
    "dry-run": { type: "boolean", default: false },
  },
});
const repository = resolve(values.repository);
const dryRun = values["dry-run"];
const version = await releaseVersion(root);

// A rerun after a partial failure skips a release Central already has, and so does a rehearsal.
const pom = `https://repo1.maven.org/maven2/${GROUP.replaceAll(".", "/")}/${ARTIFACT}/${version}/${ARTIFACT}-${version}.pom`;
if ((await fetch(pom, { method: "HEAD" })).ok) {
  console.log(`${GROUP}:${ARTIFACT}:${version} is already on Maven Central`);
  process.exit(0);
}

// Everything that would stop the upload, reported together, so that one run lists every secret
// a release still lacks. GitHub Actions gives a secret that is not set as an empty variable.
const problems: string[] = [];
const username = process.env.MAVEN_CENTRAL_USERNAME;
const password = process.env.MAVEN_CENTRAL_PASSWORD;
if (!username || !password) {
  problems.push(
    "MAVEN_CENTRAL_USERNAME and MAVEN_CENTRAL_PASSWORD are not set: they are a user token from central.sonatype.com.",
  );
}

// What Central takes: each version's files, every one signed, with MD5 and SHA-1 checksums.
// Gradle's maven-metadata.xml files describe the directory, not a release, and stay out.
const group = join(repository, ...GROUP.split("."));
const entries = await readdir(group, { withFileTypes: true, recursive: true }).catch(() => []);
const files = entries
  .filter((entry) => entry.isFile() && !entry.name.startsWith("maven-metadata"))
  .map((entry) => relative(repository, join(entry.parentPath, entry.name)));
const artifacts = files.filter((file) => !/\.(asc|md5|sha1|sha256|sha512)$/.test(file));
const unsigned = artifacts.filter((file) => !files.includes(`${file}.asc`));
if (artifacts.length === 0) {
  problems.push(`${group} holds no artifacts: run maven/build.ts first.`);
} else if (unsigned.length > 0) {
  problems.push(
    `${unsigned.length} of ${artifacts.length} files are not signed: build with SIGNING_KEY and SIGNING_PASSWORD set.`,
  );
}
if (artifacts.some((file) => !file.includes(`/${version}/`))) {
  problems.push(`${repository} holds other versions than ${version}: build it again.`);
}
if (problems.length > 0) {
  throw new Error(`Maven Central would not take the library:\n  ${problems.join("\n  ")}`);
}
const authorization = `Bearer ${Buffer.from(`${username}:${password}`).toString("base64")}`;

const bundle = join(tmpdir(), `xds-ui-${version}.zip`);
await rm(bundle, { force: true });
execFileSync("zip", ["-q", "-X", bundle, ...files], { cwd: repository });

// A rehearsal's deployment waits for someone to publish it, which nobody does: it is dropped.
const publishingType = dryRun ? "USER_MANAGED" : "AUTOMATIC";
const name = `${ARTIFACT} ${version}${dryRun ? " (rehearsal)" : ""}`;
const form = new FormData();
form.append("bundle", new Blob([await readFile(bundle)]), `xds-ui-${version}.zip`);
const upload = await fetch(
  `${API}/upload?name=${encodeURIComponent(name)}&publishingType=${publishingType}`,
  { method: "POST", headers: { Authorization: authorization }, body: form },
);
await rm(bundle, { force: true });
const deployment = (await upload.text()).trim();
if (!upload.ok) throw new Error(`Central refused the bundle (${upload.status}): ${deployment}`);
console.log(`Uploaded ${files.length} files as deployment ${deployment}`);

type Status = { deploymentState: string; errors?: unknown };
async function status(): Promise<Status> {
  const response = await fetch(`${API}/status?id=${deployment}`, {
    method: "POST",
    headers: { Authorization: authorization },
  });
  if (!response.ok) {
    throw new Error(`Central's status check failed (${response.status}): ${await response.text()}`);
  }
  return (await response.json()) as Status;
}

/** Drops the deployment, which Central allows once it is validated or has failed. */
async function drop() {
  const response = await fetch(`${API}/deployment/${deployment}`, {
    method: "DELETE",
    headers: { Authorization: authorization },
  });
  if (!response.ok) {
    throw new Error(
      `Central did not drop deployment ${deployment} (${response.status}): ${await response.text()}. Drop it at https://central.sonatype.com/publishing/deployments so that nobody publishes it.`,
    );
  }
}

// Central validates the bundle, then publishes it. Publishing can take a while longer than
// validation: once it has begun, the release is accepted and only has to reach the mirrors.
const done = dryRun ? ["VALIDATED"] : ["PUBLISHING", "PUBLISHED"];
const deadline = Date.now() + 30 * 60_000;
for (;;) {
  const current = await status();
  if (current.deploymentState === "FAILED") {
    const errors = JSON.stringify(current.errors, null, 2);
    if (dryRun) await drop();
    throw new Error(`Central rejected the bundle:\n${errors}`);
  }
  if (done.includes(current.deploymentState)) {
    if (dryRun) {
      await drop();
      console.log(
        `Central validated ${GROUP}:${ARTIFACT}:${version}, and the rehearsal dropped deployment ${deployment}: nothing was published.`,
      );
    } else {
      console.log(`${GROUP}:${ARTIFACT}:${version}: ${current.deploymentState.toLowerCase()}`);
    }
    break;
  }
  if (Date.now() > deadline) {
    throw new Error(
      `Deployment ${deployment} is still ${current.deploymentState} after 30 minutes${dryRun ? ". Drop it at https://central.sonatype.com/publishing/deployments once Central has validated it" : ""}`,
    );
  }
  await sleep(10_000);
}
