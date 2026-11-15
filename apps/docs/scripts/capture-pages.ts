// What the component pages show of captures.json: the pictures of each component, by platform,
// with what their captions say. `generate.ts` loads it and writes the result next to the pages,
// for the preview tabs and the Markdown copies.
//
// It fails the build over a manifest that would make a page wrong (a picture missing, a component
// the client does not have, no text for a reader who cannot see it) and over files larger than
// BUDGET. It never fails over a picture taken before the latest change to its component: that
// takes a Mac and a simulator to put right, which the Linux runner that builds the site does not
// have. The page says so instead, and the build warns.

import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import {
  BUDGET,
  CAPTURE_PLATFORMS,
  type Capture,
  type CapturePlatform,
  captureInputs,
  clipPath,
  inputsHash,
  MODES,
  type Mode,
  stillPath,
} from "./captures.ts";
import { list } from "./platforms.ts";

/** The names of the tabs. */
export const PLATFORM_LABELS: Record<CapturePlatform, string> = {
  ios: "iOS",
  android: "Android",
  compose: "Compose",
};

export type Still = { src: string; width: number; height: number };

/** One capture as a page shows it. */
export type CaptureView = {
  name: string;
  platform: CapturePlatform;
  /** The client's short name, as the pages use it: React Native, Compose. */
  client: string;
  source: string;
  date: string;
  alt: string;
  /** Taken before the latest change to one of the files it depends on. */
  stale: boolean;
  stills: Record<Mode, Still>;
  clips?: Record<Mode, string>;
};

export type CaptureTab = { platform: CapturePlatform; label: string; captures: CaptureView[] };

export type CapturePage = {
  /** The tab a reader who has not chosen one sees. */
  initial: "live" | CapturePlatform;
  tabs: CaptureTab[];
};

/** By component name. A component without captures has no entry. */
export type CapturePages = Record<string, CapturePage>;

type Contract = {
  components: { name: string; clients: Record<string, { source: string }> }[];
};

export type CaptureContext = {
  /** The repository, which the fingerprints are taken from. */
  root: string;
  /** The site's public directory, which holds the files under `captures/`. */
  publicDir: string;
  /** design/components.json. */
  contract: Contract;
  /** The targets of template.json, with the names the pages give them. */
  clients: { id: string; name: string }[];
};

// Rounded up, so that a file one byte over its budget does not read as exactly on it.
const KB = (bytes: number) => `${(Math.ceil((bytes * 10) / 1024) / 10).toFixed(1)} KB`;
const LIMIT = (bytes: number) => `${bytes / 1024} KB`;

/**
 * Checks the manifest and the files it names, and gives each component's page its tabs. Throws
 * one error that lists every problem; returns a warning for each capture that is out of date.
 */
