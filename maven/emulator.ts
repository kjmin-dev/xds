// An Android emulator made for one run of the consumer check: an AVD in the run's own directory
// (ANDROID_AVD_HOME), so the AVDs in ~/.android/avd are never seen, made from a system image
// already installed, booted without a window, and deleted when the run ends. Every adb command
// names its serial, so a phone that is plugged in is never touched.

import { type ChildProcess, execFileSync, spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, openSync, readdirSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const NAME = "xds-maven-consumer";
const ABI = process.arch === "arm64" ? "arm64-v8a" : "x86_64";
/** The kinds of system image that boot to a phone's home screen, most complete first. */
const TAGS = ["google_apis_playstore", "google_apis", "default"];

export function androidHome(): string {
  const home = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT;
  if (!home || !existsSync(home)) {
    throw new Error("The Android check needs the Android SDK: set ANDROID_HOME to its directory.");
  }
  return home;
}

/** The newest installed phone system image for this machine's processor. */
function systemImage(home: string): string {
  const images = join(home, "system-images");
  const level = (name: string) =>
    name
      .replace(/^android-/, "")
      .split(".")
      .map(Number);
  const found = (existsSync(images) ? readdirSync(images) : [])
    .filter((name) => level(name).every((part) => !Number.isNaN(part)))
    .flatMap((name) =>
      TAGS.filter((tag) => existsSync(join(images, name, tag, ABI, "system.img"))).map((tag) => ({
        name,
        tag,
      })),
    )
    .sort((a, b) => {
      const [x, y] = [level(a.name), level(b.name)];
      return (
        (x[0] ?? 0) - (y[0] ?? 0) ||
        (x[1] ?? 0) - (y[1] ?? 0) ||
        TAGS.indexOf(b.tag) - TAGS.indexOf(a.tag)
      );
    })
    .at(-1);
  if (!found) {
    throw new Error(
      `No Android system image for ${ABI} is installed in ${images}. Install one with:\n` +
        `  sdkmanager "system-images;android-36;google_apis;${ABI}"`,
    );
  }
  return `system-images;${found.name};${found.tag};${ABI}`;
}

/** A console port for the emulator: it takes that one and the next, and its serial names it. */
async function freePort(): Promise<number> {
  const free = (port: number) =>
    new Promise<boolean>((resolve) => {
      const server = createServer();
      server.once("error", () => resolve(false));
      server.listen(port, "127.0.0.1", () => server.close(() => resolve(true)));
    });
  for (let port = 5554; port <= 5682; port += 2) {
    if ((await free(port)) && (await free(port + 1))) return port;
  }
  throw new Error("No free emulator port between 5554 and 5683");
}

export type Emulator = {
  /** Runs `adb -s <serial> <args>` and returns what it printed. */
  adb(args: string[]): Buffer;
  /** The screen as a PNG. */
  screenshot(): Buffer;
  stop(): void;
};

/** Makes the emulator, boots it, and readies it for pictures that do not change on their own. */
export async function startEmulator(work: string, log: string): Promise<Emulator> {
  const home = androidHome();
  const image = systemImage(home);
  const avdHome = join(work, "avd");
  const env = {
    ...process.env,
    ANDROID_HOME: home,
    ANDROID_SDK_ROOT: home,
    ANDROID_AVD_HOME: avdHome,
  };
  const avdmanager = join(home, "cmdline-tools/latest/bin/avdmanager");
  const adbPath = join(home, "platform-tools/adb");

  // The newest Pixel the tools know without a Pro or a Fold: a common phone's screen.
  const definitions = execFileSync(avdmanager, ["list", "device", "-c"], { env, encoding: "utf8" })
    .split("\n")
    .map((id) => id.trim());
  const number = (id: string) => Number(/^pixel_(\d+)$/.exec(id)?.[1] ?? Number.NaN);
  const definition = definitions
    .filter((id) => !Number.isNaN(number(id)))
    .sort((a, b) => number(a) - number(b))
    .at(-1);
  if (!definition) throw new Error("avdmanager knows no Pixel device definition");
  console.log(`  emulator: ${definition}, ${image}`);

  rmSync(avdHome, { recursive: true, force: true });
  // avdmanager writes to ~/.android/avd when ANDROID_AVD_HOME names no directory.
  mkdirSync(avdHome, { recursive: true });
  execFileSync(
    avdmanager,
    ["create", "avd", "--name", NAME, "--package", image, "--device", definition],
    {
      env,
      // It asks whether to make a custom hardware profile.
      input: "no\n",
      stdio: ["pipe", openSync(log, "a"), openSync(log, "a")],
    },
  );
  const port = await freePort();
  const serial = `emulator-${port}`;
  // No snapshot: each run boots the same fresh system, and nothing is saved when it stops.
  const emulator: ChildProcess = spawn(
    join(home, "emulator/emulator"),
    [
      "-avd",
      NAME,
      "-port",
      String(port),
      "-no-window",
      "-no-audio",
      "-no-boot-anim",
      "-no-snapshot",
      // Room for two apps in turn and the system, so that neither waits on the other.
      "-memory",
      "4096",
      "-cores",
      "4",
      "-gpu",
      "swiftshader_indirect",
    ],
    { env, stdio: ["ignore", openSync(log, "a"), openSync(log, "a")] },
  );
  // Under load the connection to the emulator drops for a moment now and then: adb exits with
  // 255 and the command has not run. It waits for the device to come back and runs it again.
  // Every command the check sends may be sent twice.
  const adb = (args: string[]) => {
    for (let attempt = 1; ; attempt++) {
      try {
        return execFileSync(adbPath, ["-s", serial, ...args], {
          maxBuffer: 1 << 28,
          stdio: ["ignore", "pipe", "pipe"],
        });
      } catch (error) {
        if (attempt === 3) throw error;
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2000);
        spawnSync(adbPath, ["-s", serial, "wait-for-device"], { timeout: 120_000 });
      }
    }
  };
  const stop = () => {
    spawnSync(adbPath, ["-s", serial, "emu", "kill"]);
    emulator.kill("SIGKILL");
    spawnSync(avdmanager, ["delete", "avd", "--name", NAME], { env });
    rmSync(avdHome, { recursive: true, force: true });
  };
  process.once("SIGINT", () => {
    stop();
    process.exit(130);
  });

  try {
    const deadline = Date.now() + 600_000;
    for (;;) {
      if (emulator.exitCode !== null) throw new Error(`The emulator quit; see ${log}`);
      const booted = spawnSync(adbPath, ["-s", serial, "shell", "getprop", "sys.boot_completed"], {
        encoding: "utf8",
      });
      if (booted.stdout.trim() === "1") break;
      if (Date.now() > deadline)
        throw new Error(`The emulator did not boot in ten minutes; see ${log}`);
      await sleep(2000);
    }
    // The serial names a port, which another emulator could have taken in the meantime.
    const avd = adb(["emu", "avd", "name"]).toString().split(/\r?\n/)[0]?.trim();
    if (avd !== NAME) throw new Error(`${serial} is not this run's emulator (it runs ${avd})`);

    const shell = (command: string) => adb(["shell", ...command.split(" ")]);
    // Animations jump to their end, which is also what the components do when less motion is
    // asked for: a picture taken at any moment shows the same thing.
    for (const scale of [
      "window_animation_scale",
      "transition_animation_scale",
      "animator_duration_scale",
    ]) {
      shell(`settings put global ${scale} 0`);
    }
    shell("svc power stayon true");
    shell("settings put system screen_off_timeout 2147483647");
    shell("wm dismiss-keyguard");
    // System UI's demo mode: the same clock, battery and signal in every picture.
    shell("settings put global sysui_demo_allowed 1");
    for (const command of [
      "enter",
      "clock -e hhmm 0941",
      "battery -e level 100 -e plugged false",
      "network -e wifi show -e level 4 -e fully true",
      "network -e mobile hide",
      "notifications -e visible false",
    ]) {
      shell(`am broadcast -a com.android.systemui.demo -e command ${command}`);
    }
    await sleep(2000);
  } catch (error) {
    stop();
    throw error;
  }
  return { adb, screenshot: () => adb(["exec-out", "screencap", "-p"]), stop };
}
