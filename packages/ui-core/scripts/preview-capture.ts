// Captures a web app's design preview and compares two captures pixel by pixel, in the Google
// Chrome installed on the machine. compare-previews.ts compares the web apps of a project with
// each other; the release build of this repository compares the published packages with them.

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Page } from "playwright";
import { OVERLAYS } from "../src/preview/page.ts";

export const WIDTHS = [1280, 390];
export const THEMES = ["light", "dark"];

/** Every section of the preview at rest and every overlay open, by name, in one width and mode. */
export async function capture(page: Page, url: string, width: number, theme: string, query = "") {
  const shots = new Map<string, Buffer>();
  const load = async (open?: string) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${url}/design?theme=${theme}${open ? `&open=${open}` : ""}${query}`);
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
/**
 * Some anti-aliasing is allowed: up to `pixels` pixels that differ by at most `delta` in each
 * channel, at the edge of a curve, which Chrome does not always draw alike. More of them, or one
 * that differs by more, is a difference.
 */
export type Tolerance = { delta: number; pixels: number };

export function differingPixels(page: Page, a: Buffer, b: Buffer, tolerance?: Tolerance) {
  return page.evaluate(
    async ({ a, b, tolerance }) => {
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
      let slight = 0;
      let large = false;
      for (let i = 0; i < p.length; i++) {
        if (p[i] === q[i]) continue;
        count++;
        if (!tolerance) continue;
        const [u, v] = [p[i] ?? 0, q[i] ?? 0];
        let most = 0;
        for (let shift = 0; shift < 32; shift += 8) {
          most = Math.max(most, Math.abs(((u >>> shift) & 255) - ((v >>> shift) & 255)));
        }
        if (most > tolerance.delta) large = true;
        else slight++;
      }
      return tolerance && !large && slight <= tolerance.pixels ? 0 : count;
    },
    {
      tolerance,
      a: `data:image/png;base64,${a.toString("base64")}`,
      b: `data:image/png;base64,${b.toString("base64")}`,
    },
  );
}

export type Captured = { name: string; shots: Map<string, Buffer> };

/**
 * Compares every capture of two apps, writes both sides of each that differs to `dir`, and says
 * which differ, unless `quiet`. Returns how many do.
 */
export async function compareCaptures(
  page: Page,
  first: Captured,
  other: Captured,
  dir: string,
  label: string,
  quiet = false,
  tolerance?: Tolerance,
): Promise<number> {
  let differences = 0;
  // Every capture of either app, so that one only the other app has is reported too.
  for (const name of new Set([...first.shots.keys(), ...other.shots.keys()])) {
    const shot = first.shots.get(name);
    const twin = other.shots.get(name);
    const count =
      shot && twin
        ? shot.equals(twin)
          ? 0
          : await differingPixels(page, shot, twin, tolerance)
        : -1;
    if (count === 0) continue;
    differences++;
    if (quiet) continue;
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
    console.log(`${label} ${name}: ${what}, between ${first.name} and ${other.name}`);
  }
  return differences;
}
