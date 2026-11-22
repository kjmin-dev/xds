// Sends the repository build.ts wrote to Maven Central, through the Central Portal's Publisher
// API (https://central.sonatype.org/publish/publish-portal-api/):
//
//   node maven/upload.ts [--repository <dir>]
//
// It needs MAVEN_CENTRAL_USERNAME and MAVEN_CENTRAL_PASSWORD, a user token from
// central.sonatype.com, and a repository built with SIGNING_KEY set, since Central takes only
// signed files. The bundle is published automatically once Central has validated it; this waits
// for that and fails if Central rejects it.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { parseArgs } from "node:util";
import { releaseVersion } from "../npm/release-version.ts";
import { ARTIFACT, GROUP, root } from "./build.ts";

const API = "https://central.sonatype.com/api/v1/publisher";
const { values } = parseArgs({
  options: { repository: { type: "string", default: join(root, "maven/dist/repository") } },
});
const repository = resolve(values.repository);
const version = await releaseVersion(root);

const username = process.env.MAVEN_CENTRAL_USERNAME;
const password = process.env.MAVEN_CENTRAL_PASSWORD;
if (!username || !password) {
  throw new Error(
    "Set MAVEN_CENTRAL_USERNAME and MAVEN_CENTRAL_PASSWORD to a Central Portal user token.",
  );
}
const authorization = `Bearer ${Buffer.from(`${username}:${password}`).toString("base64")}`;

// A rerun after a partial failure skips a release Central already has.
const pom = `https://repo1.maven.org/maven2/${GROUP.replaceAll(".", "/")}/${ARTIFACT}/${version}/${ARTIFACT}-${version}.pom`;
if ((await fetch(pom, { method: "HEAD" })).ok) {
  console.log(`${GROUP}:${ARTIFACT}:${version} is already on Maven Central`);
  process.exit(0);
}

// What Central takes: each version's files, every one signed, with MD5 and SHA-1 checksums.
// Gradle's maven-metadata.xml files describe the directory, not a release, and stay out.
const group = join(repository, ...GROUP.split("."));
const entries = await readdir(group, { withFileTypes: true, recursive: true });
const files = entries
  .filter((entry) => entry.isFile() && !entry.name.startsWith("maven-metadata"))
  .map((entry) => relative(repository, join(entry.parentPath, entry.name)));
const artifacts = files.filter((file) => !/\.(asc|md5|sha1|sha256|sha512)$/.test(file));
const unsigned = artifacts.filter((file) => !files.includes(`${file}.asc`));
if (artifacts.length === 0 || unsigned.length > 0) {
  throw new Error(
    artifacts.length === 0
      ? `${group} holds no artifacts: run maven/build.ts first`
      : `Not signed (build with SIGNING_KEY set):\n  ${unsigned.join("\n  ")}`,
  );
}
if (artifacts.some((file) => !file.includes(`/${version}/`))) {
  throw new Error(`${repository} holds other versions than ${version}: build it again`);
}

const bundle = join(tmpdir(), `xds-ui-${version}.zip`);
await rm(bundle, { force: true });
execFileSync("zip", ["-q", "-X", bundle, ...files], { cwd: repository });

const form = new FormData();
form.append("bundle", new Blob([await readFile(bundle)]), `xds-ui-${version}.zip`);
const upload = await fetch(
  `${API}/upload?name=${encodeURIComponent(`${ARTIFACT} ${version}`)}&publishingType=AUTOMATIC`,
  { method: "POST", headers: { Authorization: authorization }, body: form },
);
const deployment = (await upload.text()).trim();
if (!upload.ok) throw new Error(`Central refused the bundle (${upload.status}): ${deployment}`);
console.log(`Uploaded ${files.length} files as deployment ${deployment}`);

// Central validates the bundle, then publishes it. Publishing can take a while longer than
// validation: once it has begun, the release is accepted and only has to reach the mirrors.
const deadline = Date.now() + 30 * 60_000;
for (;;) {
  const response = await fetch(`${API}/status?id=${deployment}`, {
    method: "POST",
    headers: { Authorization: authorization },
  });
  if (!response.ok)
    throw new Error(`Central's status check failed (${response.status}): ${await response.text()}`);
  const status = (await response.json()) as { deploymentState: string; errors?: unknown };
  if (status.deploymentState === "FAILED") {
    throw new Error(`Central rejected the bundle:\n${JSON.stringify(status.errors, null, 2)}`);
  }
  if (status.deploymentState === "PUBLISHED" || status.deploymentState === "PUBLISHING") {
    console.log(`${GROUP}:${ARTIFACT}:${version}: ${status.deploymentState.toLowerCase()}`);
    break;
  }
  if (Date.now() > deadline) {
    throw new Error(`Deployment ${deployment} is still ${status.deploymentState} after 30 minutes`);
  }
  await sleep(10_000);
}
if (existsSync(bundle)) await rm(bundle);
