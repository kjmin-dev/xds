// Pictures of the real clients, which the component pages show next to their live examples:
// what the system draws, and what a browser cannot show (a phone's own fonts, bars and
// materials). `mise run docs:capture` takes them and records each one in captures.json; the site
// generator reads that file. Both fingerprint the files a picture depends on with `inputsHash`,
// so a page can say that its picture was taken before the latest change to the component.

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** The tab a capture appears under, and the first part of its file names. */
export type CapturePlatform = "ios" | "android" | "compose";

export type Mode = "light" | "dark";

export const MODES: readonly Mode[] = ["light", "dark"];

/** The order of the tabs after the live example. */
export const CAPTURE_PLATFORMS: readonly CapturePlatform[] = ["ios", "android", "compose"];

export type Capture = {
  /**
   * What it shows, in a word, which is also its directory:
   * `public/captures/<name>/<platform>-<mode>.webp`, and `.mp4` beside it for a clip.
   */
  name: string;
  /** The components whose pages show it, by their names in design/components.json. */
  components: string[];
  platform: CapturePlatform;
  /** The template.json target it was taken from. */
  client: string;
  /** Where it was taken, for the caption: "a Release build in the iOS 26.5 Simulator (iPhone 17 Pro)". */
  source: string;
  /** The day it was taken, as YYYY-MM-DD. */
  date: string;
  /** What it shows, for a reader who cannot see it. The same for both modes. */
  alt: string;
  /** A short clip of the moment it shows sits next to each still, with the still as its poster. */
  clip?: boolean;
  /** `inputsHash` of `captureInputs` when it was taken. */
  inputs: string;
};

export type Manifest = { captures: Capture[] };

/** The files generated from the design tokens that each client's components read. */
const TOKEN_FILES: Record<string, string[]> = {
  "mobile-react-native": ["packages/tokens/src/generated/tokens.ts"],
  "kotlin-compose": ["kotlin/ui/src/commonMain/kotlin/acme/tokens/Tokens.kt"],
};

type Contract = {
  components: { name: string; clients: Record<string, { source: string }> }[];
};

/**
 * The files a capture depends on: the sources of the components it shows, on the client it was
 * taken from, and that client's tokens. The design preview screen that holds them is left out on
 * purpose: nearly every change to a component also changes that screen, and a picture flagged
 * after every change would teach readers to ignore the flag.
 */
export function captureInputs(capture: Capture, contract: Contract): string[] {
  const tokens = TOKEN_FILES[capture.client];
  if (!tokens) throw new Error(`captures.json: no token files known for ${capture.client}`);
  const sources = capture.components.map((name) => {
    const component = contract.components.find((entry) => entry.name === name);
    const source = component?.clients[capture.client]?.source;
    if (!source) throw new Error(`captures.json: ${name} has no ${capture.client} source`);
    return source;
  });
  return [...new Set([...sources, ...tokens])].sort();
}

/**
 * A fingerprint of the files' paths and contents. Line endings are read as LF, so a checkout
 * that converts them to CRLF fingerprints the same.
 */
export async function inputsHash(root: string, paths: string[]): Promise<string> {
  const hash = createHash("sha256");
  for (const path of [...paths].sort()) {
    const text = (await readFile(join(root, path), "utf8")).replaceAll("\r\n", "\n");
    hash.update(`${path}\0${text}\0`);
  }
  return `sha256:${hash.digest("hex")}`;
}

export function stillPath(capture: Capture, mode: Mode): string {
  return `captures/${capture.name}/${capture.platform}-${mode}.webp`;
}

export function clipPath(capture: Capture, mode: Mode): string {
  return `captures/${capture.name}/${capture.platform}-${mode}.mp4`;
}

/** What the generator fails a build over: bytes on disk, which every clone of the repository carries. */
export const BUDGET = {
  still: 60 * 1024,
  clip: 150 * 1024,
  page: 400 * 1024,
};
