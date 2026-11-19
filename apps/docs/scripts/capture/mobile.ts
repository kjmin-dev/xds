// What the iOS and Android captures share: a Release build of apps/mobile made with
// `expo prebuild`, and Maestro, which opens the design preview on the simulator or emulator and
// presses its buttons.

import type { ChildProcess } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { type Mode, MODES } from "../captures.ts";
import { onExit, run, runSync, sleep, stop } from "./process.ts";
import type { CaptureName, Raw } from "./types.ts";

export const root = join(import.meta.dirname, "../../../..");
export const mobile = join(root, "apps/mobile");
const flows = join(import.meta.dirname, "flows");

/** The app's ids and link scheme, from its Expo config, so a renamed project still works. */
export function appConfig() {
  const { expo } = JSON.parse(readFileSync(join(mobile, "app.json"), "utf8"));
  return {
    scheme: expo.scheme as string,
    ios: expo.ios.bundleIdentifier as string,
    android: expo.android.package as string,
  };
}

// ---------------------------------------------------------------- the build

/** What the native project is generated from. When it changes, `expo prebuild` runs again. */
function nativeInputs() {
  const hash = createHash("sha256");
  for (const file of ["apps/mobile/package.json", "apps/mobile/app.json", "pnpm-lock.yaml"])
    hash.update(readFileSync(join(root, file)));
  return hash.digest("hex");
}

/**
 * Generates apps/mobile/ios or apps/mobile/android, unless it is there already and made from the
 * same inputs: then the native build only bundles the JavaScript again, which takes a minute or
 * two instead of ten. Returns whether it generated the project.
 */
export async function prebuild(platform: "ios" | "android", build: string, log: string) {
  const stamp = join(build, "prebuild.stamp");
  const inputs = nativeInputs();
  if (
    existsSync(join(mobile, platform)) &&
    existsSync(stamp) &&
    readFileSync(stamp, "utf8") === inputs
  )
    return false;
  // prebuild points package.json's `ios` and `android` scripts at `expo run`, and may fill in
  // app.json. Both are tracked files: they are put back, and the run fails if anything else in
  // apps/mobile changed.
  const status = () =>
    runSync("git", ["status", "--porcelain", "--", "apps/mobile"], { cwd: root });
  const before = status().stdout;
  const kept = ["package.json", "app.json"].map((file) => {
    const path = join(mobile, file);
    return { path, text: readFileSync(path) };
  });
  try {
    await run(
      "pnpm",
      ["exec", "expo", "prebuild", "--platform", platform, "--clean", "--no-install"],
      { cwd: mobile, env: { CI: "1", EXPO_NO_TELEMETRY: "1" }, log },
    );
  } finally {
    for (const { path, text } of kept) writeFileSync(path, text);
  }
  if (status().stdout !== before)
    throw new Error(`expo prebuild changed tracked files in apps/mobile:\n${status().stdout}`);
  await writeFile(stamp, inputs);
  return true;
}

// ---------------------------------------------------------------- Maestro

/**
 * Keeps Maestro's files in `build`. It writes its state under XDG_STATE_HOME when that is set,
 * and the rest wherever it is told to, except for the helpers it unpacks into ~/.maestro/deps:
 * those are removed at the end of the run, if this run put them there.
 */
export function maestroSetup(build: string) {
  maestroEnv ??= maestroHome(build);
  return maestroEnv;
}

let maestroEnv: Record<string, string> | undefined;

function maestroHome(build: string) {
  const home = join(homedir(), ".maestro");
  const existed = existsSync(home);
  const before = new Set(existed ? listTwoLevels(home) : []);
  onExit("remove what Maestro left in ~/.maestro", () => {
    if (!existed) return rmSync(home, { recursive: true, force: true });
    for (const path of listTwoLevels(home))
      if (!before.has(path)) rmSync(path, { recursive: true, force: true });
  });
  return {
    MAESTRO_CLI_NO_ANALYTICS: "1",
    MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED: "true",
    MAESTRO_DISABLE_UPDATE_CHECK: "true",
    XDG_STATE_HOME: join(build, "state"),
  };
}

function listTwoLevels(directory: string) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? [path, ...readdirSync(path).map((name) => join(path, name))]
      : [path];
  });
}

