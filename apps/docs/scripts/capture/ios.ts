// iOS: a Release build of apps/mobile for the simulator, on a simulator made for this run from
// the newest iOS runtime installed and the newest iPhone Pro it supports, and deleted after it.

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { appConfig, type Device, maestroSetup, mobile, prebuild, shoot } from "./mobile.ts";
import { onExit, run, runSync, secret, start, words } from "./process.ts";
import type { CaptureName, Taken, Workspace } from "./types.ts";

const NAME = "xds-docs-capture";

type Runtime = {
  identifier: string;
  version: string;
  platform: string;
  isAvailable: boolean;
  supportedDeviceTypes: { identifier: string; name: string }[];
};

const newer = (a: string, b: string) => {
  const [x, y] = [a, b].map((version) => version.split(".").map(Number));
  for (let i = 0; i < Math.max(x?.length ?? 0, y?.length ?? 0); i++) {
    const difference = (x?.[i] ?? 0) - (y?.[i] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
};

async function simulatorKind() {
  const { runtimes } = JSON.parse(await run("xcrun", ["simctl", "list", "runtimes", "--json"])) as {
    runtimes: Runtime[];
  };
  const runtime = runtimes
    .filter((entry) => entry.platform === "iOS" && entry.isAvailable)
    .sort((a, b) => newer(a.version, b.version))
    .at(-1);
  if (!runtime)
    throw new Error(
      "No iOS Simulator runtime is installed: add one in Xcode > Settings > Components.",
    );
  const number = (name: string) => Number(/^iPhone (\d+) Pro$/.exec(name)?.[1] ?? Number.NaN);
  const deviceType = runtime.supportedDeviceTypes
    .filter((type) => !Number.isNaN(number(type.name)))
    .sort((a, b) => number(a.name) - number(b.name))
    .at(-1);
  if (!deviceType) throw new Error(`The iOS ${runtime.version} runtime supports no iPhone Pro.`);
  return { runtime, deviceType };
}

/** Builds the app for the simulator, without signing, and returns the path of the .app. */
async function build(workspace: Workspace) {
  const log = join(workspace.logs, "ios-build.log");
  const ios = join(mobile, "ios");
  const generated = await prebuild("ios", workspace.build, log);
  if (generated || !existsSync(join(ios, "Pods/Manifest.lock"))) {
    console.log("  pod install");
    await run("pod", ["install"], { cwd: ios, env: { COCOAPODS_DISABLE_STATS: "true" }, log });
  }
  const project = readdirSync(ios).find((name) => name.endsWith(".xcworkspace"));
  if (!project) throw new Error("expo prebuild wrote no Xcode workspace");
  const derivedData = join(workspace.build, "DerivedData");
  console.log("  xcodebuild (Release, for the simulator)");
  const arch = process.arch === "arm64" ? "arm64" : "x86_64";
  const scheme = project.replace(/\.xcworkspace$/, "");
  await run(
    "xcodebuild",
    [
      ...words(`-workspace ${project} -scheme ${scheme} -configuration Release`),
      ...words(`-sdk iphonesimulator -arch ${arch} CODE_SIGNING_ALLOWED=NO`),
      "-derivedDataPath",
      derivedData,
      "build",
    ],
    { cwd: ios, env: { CI: "1" }, log },
  );
  const products = join(derivedData, "Build/Products/Release-iphonesimulator");
  const app = readdirSync(products).find((name) => name.endsWith(".app"));
  if (!app) throw new Error(`xcodebuild left no .app in ${products}`);
  return join(products, app);
}

/** Deletes the simulators this task made, by their name: one a run that crashed left behind. */
function deleteSimulators() {
  const listed = runSync("xcrun", ["simctl", "list", "devices", "--json"]);
  const { devices } = JSON.parse(listed.stdout) as {
    devices: Record<string, { name: string; udid: string }[]>;
  };
  for (const device of Object.values(devices).flat()) {
    if (device.name !== NAME) continue;
    runSync("xcrun", ["simctl", "shutdown", device.udid]);
    runSync("xcrun", ["simctl", "delete", device.udid]);
  }
}

export async function takeIos(names: CaptureName[], workspace: Workspace): Promise<Taken> {
  if (process.platform !== "darwin") throw new Error("iOS captures need macOS with Xcode.");
  const app = await build(workspace);
  const { runtime, deviceType } = await simulatorKind();
  const log = join(workspace.logs, "ios-simulator.log");
  deleteSimulators();
  console.log(`  simulator: ${deviceType.name}, iOS ${runtime.version}`);
  const kind = [deviceType.identifier, runtime.identifier];
  const created = await run("xcrun", ["simctl", "create", NAME, ...kind]);
  const udid = secret(created.trim());
  const remove = onExit("delete the simulator", deleteSimulators);
  try {
    const simctl = (...args: string[]) => run("xcrun", ["simctl", ...args], { log });
    await simctl("boot", udid);
    await simctl("bootstatus", udid, "-b");
    // The same clock, battery and signal in every capture, so that a new one differs only where
    // the component does.
    const bars = words(
      "--time 9:41 --dataNetwork wifi --wifiMode active --wifiBars 3 --cellularMode active " +
        "--cellularBars 4 --batteryState discharging --batteryLevel 100",
    );
    await simctl("status_bar", udid, "override", ...bars);
    await simctl("install", udid, app);
    const device: Device = {
      id: udid,
      appId: appConfig().ios,
      setMode: async (mode) => void (await simctl("ui", udid, "appearance", mode)),
      screenshot: async (file) => void (await simctl("io", udid, "screenshot", "--type=png", file)),
      record: (file) =>
        start("xcrun", ["simctl", "io", udid, "recordVideo", "--codec=h264", "--force", file], {
          log,
        }),
    };
    const shots = await shoot(device, names, {
      directory: join(workspace.maestro, "runs"),
      env: maestroSetup(workspace.maestro),
      raw: workspace.raw,
      log: join(workspace.logs, "ios-maestro.log"),
    });
    return {
      source: `a Release build in the iOS ${runtime.version} Simulator (${deviceType.name})`,
      shots,
    };
  } finally {
    remove.now();
  }
}
