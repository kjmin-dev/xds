// `mise run docs:capture -- <name|all> [--platform ios|android|compose]` takes the pictures of the
// real clients that the component pages show beside their live examples (see captures.ts), and
// records each one in captures.json, in place of the entry with the same name and platform.
//
//   navigation  TopBar and TabBar: the design preview's Navigation section at the top of a phone
//   sheet       BottomSheet: the same screen with the sheet open, and on iOS a clip of it rising
//   datepicker  DatePicker: the preview's first date picker with its calendar open
//   daterange   DateRangePicker: the preview's first date range picker with its sheet of months
//               open
//
// Besides ffmpeg and cwebp (`brew install ffmpeg webp`), each platform needs:
//
//   ios      macOS, Xcode with an iOS Simulator runtime, and CocoaPods
//   android  the Android SDK at $ANDROID_HOME, with its emulator and a system image installed
//   compose  nothing more: the JVM renderer runs on any OS
//
// iOS and Android are Release builds of apps/mobile, driven by Maestro on a simulator or an
// emulator that the run makes and deletes. Without --platform, every platform this OS can take
// runs. The builds, the logs and Maestro's files stay in apps/docs/.capture, which git ignores;
// delete it to build from nothing.

import { existsSync, readdirSync, rmSync } from "node:fs";
import { copyFile, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { parseArgs } from "node:util";
import { takeAndroid } from "./capture/android.ts";
import { takeCompose } from "./capture/compose.ts";
import { duration, encodeClip, encodeStill } from "./capture/encode.ts";
import { takeIos } from "./capture/ios.ts";
import { cleanUp, have, onExit, run, scrub } from "./capture/process.ts";
import type { CaptureName, Taken, Workspace } from "./capture/types.ts";
import {
  BUDGET,
  CAPTURE_PLATFORMS,
  type Capture,
  type CapturePlatform,
  captureInputs,
  clipPath,
  inputsHash,
  type Manifest,
  MODES,
  stillPath,
} from "./captures.ts";

const root = join(import.meta.dirname, "../../..");
const docs = join(import.meta.dirname, "..");
const build = join(docs, ".capture");
const manifestFile = join(docs, "captures.json");

/** The same words for iOS and Android, where React Native draws the same thing on both. */
const reactNative = (alt: string) => ({ ios: alt, android: alt });

/** The date picker's sheet, which React Native and Compose draw from the same tokens. */
const DUE =
  "A bottom sheet titled Due date over the dimmed design preview, holding the calendar for " +
  "March 2026 drawn from the tokens between buttons for the months before and after, with the " +
  "10th chosen and the days before the 5th greyed out.";

/** The range picker's sheet, which React Native and Compose draw from the same tokens. */
const STAY =
  "A tall bottom sheet titled Stay over the dimmed design preview: Check-in Mar 10, 2026 and " +
  "Check-out Mar 14, 2026 at the top, the weekday initials, March 2026 with a band from the " +
  "10th to the 14th between two filled circles and the days before the 5th greyed out, April " +
  "2026 under it with the days after the 20th greyed out, and a Done button at the bottom.";

/**
 * What each capture shows. React Native and Compose word some of their samples differently, so
 * each describes its own.
 */
const NAMES: Record<
  CaptureName,
  { components: string[]; alt: Partial<Record<CapturePlatform, string>> }
> = {
  "glass-blur": {
    components: ["TopBar", "TabBar"],
    alt: { compose: "A blurred top bar and tab bar over a scrolling collection of colored rows." },
  },
  "glass-solid": {
    components: ["TopBar", "TabBar"],
    alt: { compose: "The same collection with opaque navigation bars for reduced transparency." },
  },
  "glass-sheet-blur": {
    components: ["BottomSheet"],
    alt: {
      compose: "Collection details inside a strongly tinted glass sheet over the dimmed list.",
    },
  },
  "glass-sheet-solid": {
    components: ["BottomSheet"],
    alt: { compose: "Collection details inside the opaque fallback sheet over the dimmed list." },
  },
  navigation: {
    components: ["TopBar", "TabBar"],
    alt: {
      ...reactNative(
        "A phone screen showing the Navigation section of the design preview: a top bar titled " +
          "Settings with a back button and an Edit button, a button labeled Open a bottom " +
          "sheet, and a floating tab bar with Home, Search and Profile, Home selected.",
      ),
      compose:
        "A phone screen showing the Navigation section of the design preview: a top bar titled " +
        "Settings with a back button and an Edit button, a floating tab bar with Home, Search " +
        "and Profile, Home selected, and a button labeled Open the sheet.",
    },
  },
  sheet: {
    components: ["BottomSheet"],
    alt: {
      ...reactNative(
        "A bottom sheet risen from the bottom of a phone screen over the dimmed design preview, " +
          "with a handle, the title Share report, a line of text, a Copy link button and a " +
          "Cancel button.",
      ),
      compose:
        "A bottom sheet risen from the bottom of a phone screen over the dimmed design preview, " +
        "with a handle, the title Share the report, a line of text, a Copy the link button and a " +
        "Cancel button.",
    },
  },
  datepicker: {
    components: ["DatePicker"],
    alt: {
      ...reactNative(DUE),
      compose: DUE,
    },
  },
  daterange: {
    components: ["DateRangePicker"],
    alt: {
      ...reactNative(STAY),
      compose: STAY,
    },
  },
};

const TAKE: Record<
  CapturePlatform,
  (names: CaptureName[], workspace: Workspace) => Promise<Taken>
> = { ios: takeIos, android: takeAndroid, compose: takeCompose };

const CLIENT: Record<CapturePlatform, string> = {
  ios: "mobile-react-native",
  android: "mobile-react-native",
  compose: "kotlin-compose",
};

function usage(message: string): never {
  console.error(
    `${message}\nUsage: mise run docs:capture -- <${Object.keys(NAMES).join("|")}|all> ` +
      `[--platform ${CAPTURE_PLATFORMS.join("|")}]`,
  );
  process.exit(2);
}

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { platform: { type: "string" } },
});
const [asked] = positionals;
if (!asked) usage("Name a capture, or all.");
const isName = (name: string): name is CaptureName => Object.hasOwn(NAMES, name);
if (asked !== "all" && !isName(asked)) usage(`There is no capture named ${asked}.`);
const names: CaptureName[] = asked === "all" ? (Object.keys(NAMES) as CaptureName[]) : [asked];
const isPlatform = (name: string): name is CapturePlatform =>
  (CAPTURE_PLATFORMS as readonly string[]).includes(name);
