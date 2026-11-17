// Android: a Release build of apps/mobile, on an emulator made for this run. Its AVD lives in the
// task's build directory (ANDROID_AVD_HOME), so the AVDs in ~/.android/avd are never seen, let
// alone changed; it is made from a system image already installed, since this task downloads
// nothing into the SDK, and it is deleted with the emulator after the run.

import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { join } from "node:path";
import { appConfig, type Device, maestroSetup, mobile, prebuild, shoot } from "./mobile.ts";
import { ended, onExit, run, runSync, secret, sleep, start, waitFor, words } from "./process.ts";
import type { CaptureName, Taken, Workspace } from "./types.ts";

const NAME = "xds-docs-capture";
const ABI = process.arch === "arm64" ? "arm64-v8a" : "x86_64";
/** The kinds of system image that boot to a phone's home screen, most complete first. */
const TAGS = ["google_apis_playstore", "google_apis", "default"];

function sdk() {
  const home = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT;
  if (!home || !existsSync(home))
    throw new Error("Android captures need the Android SDK: set ANDROID_HOME to its directory.");
  return home;
}

/** The newest installed phone system image for this machine's processor. */
function systemImage(home: string) {
  const images = join(home, "system-images");
  const api = (name: string) =>
    name
      .replace(/^android-/, "")
      .split(".")
      .map(Number);
  const found = (existsSync(images) ? readdirSync(images) : [])
    .filter((level) => api(level).every((part) => !Number.isNaN(part)))
    .flatMap((level) =>
      TAGS.filter((tag) => existsSync(join(images, level, tag, ABI, "system.img"))).map((tag) => ({
        level,
        tag,
      })),
    )
    .sort((a, b) => {
      const [x, y] = [api(a.level), api(b.level)];
      return (
        (x[0] ?? 0) - (y[0] ?? 0) ||
        (x[1] ?? 0) - (y[1] ?? 0) ||
        TAGS.indexOf(b.tag) - TAGS.indexOf(a.tag)
      );
    })
    .at(-1);
  if (!found) {
    const platforms = existsSync(join(home, "platforms"))
      ? readdirSync(join(home, "platforms"))
      : [];
    const level = platforms.sort().at(-1) ?? "android-36";
    throw new Error(
      `No Android system image for ${ABI} is installed in ${images}. This task downloads ` +
        `nothing into the SDK; install one with:\n  sdkmanager "system-images;${level};google_apis;${ABI}"`,
    );
  }
  return `system-images;${found.level};${found.tag};${ABI}`;
}

/** Builds the app's release APK for this machine's processor only, which saves most of the time. */
async function build(workspace: Workspace) {
  const log = join(workspace.logs, "android-build.log");
  const android = join(mobile, "android");
  await prebuild("android", workspace.build, log);
  console.log("  gradlew assembleRelease");
  await run(
    join(android, process.platform === "win32" ? "gradlew.bat" : "gradlew"),
    // Neither a Gradle daemon nor a Kotlin one is left running after the build.
    words(
      `assembleRelease -PreactNativeArchitectures=${ABI} --console=plain --no-daemon ` +
        "-Pkotlin.compiler.execution.strategy=in-process",
    ),
    { cwd: android, log },
  );
  return join(android, "app/build/outputs/apk/release/app-release.apk");
}

/** A console port for the emulator: it takes that one and the next, and its serial names it. */
async function freePort() {
  const free = (port: number) =>
    new Promise<boolean>((resolve) => {
      const server = createServer();
      server.once("error", () => resolve(false));
      server.listen(port, "127.0.0.1", () => server.close(() => resolve(true)));
    });
  for (let port = 5554; port <= 5682; port += 2)
    if ((await free(port)) && (await free(port + 1))) return port;
  throw new Error("No free emulator port between 5554 and 5683");
}