/** A simulator or an emulator made for this run, as Maestro and the capture steps use it. */
export type Device = {
  /** The UDID or serial, for Maestro's `--device`. */
  id: string;
  appId: string;
  setMode(mode: Mode): Promise<void>;
  screenshot(file: string): Promise<void>;
  /** Starts recording the screen into `file`; `stop` ends it. */
  record?(file: string): ChildProcess;
};

/** Where Maestro writes, what it is told, and where what it prints goes. */
type Context = { directory: string; env: Record<string, string>; log: string };

let flowRuns = 0;

async function maestro(
  device: Device,
  flow: string,
  env: Record<string, string>,
  context: Context,
) {
  const output = join(context.directory, `${++flowRuns}-${flow.replace(/\.yaml$/, "")}`);
  await mkdir(output, { recursive: true });
  const variables = Object.entries({ APP_ID: device.appId, ...env }).flatMap(([key, value]) => [
    "-e",
    `${key}=${value}`,
  ]);
  const reports = ["--test-output-dir", output, "--debug-output", output];
  await run(
    "maestro",
    ["--device", device.id, "test", ...variables, ...reports, join(flows, flow)],
    {
      env: context.env,
      log: context.log,
    },
  );
}

/**
 * Takes the stills (and, where the device records, the clips) of every name in `names`, in both
 * modes. `navigation` and `sheet` start from the preview's Navigation section: `navigation` is a
 * picture of it, and `sheet` presses its button and records the sheet rising over it, so that
 * the clip ends on the sheet's still. `datepicker` and `daterange` start the preview at Controls
 * with the calendar of its first date picker, or of its first date range picker, open.
 */
export async function shoot(
  device: Device,
  names: CaptureName[],
  context: Context & { raw: string },
) {
  const { scheme } = appConfig();
  const shots = new Map<CaptureName, Raw>();
  const file = (name: string, mode: Mode, extension: string) =>
    join(context.raw, `${name}-${mode}.${extension}`);
  await mkdir(context.raw, { recursive: true });
  for (const mode of MODES) {
    await device.setMode(mode);
    for (const name of names.filter((name) => name.startsWith("glass-"))) {
      const tier = name.split("-").at(-1);
      const sheet = name.startsWith("glass-sheet-");
      await maestro(
        device,
        "glass.yaml",
        {
          LINK: `${scheme}://design?section=glass&glass=${tier}${sheet ? "&sheet=1" : ""}`,
          TEXT: sheet ? "Collection details" : "Collections",
          MATERIAL: `glass-${sheet ? "sheet" : "bar"}-${tier}`,
        },
        context,
      );
      await device.screenshot(file(name, mode, "png"));
    }
    for (const name of ["datepicker", "daterange"] as const) {
      if (!names.includes(name)) continue;
      await maestro(
        device,
        "open.yaml",
        // The month of the picker's day, or of its range's start, which the calendar heads with
        // its name. It is long over, so no day in it is today, and the picture is the same every
        // day.
        { LINK: `${scheme}://design?section=controls&${name}=1`, TEXT: "March 2026" },
        context,
      );
      await device.screenshot(file(name, mode, "png"));
    }
    if (!names.includes("navigation") && !names.includes("sheet")) continue;
    await maestro(
      device,
      "open.yaml",
      { LINK: `${scheme}://design?section=navigation`, TEXT: "Open a bottom sheet" },
      context,
    );
    await device.screenshot(file("navigation", mode, "png"));
    if (!names.includes("sheet")) continue;
    const recording = device.record?.(file("sheet", mode, "mp4"));
    // simctl starts writing frames a moment after it starts.
    if (recording) await sleep(1500);
    await maestro(device, "sheet.yaml", {}, context);
    if (recording) {
      // The sheet rises in well under a second, but a busy machine can hold the simulator's
      // frames back for seconds. encodeClip cuts the still part off.
      await sleep(5000);
      await stop(recording);
    }
    await maestro(device, "shown.yaml", { TEXT: "Share report" }, context);
    await device.screenshot(file("sheet", mode, "png"));
  }
  for (const name of names) {
    const record = device.record !== undefined && name === "sheet";
    shots.set(name, {
      still: { light: file(name, "light", "png"), dark: file(name, "dark", "png") },
      clip: record
        ? { light: file(name, "light", "mp4"), dark: file(name, "dark", "mp4") }
        : undefined,
    });
  }
  return shots;
}
