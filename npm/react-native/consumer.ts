// The React Native library's external consumer check: what must pass before the package joins a
// release (docs/library.md, L3).
//
//   node npm/react-native/consumer.ts [--skip-build] [--skip-android] [--xds <binary>]
//
// It packs @xds/react-native as build.ts built it and installs it with npm into three new apps
// outside this repository, each with nothing of xds's but the package:
//
// - an Expo app on the template's Expo SDK and React Native, with the Expo modules the glass
//   surfaces use: the scaffolded project's app/ and src/, with their imports of the project's
//   packages turned into imports of the library;
// - a React Native app without Expo on the newest React Native the package supports, and one on
//   the oldest, made from the React Native template, with only the required peers. They show
//   the same design screen, through a small stand-in for the two Expo Router calls it makes,
//   and without the glass section's benchmark, which needs Reanimated.
//
// Each app is type-checked with its own TypeScript and bundled by Metro for iOS and Android.
// Then each is built for Android and run on an emulator that this run makes and deletes, and its
// screens are compared pixel by pixel: the Expo app's with the scaffolded project's app, which
// `xds create` makes from this repository under the name `xds`, and the oldest React Native's
// with the newest's. Once with the default theme, and once with a custom theme
// (npm/web/consumer/brand.json): the library's apps apply it with the value
// `xds export-theme --format react-native` writes, and the scaffolded app with its token build.
//
// `--xds <binary>` names the CLI to scaffold and export with; by default it is built from this
// repository. Android needs the Android SDK at $ANDROID_HOME with a system image installed.

import { execFileSync } from "node:child_process";
import { copyFile, cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { parseArgs } from "node:util";
import { type Emulator, startEmulator } from "../../maven/emulator.ts";
import { decodePng, differingPixels, isBlank } from "../../maven/png.ts";
import { emitTypeScript } from "../../tools/design-build/src/emit.ts";
import { loadIcons } from "../../tools/design-build/src/icons.ts";
import { readContract, themeModel } from "../../tools/design-build/src/theme-contract.ts";
import { buildPackage, NAME, PEERS, root } from "./build.ts";

type Theme = "default" | "brand";
const THEMES: Theme[] = ["default", "brand"];

/** The two ends of the support window, as the peer range in build.ts states it. */
const NEWEST = "0.88.1";
const OLDEST = "0.86.3";
if (!PEERS["react-native"].startsWith(`>=${OLDEST.replace(/\.\d+$/, ".0")}`)) {
  throw new Error(`build.ts no longer starts the React Native range at ${OLDEST}`);
}

const { values: options } = parseArgs({
  options: {
    "skip-build": { type: "boolean", default: false },
    "skip-android": { type: "boolean", default: false },
    xds: { type: "string" },
  },
});
const work = join(tmpdir(), "xds-rn-consumer");
const out = join(tmpdir(), "xds-rn-consumer-compare");
const themeFile = join(root, "npm/web/consumer/brand.json");
const ABI = process.arch === "arm64" ? "arm64-v8a" : "x86_64";

function run(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv = {}) {
  console.log(`  $ ${[command, ...args].join(" ")}`);
  execFileSync(command, args, {
    cwd,
    stdio: ["ignore", "inherit", "inherit"],
    env: { ...process.env, ...env },
  });
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

async function writeJson(path: string, value: unknown) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function files(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name));
}

/** The scaffolded project's imports of its own packages, as imports of the published one. */
function toLibrary(text: string): string {
  return text
    .replaceAll('"@xds/ui-native/', `"${NAME}/`)
    .replaceAll('"@xds/ui-native"', `"${NAME}"`)
    .replaceAll('"@xds/tokens"', `"${NAME}/tokens"`);
}

