// Compares the design previews of the web apps pixel by pixel: every section at rest and every
// `?open=` overlay, at a desktop and a phone width, in both color modes, in the Google Chrome
// installed on the machine. The apps draw the same data with different libraries, so any
// difference is one library drawing a component differently. Each app is compared with the
// first, and a project with one web app has nothing to compare. Run it with
// `mise run compare:previews`; it starts each app's dev server itself, on any free port, or
// from the port given with `--port <port>` on, one per app.

import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import { capture, compareCaptures, THEMES, WIDTHS } from "./preview-capture.ts";

const APPS = [
  // @if web-react
  { name: "react", dir: "apps/web" },
  // @endif
  // @if web-solid
  { name: "solid", dir: "apps/web-solid" },
  // @endif
  // @if web-vue
  { name: "vue", dir: "apps/web-vue" },
  // @endif
  // @if web-svelte
  { name: "svelte", dir: "apps/web-svelte" },
  // @endif
];

const root = join(import.meta.dirname, "../../..");
const portArgument = process.argv.indexOf("--port");
const firstPort = portArgument > 0 ? Number(process.argv[portArgument + 1]) : undefined;
const out = join(tmpdir(), "acme-preview-compare");

if (APPS.length < 2) {
  console.log("This project has fewer than two web apps, so there is nothing to compare.");
  process.exit(0);
}
if (firstPort !== undefined && !(Number.isInteger(firstPort) && firstPort > 0)) {
  console.error("--port takes the first port to use, such as --port 5180.");
  process.exit(2);
}

const servers: ViteDevServer[] = [];
const browser = await chromium.launch({ channel: "chrome" });
let differences = 0;
try {
  const apps = [];
  for (const [index, app] of APPS.entries()) {
    // Not the app's own port, so that it runs beside the app's dev server.
    const port = firstPort === undefined ? 0 : firstPort + index;
    const server = await createServer({
      root: join(root, app.dir),
      server: { port, strictPort: true },
      logLevel: "error",
    });
    servers.push(await server.listen());
    const address = server.httpServer?.address();
    if (!address || typeof address === "string") throw new Error(`${app.dir}: no port`);
    apps.push({ ...app, url: `http://localhost:${address.port}` });
  }
  await rm(out, { recursive: true, force: true });
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const compare = await browser.newPage();
  for (const width of WIDTHS) {
    for (const theme of THEMES) {
      // One app at a time, so that neither waits on the other's work.
      const captured = [];
      for (const app of apps)
        captured.push({ ...app, shots: await capture(page, app.url, width, theme) });
      const [first, ...rest] = captured;
      if (!first) continue;
      for (const other of rest) {
        const dir = join(out, `${width}-${theme}`);
        differences += await compareCaptures(compare, first, other, dir, `${width} ${theme}`);
      }
    }
  }
} finally {
  await browser.close();
  await Promise.all(servers.map((server) => server.close()));
}
console.log(
  differences === 0
    ? `The design previews of ${APPS.map((app) => app.name).join(", ")} are the same.`
    : `${differences} captures differ. Both sides of each are in ${out}.`,
);
process.exitCode = differences === 0 ? 0 : 1;
