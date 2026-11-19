// A simulator's id and an emulator's id look different. Ask Flutter which devices support
// this platform, and let the developer select one explicitly when several are connected.
import { spawn, spawnSync } from "node:child_process";

const [platform, ...args] = process.argv.slice(2);
const explicit = args.some((arg) => arg === "-d" || arg === "--device-id" || arg.startsWith("--device-id="));
// mise launches the SDK's platform-specific wrapper and passes each argument separately.
const flutter = ["exec", "--", "flutter"];
if (!explicit) {
  const result = spawnSync("mise", [...flutter, "devices", "--machine"], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || "Flutter could not list devices.");
  const devices = JSON.parse(result.stdout).filter(
    (device) => device.isSupported &&
      (device.targetPlatform === platform || device.targetPlatform.startsWith(`${platform}-`)),
  );
  if (devices.length === 0) throw new Error(`Start or connect a device for ${platform}.`);
  if (devices.length > 1) throw new Error("Choose a device from flutter devices with --device-id.");
  args.unshift("-d", devices[0].id);
}
const app = spawn("mise", [...flutter, "run", ...args], { stdio: "inherit" });
app.on("error", (error) => { throw error; });
app.on("exit", (code) => { process.exitCode = code ?? 1; });