/** The versions the scaffolded project's pnpm catalog gives. */
async function catalog(project: string): Promise<Record<string, string>> {
  const text = await readFile(join(project, "pnpm-workspace.yaml"), "utf8");
  const block = text.split(/^catalog:\n/m)[1]?.split(/^\S/m)[0] ?? "";
  const versions: Record<string, string> = {};
  for (const line of block.split("\n")) {
    const match = line.match(/^\s+"?([^":#]+)"?:\s*(\S+)/);
    if (match?.[1] && match[2]) versions[match[1]] = match[2];
  }
  return versions;
}

// ----------------------------------------------------------------------------- the apps

type App = {
  /** Where its package.json is. */
  dir: string;
  /** What starts it on Android, as `am start -n` takes it. */
  activity: string;
  /** The address of a screen of the design preview, with the theme the check gives it. */
  link: (query: string, theme: Theme) => string;
};

/** The custom theme as the library's apps take it: the value `xds export-theme` writes. */
function exportTheme(xds: string, file: string) {
  // Outside any project, so it is typed by the published package.
  run(
    xds,
    ["export-theme", themeFile, "--name", "brand", "--format", "react-native", "--out", file],
    work,
  );
}

/** The scaffolded Expo app, with the library in place of the project's packages. */
async function expoConsumer(xds: string, project: string, tarball: string): Promise<App> {
  const dir = join(work, "expo");
  const mobile = join(project, "apps/mobile");
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  for (const part of ["app", "src"]) {
    await cp(join(mobile, part), join(dir, part), { recursive: true });
  }
  for (const file of await files(dir)) {
    await writeFile(file, toLibrary(await readFile(file, "utf8")));
  }
  // The theme the check gives: the default one, or the custom one by its address.
  await writeFile(
    join(dir, "app/_layout.tsx"),
    `import { XdsTheme } from "${NAME}";
import { Stack, useGlobalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { brandTheme } from "../src/brand";

export default function RootLayout() {
  const { theme } = useGlobalSearchParams<{ theme?: string }>();
  return (
    <XdsTheme {...(theme === "brand" ? { theme: brandTheme } : {})}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </XdsTheme>
  );
}
`,
  );
  exportTheme(xds, join(dir, "src/brand.ts"));
  const app = await readJson<{ expo: Record<string, unknown> }>(join(mobile, "app.json"));
  app.expo = {
    ...app.expo,
    name: "xds consumer",
    slug: "xds-consumer",
    scheme: "xdsconsumer",
    ios: { ...(app.expo.ios as object), bundleIdentifier: "dev.xds.consumer" },
    android: { package: "dev.xds.consumer" },
  };
  await writeJson(join(dir, "app.json"), app);
  await copyFile(join(mobile, "tsconfig.json"), join(dir, "tsconfig.json"));
  await writeFile(join(dir, "expo-env.d.ts"), '/// <reference types="expo/types" />\n');
  const versions = await catalog(project);
  const source = await readJson<{
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  }>(join(mobile, "package.json"));
  const pinned = (list: Record<string, string>) =>
    Object.fromEntries(
      Object.entries(list)
        .filter(([name]) => !name.startsWith("@xds/"))
        .map(([name, version]) => [
          name,
          version === "catalog:" ? (versions[name] ?? "") : version,
        ]),
    );
  await writeJson(join(dir, "package.json"), {
    name: "xds-consumer-expo",
    version: "1.0.0",
    private: true,
    main: "expo-router/entry",
    dependencies: { ...pinned(source.dependencies), [NAME]: `file:${tarball}` },
    devDependencies: pinned(source.devDependencies),
  });
  run("npm", ["install", "--no-audit", "--no-fund", "--loglevel=error"], dir);
  return {
    dir,
    activity: "dev.xds.consumer/.MainActivity",
    link: (query, theme) => `xdsconsumer://design?${query}&theme=${theme}`,
  };
}

/**
 * A React Native app without Expo, from the template of a React Native version, with the
 * library and its required peers only. It shows the scaffolded project's design screen.
 */
async function bareConsumer(
  name: string,
  version: string,
  project: string,
  tarball: string,
): Promise<App> {
  const dir = join(work, name.toLowerCase());
  await rm(dir, { recursive: true, force: true });
  run(
    "npx",
    [
      "--yes",
      "@react-native-community/cli@latest",
      "init",
      name,
      "--version",
      version,
      "--directory",
      dir,
      "--skip-install",
      "--skip-git-init",
      "--pm",
      "npm",
    ],
    work,
  );
  const manifest = await readJson<{ dependencies: Record<string, string> }>(
    join(dir, "package.json"),
  );
  manifest.dependencies = {
    ...manifest.dependencies,
    [NAME]: `file:${tarball}`,
    "react-native-safe-area-context": PEERS["react-native-safe-area-context"].slice(1),
    "react-native-svg": PEERS["react-native-svg"].slice(1),
  };
  await writeJson(join(dir, "package.json"), manifest);

  const mobile = join(project, "apps/mobile");
  const design = toLibrary(await readFile(join(mobile, "app/design.tsx"), "utf8"))
    .replace('from "expo-router";', 'from "./router";')
    .replace('from "../src/GlassPreview.tsx";', 'from "./GlassPreview";');
  if (design.includes("expo-router") || design.includes("GlassPreview.tsx")) {
    throw new Error("design.tsx imports something this check does not stand in for");
  }
  await writeFile(join(dir, "Design.tsx"), design);
  // The two calls the screen makes to Expo Router: the address's query, and a screen option.
  await writeFile(
    join(dir, "router.tsx"),
    `import { createContext, useContext } from "react";

export const Params = createContext<Record<string, string>>({});

export function useLocalSearchParams<T>(): T {
  return useContext(Params) as T;
}

export const Stack = { Screen: (_props: { options?: object }) => null };
`,
  );
  // The glass section's benchmark scrolls with Reanimated, which this app does not have.
  await writeFile(
    join(dir, "GlassPreview.tsx"),
    "export function GlassPreview(_props: Record<string, unknown>) {\n  return null;\n}\n",
  );
  exportTheme(join(work, "xds"), join(dir, "brand.ts"));
  await writeFile(
    join(dir, "App.tsx"),
    `import { XdsTheme } from "${NAME}";
import { useEffect, useState } from "react";
import { Linking, StatusBar, useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { brandTheme } from "./brand";
import Design from "./Design";
import { Params } from "./router";

/** The design screen at the address the app was opened with: its query, and the theme. */
export default function App() {
  const [params, setParams] = useState<Record<string, string>>();
  const scheme = useColorScheme();
  useEffect(() => {
    void Linking.getInitialURL().then((url) => {
      const query = url?.split("?")[1] ?? "";
      setParams(Object.fromEntries(new URLSearchParams(query)));
    });
  }, []);
  if (!params) return null;
  return (
    <SafeAreaProvider>
      <StatusBar barStyle={scheme === "dark" ? "light-content" : "dark-content"} />
      <XdsTheme {...(params.theme === "brand" ? { theme: brandTheme } : {})}>
        <Params value={params}>
          <Design />
        </Params>
      </XdsTheme>
    </SafeAreaProvider>
  );
}
`,
  );
  run("npm", ["install", "--no-audit", "--no-fund", "--loglevel=error"], dir);
  const id = `com.${name.toLowerCase()}`;
  return {
    dir,
    activity: `${id}/.MainActivity`,
    link: (query, theme) => `xdsbare://design?${query}&theme=${theme}`,
  };
}

/** Type-checks an app with its own TypeScript and bundles it with Metro for both systems. */
function checkJavaScript(app: App, expo: boolean) {
  run("npx", ["tsc", "--noEmit"], app.dir);
  if (expo) {
    const args = ["expo", "export", "--platform", "android", "--platform", "ios"];
    run("npx", [...args, "--output-dir", join(app.dir, "dist")], app.dir);
    return;
  }
  for (const platform of ["android", "ios"]) {
    run(
      "npx",
      [
        "react-native",
        "bundle",
        "--platform",
        platform,
        "--dev",
        "false",
        "--entry-file",
        "index.js",
        "--bundle-output",
        join(app.dir, `dist/index.${platform}.js`),
        "--assets-dest",
        join(app.dir, "dist", platform),
      ],
      app.dir,
    );
  }
}

/** Builds an app's release APK for this machine's processor. */
function assemble(android: string, rebundle = false): string {
  run(
    join(android, "gradlew"),
    [
      ...(rebundle ? [":app:createBundleReleaseJsAndAssets", "--rerun"] : []),
      ":app:assembleRelease",
      `-PreactNativeArchitectures=${ABI}`,
      "--console=plain",
      "--quiet",
    ],
    android,
  );
  return join(android, "app/build/outputs/apk/release/app-release.apk");
}

// ----------------------------------------------------------------------------- the screens

/**
 * Each screen the pictures show: every section of the design preview at the top of the screen,
 * and each overlay open, as `?section=` and the overlay's parameter open them.
 */
async function screens(project: string): Promise<{ name: string; query: string }[]> {
  const design = await readFile(join(project, "apps/mobile/app/design.tsx"), "utf8");
  const keys = [...design.matchAll(/<Section key="([a-z-]+)"/g)].map((match) => match[1] ?? "");
  if (keys.length < 10)
    throw new Error("design.tsx lists its sections in a way this check does not read");
  return [
    ...keys.map((key) => ({ name: key, query: `section=${key}` })),
    { name: "sheet", query: "section=navigation&sheet=1" },
    { name: "select", query: "section=controls&select=1" },
    { name: "datepicker", query: "section=controls&datepicker=1" },
    { name: "daterange", query: "section=controls&daterange=1" },
    { name: "menu-open", query: "section=menu&menu=1" },
    { name: "dialog-open", query: "section=dialog&dialog=1" },
    { name: "toast-open", query: "section=toast&toast=1" },
    { name: "glass-solid", query: "section=glass&glass=solid" },
  ];
}

/**
 * Opens a screen afresh at its address and waits until it shows the activity's first frames
 * and stops changing, as the Compose library's check does.
 */
async function shoot(emulator: Emulator, app: App, uri: string): Promise<Buffer> {
  const [pkg = app.activity, activity = app.activity] = app.activity.split("/");
  emulator.adb(["shell", "am", "force-stop", pkg]);
  try {
    // The device's shell reads the command line: the address is quoted for its `&`s.
    emulator.adb([
      "shell",
      "am",
      "start",
      "-W",
      "-a",
      "android.intent.action.VIEW",
      "-d",
      `'${uri}'`,
      "-n",
      app.activity,
    ]);
  } catch {
    console.log(`  ${uri}: the launch was not reported`);
  }
  const ready = (picture: Buffer) => {
    if (isBlank(decodePng(picture))) return false;
    const windows = emulator.adb(["shell", "dumpsys", "window"]).toString();
    return (
      !windows.includes(`Splash Screen ${pkg}`) &&
      (windows.match(/mCurrentFocus=.*/)?.[0].includes(activity) ?? false)
    );
  };
  await sleep(2000);
  let last = emulator.screenshot();
  for (let tries = 0; tries < 40; tries++) {
    await sleep(700);
    const next = emulator.screenshot();
    if (next.equals(last) && ready(next)) return next;
    last = next;
  }
  throw new Error(`${uri} did not settle on a drawn screen`);
}

let differences = 0;

/**
 * Each screen of one app beside the same screen of the other, in both modes, one right after
 * the other. A pair that differs is taken again, twice at most, before it counts.
 */
async function compareApps(
  emulator: Emulator,
  label: string,
  pair: [reference: App, referenceTheme: Theme, library: App, libraryTheme: Theme],
  list: { name: string; query: string }[],
): Promise<Map<string, Buffer>> {
  const [reference, referenceTheme, library, libraryTheme] = pair;
  const drawn = new Map<string, Buffer>();
  let differ = 0;
  for (const mode of ["light", "dark"]) {
    emulator.adb(["shell", "cmd", "uimode", "night", mode === "dark" ? "yes" : "no"]);
    await sleep(1500);
    for (const screen of list) {
      const name = `${screen.name}-${mode}.png`;
      let pixels: number | undefined = 0;
      let pictures: [Buffer, Buffer] = [Buffer.alloc(0), Buffer.alloc(0)];
      for (let attempt = 1; attempt <= 3; attempt++) {
        pictures = [
          await shoot(emulator, reference, reference.link(screen.query, referenceTheme)),
          await shoot(emulator, library, library.link(screen.query, libraryTheme)),
        ];
        pixels = pictures[0].equals(pictures[1])
          ? 0
          : differingPixels(decodePng(pictures[0]), decodePng(pictures[1]));
        if (pixels === 0) break;
        if (attempt < 3) console.log(`  ${label}: ${name} differs; taken again`);
      }
      drawn.set(name, pictures[1]);
      if (pixels === 0) continue;
      differ++;
      const where = join(out, label.replaceAll(/\W+/g, "-"));
      await mkdir(where, { recursive: true });
      await writeFile(join(where, `reference-${name}`), pictures[0]);
      await writeFile(join(where, `library-${name}`), pictures[1]);
      console.log(`  ${label}: ${name} differs in ${pixels ?? "size, not"} pixels`);
    }
  }
  differences += differ;
  console.log(`${label}: ${list.length * 2} screens compared, ${differ} differ`);
  return drawn;
}

/** Fails the run when the custom theme changed none of an app's screens. */
function checkThemed(label: string, plain: Map<string, Buffer>, branded: Map<string, Buffer>) {
  const same = [...plain].filter(([name, picture]) => branded.get(name)?.equals(picture));
  console.log(
    `${label}: the custom theme changes ${plain.size - same.length} of ${plain.size} screens`,
  );
  if (same.length === plain.size) {
    differences++;
    console.log(`  ${label}: the custom theme changed nothing`);
  }
}

// ----------------------------------------------------------------------------- the run

const packageDir = options["skip-build"]
  ? join(root, "npm/dist/react-native/package")
  : await buildPackage(join(root, "npm/dist/react-native"));
await rm(work, { recursive: true, force: true });
await rm(out, { recursive: true, force: true });
await mkdir(work, { recursive: true });
const packed = JSON.parse(
  execFileSync("npm", ["pack", packageDir, "--pack-destination", work, "--json"], {
    encoding: "utf8",
  }),
) as { filename: string }[];
const tarball = join(work, packed[0]?.filename ?? "");

let xds = options.xds;
if (!xds) {
  run("cargo", ["build", "--quiet", "--package", "xds"], root);
  xds = join(root, "target/debug/xds");
}
await copyFile(xds, join(work, "xds"));
xds = join(work, "xds");

// The scaffolded project, named as the library is, and the custom theme as its token build
// writes it.
const project = join(work, "scaffold");
run(xds, ["create", project, "--name", "xds", "--targets", "mobile-react-native", "--yes"], work);
run("pnpm", ["install", "--silent"], project);
const tokensFile = join(project, "packages/tokens/src/generated/tokens.ts");
const defaultTokens = await readFile(tokensFile, "utf8");
const brandModel = await themeModel(
  project,
  JSON.parse(await readFile(themeFile, "utf8")),
  await readContract(project),
);
brandModel.icons = await loadIcons(join(project, "design/icons"));
const brandTokens = emitTypeScript(brandModel);

const expo = await expoConsumer(xds, project, tarball);
const newest = await bareConsumer("XdsNewest", NEWEST, project, tarball);
const oldest = await bareConsumer("XdsOldest", OLDEST, project, tarball);
checkJavaScript(expo, true);
checkJavaScript(newest, false);
checkJavaScript(oldest, false);
console.log("All three apps type-check against the package and bundle for iOS and Android.");

if (!options["skip-android"]) {
  // The scaffolded app, built once for each theme.
  const mobile = join(project, "apps/mobile");
  run("pnpm", ["exec", "expo", "prebuild", "--platform", "android", "--no-install"], mobile);
  const scaffolded = new Map<Theme, string>();
  for (const theme of THEMES) {
    await writeFile(tokensFile, theme === "brand" ? brandTokens : defaultTokens);
    const apk = join(work, `scaffold-${theme}.apk`);
    // Metro reads the workspace's packages, which Gradle does not watch: the bundle is made again.
    await copyFile(assemble(join(mobile, "android"), true), apk);
    scaffolded.set(theme, apk);
  }
  await writeFile(tokensFile, defaultTokens);
  run("npx", ["expo", "prebuild", "--platform", "android", "--no-install"], expo.dir);
  const apks = new Map<App, string>([
    [expo, assemble(join(expo.dir, "android"))],
    [newest, assemble(join(newest.dir, "android"))],
    [oldest, assemble(join(oldest.dir, "android"))],
  ]);
  const reference: App = {
    dir: mobile,
    activity: "com.example.xds.mobile/.MainActivity",
    link: (query) => `xds://design?${query}`,
  };

  const list = await screens(project);
  const log = join(work, "emulator.log");
  const emulator = await startEmulator(work, log);
  try {
    for (const apk of apks.values()) emulator.adb(["install", "-r", "-t", apk]);
    const expoDrawn = new Map<Theme, Map<string, Buffer>>();
    const bareDrawn = new Map<Theme, Map<string, Buffer>>();
    for (const theme of THEMES) {
      emulator.adb(["install", "-r", "-t", scaffolded.get(theme) ?? ""]);
      expoDrawn.set(
        theme,
        await compareApps(
          emulator,
          `expo, ${theme} theme`,
          [reference, "default", expo, theme],
          list,
        ),
      );
      bareDrawn.set(
        theme,
        await compareApps(
          emulator,
          `react native ${OLDEST} and ${NEWEST}, ${theme} theme`,
          [newest, theme, oldest, theme],
          list,
        ),
      );
    }
    checkThemed("expo", expoDrawn.get("default") ?? new Map(), expoDrawn.get("brand") ?? new Map());
    checkThemed(
      "react native",
      bareDrawn.get("default") ?? new Map(),
      bareDrawn.get("brand") ?? new Map(),
    );
  } finally {
    emulator.stop();
  }
}

console.log(
  differences === 0
    ? `${NAME} installs, type-checks and bundles in an Expo app and in React Native ${OLDEST} and ${NEWEST} apps${options["skip-android"] ? "" : ", and draws the design preview as the scaffolded app does, with the default theme and a custom one"}.`
    : `${differences} screens differ. Both sides of each are in ${out}.`,
);
process.exitCode = differences === 0 ? 0 : 1;
