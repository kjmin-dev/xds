// Compares the design previews of the web apps pixel by pixel: every section at rest and every
// `?open=` overlay, at a desktop and a phone width, in both color modes, in the Google Chrome
// installed on the machine. The apps draw the same data with different libraries, so any
// difference is one library drawing a component differently. Run it with
// `mise run compare:previews`; it starts each app's dev server itself, on any free port, or
// from the port given with `--port <port>` on, one per app.

import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import { OVERLAYS } from "../src/preview/page.ts";

const APPS = [
  // @if web-react
  { name: "react", dir: "apps/web" },
  // @endif
  // @if web-solid
  { name: "solid", dir: "apps/web-solid" },
  // @endif
];
const WIDTHS = [1280, 390];
const THEMES = ["light", "dark"];

const root = join(import.meta.dirname, "../../..");
const portArgument = process.argv.indexOf("--port");
const firstPort = portArgument > 0 ? Number(process.argv[portArgument + 1]) : undefined;
const out = join(tmpdir(), "acme-preview-compare");

if (APPS.length < 2) {
  console.log("This project has one web app, so there is nothing to compare it with.");
  process.exit(0);
}
if (firstPort !== undefined && !(Number.isInteger(firstPort) && firstPort > 0)) {
  console.error("--port takes the first port to use, such as --port 5180.");
  process.exit(2);
}

/** Every capture of one app in one width and mode, by name. */
async function capture(page: Page, url: string, width: number, theme: string) {
  const shots = new Map<string, Buffer>();
  const load = async (open?: string) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${url}/design?theme=${theme}${open ? `&open=${open}` : ""}`);
    await page.waitForSelector("main section");
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState("networkidle");
    // An overlay opens in the frame after the first, and then animates in.
    await page.waitForTimeout(open ? 1200 : 400);
    // Spinners and skeletons move: every animation is shown at its first frame.
    await page.evaluate(() => {
      for (const animation of document.getAnimations()) {
        animation.pause();
        animation.currentTime = 0;
      }
    });
  };
  await load();
  // The section links stay at the top of the window and would cover the section captured.
  await page.addStyleTag({ content: 'nav[aria-label="Sections"] { position: static !important }' });
  for (const section of await page.locator("main > section").all()) {
    shots.set(`${await section.getAttribute("id")}`, await section.screenshot());
  }
  for (const open of Object.keys(OVERLAYS)) {
    await load(open);
    shots.set(`open=${open}`, await page.screenshot());
  }
  return shots;
}

/** How many pixels of two PNG images differ, counted in the page; -1 when the sizes differ. */
function differingPixels(page: Page, a: Buffer, b: Buffer) {
  return page.evaluate(
    async ({ a, b }) => {
      const pixels = async (png: string) => {
        const image = await createImageBitmap(await (await fetch(png)).blob());
        const context = new OffscreenCanvas(image.width, image.height).getContext("2d");
        context?.drawImage(image, 0, 0);
        return context?.getImageData(0, 0, image.width, image.height);
      };
      const [x, y] = [await pixels(a), await pixels(b)];
      if (!x || !y || x.width !== y.width || x.height !== y.height) return -1;
      const [p, q] = [new Uint32Array(x.data.buffer), new Uint32Array(y.data.buffer)];
      let count = 0;
      for (let i = 0; i < p.length; i++) if (p[i] !== q[i]) count++;
      return count;
    },
    {
      a: `data:image/png;base64,${a.toString("base64")}`,
      b: `data:image/png;base64,${b.toString("base64")}`,
    },
  );
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
        // Every capture of either app, so that one only the other app has is reported too.
        for (const name of new Set([...first.shots.keys(), ...other.shots.keys()])) {
          const shot = first.shots.get(name);
          const twin = other.shots.get(name);
          const count =
            shot && twin
              ? shot.equals(twin)
                ? 0
                : await differingPixels(compare, shot, twin)
              : -1;
          if (count === 0) continue;
          differences++;
          const dir = join(out, `${width}-${theme}`);
          await mkdir(dir, { recursive: true });
          if (shot) await writeFile(join(dir, `${name}-${first.name}.png`), shot);
          if (twin) await writeFile(join(dir, `${name}-${other.name}.png`), twin);
          const what = !shot
            ? `only ${other.name} has it`
            : !twin
              ? `only ${first.name} has it`
              : count < 0
                ? "a different size"
                : `${count} pixels differ`;
          console.log(
            `${width} ${theme} ${name}: ${what}, between ${first.name} and ${other.name}`,
          );
        }
      }
    }
  }
} finally {
  await browser.close();
  await Promise.all(servers.map((server) => server.close()));
}
console.log(
  differences === 0
    ? `The design previews of ${APPS.map((app) => app.name).join(" and ")} are the same.`
    : `${differences} captures differ. Both sides of each are in ${out}.`,
);
process.exitCode = differences === 0 ? 0 : 1;