if (values.platform !== undefined && !isPlatform(values.platform))
  usage(`There is no platform named ${values.platform}.`);
const platforms: CapturePlatform[] = values.platform
  ? [values.platform as CapturePlatform]
  : CAPTURE_PLATFORMS.filter((platform) => platform !== "ios" || process.platform === "darwin");
if (!values.platform && process.platform !== "darwin")
  console.log("Leaving out iOS, whose captures need macOS.");

const missing = [
  ...(have("cwebp") ? [] : ["cwebp"]),
  ...(platforms.includes("ios") && !(have("ffmpeg") && have("ffprobe")) ? ["ffmpeg"] : []),
];
if (missing.length > 0) {
  console.error(
    `${missing.join(" and ")} must be on PATH: \`brew install ffmpeg webp\` on macOS, or your ` +
      "system's ffmpeg and webp packages.",
  );
  process.exit(1);
}

const contract = JSON.parse(await readFile(join(root, "design/components.json"), "utf8"));
const date = (() => {
  const now = new Date();
  const pad = (number: number) => String(number).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
})();

/** The files a capture shows on its pages, as paths under public/. */
const filesOf = (capture: Capture) =>
  MODES.flatMap((mode) => [
    stillPath(capture, mode),
    ...(capture.clip ? [clipPath(capture, mode)] : []),
  ]);

/**
 * Encodes what one platform drew, checks every file and every page against the budget, and only
 * then copies the files into public/ and writes the manifest, so that a capture over budget
 * changes nothing.
 */
