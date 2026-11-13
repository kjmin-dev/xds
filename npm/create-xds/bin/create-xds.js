#!/usr/bin/env node
// `npm create xds@latest my-app` runs this with `my-app`. It is `xds create my-app`.

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const launcher = require.resolve("xds-cli/bin/xds.js");
const result = spawnSync(process.execPath, [launcher, "create", ...process.argv.slice(2)], {
  stdio: "inherit",
});
if (result.error) {
  console.error(`create-xds: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
