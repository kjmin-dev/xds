// Ask Flutter for devices: an Android emulator id and an iOS simulator id look nothing alike.
import { spawn, spawnSync } from "node:child_process";

const platform = process.argv[2];
const args = process.argv.slice(3);
const windows = process.platform === "win32";
const flutter = windows ? "flutter.bat" : "flutter";
const result = spawnSync(flutter, ["devices", "--machine"], { encoding: "utf8", shell: windows });
if (result.status !== 0) throw new Error(result.stderr || "Flutter could not list devices.");
const devices = JSON.parse(result.stdout).filter(
  (device) => device.isSupported && (device.targetPlatform === platform || device.targetPlatform.startsWith(platform + "-")),
);
if (!args.includes("-d") && !args.includes("--device-id")) {
  if (devices.length !== 1) {
    throw new Error(devices.length ? "Choose one with --device-id from flutter devices." : `Start or connect an ${platform} device.`);
  }
  args.unshift("-d", devices[0].id);
}
const app = spawn(flutter, ["run", ...args], { stdio: "inherit", shell: windows });
app.on("error", (error) => { throw error; });
app.on("exit", (code) => { process.exitCode = code ?? 1; });