export async function takeAndroid(names: CaptureName[], workspace: Workspace): Promise<Taken> {
  const home = sdk();
  const image = systemImage(home);
  const apk = await build(workspace);
  const log = join(workspace.logs, "android-emulator.log");
  const avdHome = join(workspace.build, "avd");
  const env = { ANDROID_HOME: home, ANDROID_SDK_ROOT: home, ANDROID_AVD_HOME: avdHome };
  const avdmanager = join(home, "cmdline-tools/latest/bin/avdmanager");
  const adb = join(home, "platform-tools/adb");

  // The newest Pixel Pro the tools know, as the iOS captures use the newest iPhone Pro.
  const definitions = (await run(avdmanager, ["list", "device", "-c"], { env })).split("\n");
  const number = (id: string) => Number(/^pixel_(\d+)_pro$/.exec(id.trim())?.[1] ?? Number.NaN);
  const definition = definitions
    .map((id) => id.trim())
    .filter((id) => !Number.isNaN(number(id)))
    .sort((a, b) => number(a) - number(b))
    .at(-1);
  if (!definition) throw new Error("avdmanager knows no Pixel Pro device definition");
  const phone = definition.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

  console.log(`  emulator: ${phone}, ${image}`);
  rmSync(avdHome, { recursive: true, force: true });
  // avdmanager writes to ~/.android/avd when ANDROID_AVD_HOME names no directory.
  mkdirSync(avdHome, { recursive: true });
  await run(
    avdmanager,
    ["create", "avd", "--name", NAME, "--package", image, "--device", definition],
    {
      env,
      log,
      // It asks whether to make a custom hardware profile.
      input: "no\n",
    },
  );
  const removeAvd = onExit("delete the AVD", () => {
    runSync(avdmanager, ["delete", "avd", "--name", NAME], { env });
    rmSync(avdHome, { recursive: true, force: true });
  });
  const port = await freePort();
  // Without a snapshot, nothing is saved when it stops, and each run boots the same fresh system.
  const options = `-port ${port} -no-window -no-audio -no-boot-anim -no-snapshot -gpu swiftshader_indirect`;
  const emulator = start(join(home, "emulator/emulator"), ["-avd", NAME, ...words(options)], {
    env,
    log,
  });
  const serial = secret(`emulator-${port}`);
  // When the run is stopped there is no time to wait for it to quit, and its AVD goes anyway.
  const killEmulator = onExit("stop the emulator", () => {
    runSync(adb, ["-s", serial, "emu", "kill"]);
    emulator.kill("SIGKILL");
  });
  try {
    const shell = (...args: string[]) => run(adb, ["-s", serial, "shell", ...args], { log });
    await waitFor("the emulator to boot", 600, async () => {
      if (emulator.exitCode !== null) throw new Error(`The emulator quit; see ${log}`);
      const booted = runSync(adb, ["-s", serial, "shell", "getprop", "sys.boot_completed"]);
      return booted.stdout.trim() === "1";
    });
    // The serial names a port, which another emulator could have taken in the meantime.
    const avd = runSync(adb, ["-s", serial, "emu", "avd", "name"]).stdout.split(/\r?\n/)[0]?.trim();
    if (avd !== NAME) throw new Error(`${serial} is not this run's emulator (it runs ${avd})`);
    // Not through `shell`, whose output goes to the log.
    const getprop = ["-s", serial, "shell", "getprop", "ro.build.version.release"];
    const release = (await run(adb, getprop)).trim();
    if (!release) throw new Error(`${serial} reports no Android version`);

    await run(adb, ["-s", serial, "install", "-r", apk], { log });

    // System UI's demo mode: the same clock, battery and signal in every capture, and no
    // notification icons. It is set again before each capture: a setting made as soon as the
    // system reports that it has booted does not always last.
    const demoMode = async () => {
      await shell("settings", "put", "global", "sysui_demo_allowed", "1");
      for (const command of [
        "enter",
        "clock -e hhmm 0941",
        "battery -e level 100 -e plugged false",
        "network -e wifi show -e level 4 -e fully true",
        "network -e mobile hide",
        "network -e satellite hide",
        "notifications -e visible false",
      ])
        await shell(...words(`am broadcast -a com.android.systemui.demo -e command ${command}`));
      // System UI redraws the bars.
      await sleep(2000);
    };
    const device: Device = {
      id: serial,
      appId: appConfig().android,
      setMode: async (mode) => {
        await shell("cmd", "uimode", "night", mode === "dark" ? "yes" : "no");
        await demoMode();
      },
      screenshot: async (file) => {
        await shell("screencap", "-p", "/data/local/tmp/capture.png");
        await run(adb, ["-s", serial, "pull", "/data/local/tmp/capture.png", file], { log });
      },
    };
    const shots = await shoot(device, names, {
      directory: join(workspace.maestro, "runs"),
      env: maestroSetup(workspace.maestro),
      raw: workspace.raw,
      log: join(workspace.logs, "android-maestro.log"),
    });
    return { source: `a Release build in the Android ${release} emulator (${phone})`, shots };
  } finally {
    // `emu kill` asks it to quit, which lets it stop the helpers it started.
    runSync(adb, ["-s", serial, "emu", "kill"]);
    if (await ended(emulator, 30)) killEmulator.forget();
    else killEmulator.now();
    removeAvd.now();
  }
}