export async function loadCapturePages(
  manifest: unknown,
  context: CaptureContext,
): Promise<{ pages: CapturePages; warnings: string[] }> {
  const problems: string[] = [];
  const entries = (manifest as { captures?: unknown } | null)?.captures;
  if (!Array.isArray(entries)) throw new Error('captures.json: expected { "captures": [...] }');

  const valid: {
    capture: Capture;
    label: string;
    inputs: string[];
    stills: Record<Mode, Still>;
    bytes: number;
  }[] = [];
  const seen = new Set<string>();
  for (const [index, entry] of entries.entries()) {
    const capture = entry as Capture;
    const label = `${typeof capture?.name === "string" ? capture.name : `entry ${index + 1}`} (${String(capture?.platform)})`;
    const problem = (text: string) => problems.push(`${label}: ${text}`);
    const before = problems.length;

    for (const field of ["name", "platform", "client", "source", "date", "alt", "inputs"]) {
      const value = (capture as Record<string, unknown>)[field];
      if (typeof value !== "string") problem(`\`${field}\` must be a string`);
    }
    const components: unknown = capture?.components;
    if (
      !Array.isArray(components) ||
      components.length === 0 ||
      !components.every((name) => typeof name === "string")
    ) {
      problem("`components` must name at least one component");
    }
    if (capture?.clip !== undefined && typeof capture.clip !== "boolean") {
      problem("`clip` must be true or false");
    }
    if (problems.length > before) continue;

    // It is a directory name, and the first part of a URL.
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(capture.name)) {
      problem("`name` must be a word of small letters, digits and hyphens: it is also a directory");
    }
    if (capture.alt.trim() === "") problem("`alt` is empty: say what it shows");
    if (!CAPTURE_PLATFORMS.includes(capture.platform)) {
      problem(`unknown platform; expected one of ${CAPTURE_PLATFORMS.join(", ")}`);
    }
    const client = context.clients.find(({ id }) => id === capture.client);
    if (!client) problem(`${capture.client} is not a target in template.json`);
    for (const name of capture.components) {
      const component = context.contract.components.find((entry) => entry.name === name);
      if (!component) problem(`${name} is not in design/components.json`);
      else if (client && !component.clients[client.id]) {
        problem(`${name} is not on ${client.id} in design/components.json`);
      }
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(capture.date) || !isDay(capture.date)) {
      problem(`\`date\` is "${capture.date}", not a day written as YYYY-MM-DD`);
    }
    let inputs: string[] = [];
    if (problems.length === before) {
      try {
        inputs = captureInputs(capture, context.contract);
      } catch (error) {
        problem(String((error as Error).message).replace(/^captures\.json: /, ""));
      }
    }
    const key = `${capture.name}/${capture.platform}`;
    if (seen.has(key)) problem("appears twice");
    seen.add(key);

    // The files: each one there, and within its budget.
    let bytes = 0;
    const stills: Partial<Record<Mode, Still>> = {};
    const file = async (path: string, limit: number, what: string) => {
      const size = await sizeOf(join(context.publicDir, path));
      if (size === undefined) {
        problem(`public/${path} is missing`);
        return undefined;
      }
      if (size > limit) {
        problem(`public/${path} is ${KB(size)}, over the ${LIMIT(limit)} a ${what} may take`);
      }
      bytes += size;
      return size;
    };
    for (const mode of MODES) {
      const path = stillPath(capture, mode);
      if ((await file(path, BUDGET.still, "still")) === undefined) continue;
      const size = webpSize(await readFile(join(context.publicDir, path)));
      if (!size) problem(`public/${path} is not a WebP image`);
      else stills[mode] = { src: `/${path}`, ...size };
    }
    if (capture.clip) {
      for (const mode of MODES) await file(clipPath(capture, mode), BUDGET.clip, "clip");
    }
    if (problems.length > before) continue;
    valid.push({ capture, label, inputs, stills: stills as Record<Mode, Still>, bytes });
  }

  // Everything a page shows, both modes and the clips, which every clone carries.
  const totals = new Map<string, number>();
  for (const { capture, bytes } of valid) {
    for (const name of capture.components) totals.set(name, (totals.get(name) ?? 0) + bytes);
  }
  for (const [name, total] of totals) {
    if (total > BUDGET.page) {
      problems.push(
        `the ${name} page would show ${KB(total)} of captures, over the ${LIMIT(BUDGET.page)} a page may take`,
      );
    }
  }
  if (problems.length > 0) {
    throw new Error(`captures.json:\n${problems.map((text) => `  - ${text}`).join("\n")}`);
  }

  const pages: CapturePages = {};
  const warnings: string[] = [];
  for (const { capture, label, inputs, stills } of valid) {
    const stale = (await inputsHash(context.root, inputs)) !== capture.inputs;
    if (stale) {
      warnings.push(
        `${label} was taken before the latest change to one of ${list(inputs)}. Its pages say so; take it again with \`mise run docs:capture\`.`,
      );
    }
    const view: CaptureView = {
      name: capture.name,
      platform: capture.platform,
      client: context.clients.find(({ id }) => id === capture.client)?.name ?? capture.client,
      source: capture.source,
      date: capture.date,
      alt: capture.alt,
      stale,
      stills,
      ...(capture.clip && {
        clips: { light: `/${clipPath(capture, "light")}`, dark: `/${clipPath(capture, "dark")}` },
      }),
    };
    for (const name of capture.components) {
      // A component whose look the system draws opens on that platform's tab instead, once one
      // does: set `initial` here.
      const page = (pages[name] ??= { initial: "live", tabs: [] });
      let tab = page.tabs.find((each) => each.platform === capture.platform);
      if (!tab) {
        tab = {
          platform: capture.platform,
          label: PLATFORM_LABELS[capture.platform],
          captures: [],
        };
        page.tabs.push(tab);
      }
      tab.captures.push(view);
    }
  }
  for (const page of Object.values(pages)) {
    page.tabs.sort(
      (a, b) => CAPTURE_PLATFORMS.indexOf(a.platform) - CAPTURE_PLATFORMS.indexOf(b.platform),
    );
  }
  return { pages, warnings };
}

/** A warning line for the log, or, on GitHub Actions, an annotation on the manifest. */
export function warningLine(message: string, githubActions: boolean): string {
  if (!githubActions) return `docs: warning: captures.json: ${message}`;
  // The workflow command ends at the end of the line, so these are escaped as the runner expects.
  const data = message.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A");
  return `::warning file=apps/docs/captures.json::${data}`;
}

const isDay = (date: string) => {
  const day = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(day.getTime()) && day.toISOString().startsWith(date);
};

async function sizeOf(path: string): Promise<number | undefined> {
  try {
    return (await stat(path)).size;
  } catch {
    return undefined;
  }
}

/**
 * The size in pixels of a WebP image, from its header, so that a page can set it on the image and
 * keep the space before it loads. `undefined` when it is not a WebP image.
 */
export function webpSize(bytes: Uint8Array): { width: number; height: number } | undefined {
  const text = (at: number, length: number) =>
    String.fromCharCode(...bytes.subarray(at, at + length));
  if (bytes.length < 30 || text(0, 4) !== "RIFF" || text(8, 4) !== "WEBP") return undefined;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const uint24 = (at: number) => view.getUint16(at, true) + ((bytes[at + 2] ?? 0) << 16);
  // The first chunk starts at byte 12, and its data at byte 20.
  switch (text(12, 4)) {
    // Lossy: a key frame's start code, then the width and the height in 14 bits each.
    case "VP8 ":
      if (bytes[23] !== 0x9d || bytes[24] !== 0x01 || bytes[25] !== 0x2a) return undefined;
      return {
        width: view.getUint16(26, true) & 0x3fff,
        height: view.getUint16(28, true) & 0x3fff,
      };
    // Lossless: a signature byte, then the width and the height less one, in 14 bits each.
    case "VP8L": {
      if (bytes[20] !== 0x2f) return undefined;
      const bits = view.getUint32(21, true);
      return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
    }
    // Extended: four bytes of flags, then the canvas less one, in 24 bits each.
    case "VP8X":
      return { width: uint24(24) + 1, height: uint24(27) + 1 };
    default:
      return undefined;
  }
}

/** The sentence that stands for the pictures in the Markdown copy of a page. */
export function capturesMarkdown(page: CapturePage): string {
  const links = page.tabs.map(({ label, captures }) => {
    const files = captures.flatMap((capture) =>
      MODES.map((mode) => `[${mode}](${capture.stills[mode].src})`),
    );
    return `${label} (${files.join(", ")})`;
  });
  return `The page also shows pictures of the real component, taken from the clients: ${list(links)}.`;
}