async function record(platform: CapturePlatform, taken: Taken) {
  const out = join(build, "out");
  const client = CLIENT[platform];
  const captures: Capture[] = [];
  for (const [name, raw] of taken.shots) {
    const alt = NAMES[name].alt[platform];
    if (!alt) throw new Error(`No ${platform} capture for ${name}`);
    const shown = {
      name,
      components: NAMES[name].components,
      platform,
      client,
      source: taken.source,
      date,
      alt,
      ...(raw.clip ? { clip: true } : {}),
    };
    const capture: Capture = {
      ...shown,
      inputs: await inputsHash(root, captureInputs({ ...shown, inputs: "" }, contract)),
    };
    for (const mode of MODES) {
      const still = join(out, stillPath(capture, mode));
      await mkdir(dirname(still), { recursive: true });
      // Tier comparisons share a page with the full-size navigation and sheet captures.
      await encodeStill(raw.still[mode], still, name.startsWith("glass-") ? 360 : 780);
      if (raw.clip) {
        const clip = join(out, clipPath(capture, mode));
        await encodeClip(raw.clip[mode], clip);
        const seconds = await duration(clip);
        if (seconds > 3.05)
          throw new Error(`${clipPath(capture, mode)} plays ${seconds} s, over 3 s`);
      }
    }
    captures.push(capture);
  }

  const manifest = JSON.parse(await readFile(manifestFile, "utf8")) as Manifest;
  const replaced = (entry: Capture) =>
    captures.some((capture) => capture.name === entry.name && capture.platform === entry.platform);
  const next = [...manifest.captures.filter((entry) => !replaced(entry)), ...captures].sort(
    (a, b) =>
      a.name.localeCompare(b.name) ||
      CAPTURE_PLATFORMS.indexOf(a.platform) - CAPTURE_PLATFORMS.indexOf(b.platform),
  );
  // The new files are still in the build directory; the others are the ones on the site.
  const size = async (capture: Capture, path: string) =>
    (await stat(join(captures.includes(capture) ? out : join(docs, "public"), path))).size;
  const over: string[] = [];
  for (const capture of captures) {
    for (const path of filesOf(capture)) {
      const bytes = await size(capture, path);
      const limit = path.endsWith(".mp4") ? BUDGET.clip : BUDGET.still;
      console.log(`  ${path}: ${bytes} bytes`);
      if (bytes > limit) over.push(`${path} is ${bytes} bytes, over ${limit}`);
    }
  }
  for (const component of new Set(captures.flatMap((capture) => capture.components))) {
    let bytes = 0;
    for (const capture of next.filter((entry) => entry.components.includes(component)))
      for (const path of filesOf(capture)) bytes += await size(capture, path);
    console.log(`  the ${component} page: ${bytes} bytes of captures`);
    if (bytes > BUDGET.page)
      over.push(`the ${component} page shows ${bytes} bytes of captures, over ${BUDGET.page}`);
  }
  if (over.length > 0)
    throw new Error(`Over budget, so nothing was written:\n  ${over.join("\n  ")}`);

  for (const capture of captures) {
    for (const path of filesOf(capture)) {
      await mkdir(dirname(join(docs, "public", path)), { recursive: true });
      await copyFile(join(out, path), join(docs, "public", path));
    }
  }
  await writeFile(manifestFile, `${JSON.stringify({ ...manifest, captures: next }, null, 2)}\n`);
  // In the layout `mise run check:js` checks: oxfmt puts short arrays on one line.
  await run("pnpm", ["exec", "oxfmt", manifestFile], { cwd: root });
}

/** Deletes the simulator's and the emulator's own logs that Maestro copies into its reports. */
function removeSystemLogs(directory: string) {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory, { recursive: true, withFileTypes: true }))
    if (entry.isFile() && /^device-(simulator|logcat)/.test(entry.name))
      rmSync(join(entry.parentPath, entry.name));
}

const workspaceOf = (platform: CapturePlatform): Workspace => ({
  build: join(build, platform),
  raw: join(build, "raw", platform),
  logs: join(build, "logs"),
  maestro: join(build, "maestro"),
});
const failures: string[] = [];
// Registered first, so that it runs last, after the simulator and the emulator are gone, even
// when the run is stopped: the logs and Maestro's reports name them, and those names go.
onExit("take the device ids out of the logs", () => {
  // Maestro's reports help only with a failed run. The system logs among them can name the
  // simulator in a shortened form that no search finds, so they go even then.
  if (failures.length === 0)
    rmSync(join(build, "maestro", "runs"), { recursive: true, force: true });
  else removeSystemLogs(join(build, "maestro", "runs"));
  scrub(join(build, "logs"));
  scrub(join(build, "maestro"));
});
try {
  await rm(join(build, "maestro"), { recursive: true, force: true });
  await rm(join(build, "out"), { recursive: true, force: true });
  for (const platform of platforms) {
    const supported = names.filter((name) => NAMES[name].alt[platform] !== undefined);
    if (supported.length === 0) {
      if (values.platform) usage(`${asked} has no ${platform} capture.`);
      continue;
    }
    console.log(`${platform}:`);
    const workspace = workspaceOf(platform);
    await rm(workspace.raw, { recursive: true, force: true });
    for (const directory of [workspace.build, workspace.raw, workspace.logs, workspace.maestro])
      await mkdir(directory, { recursive: true });
    for (const log of ["build", "simulator", "emulator", "maestro", "render"])
      await rm(join(workspace.logs, `${platform}-${log}.log`), { force: true });
    try {
      await record(platform, await TAKE[platform](supported, workspace));
    } catch (error) {
      console.error(`  ${(error as Error).message}`);
      failures.push(platform);
    }
  }
} finally {
  cleanUp();
}
if (failures.length > 0) {
  console.error(`Failed: ${failures.join(", ")}. The logs are in ${join(build, "logs")}.`);
  process.exit(1);
}
