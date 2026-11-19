// Start the selected app’s Vite server and close its entire process tree when Electron quits.
import { spawn, spawnSync } from "node:child_process";
import { createInterface } from "node:readline";
import electron from "electron";

// The npm package exports a path when loaded by Node outside Electron.
const executable: unknown = electron;
if (typeof executable !== "string") throw new Error("Run this script with Node");
const url = "http://localhost:5178";
const windows = process.platform === "win32";
const vite = spawn(
  "pnpm",
  ["run", "web", "--host", "localhost", "--port", "5178", "--strictPort"],
  {
    // Windows installs pnpm as a command script. Only these fixed Vite arguments reach the shell.
    shell: windows,
    detached: !windows,
    stdio: ["ignore", "pipe", "inherit"],
    env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" },
  },
);
let desktop: ReturnType<typeof spawn> | undefined;

function stop() {
  desktop?.kill();
  if (!vite.pid || vite.exitCode !== null || vite.signalCode !== null) return;
  if (windows) spawnSync("taskkill", ["/pid", String(vite.pid), "/t", "/f"], { stdio: "ignore" });
  else process.kill(-vite.pid, "SIGTERM");
}
process.once("SIGINT", stop);
process.once("SIGTERM", stop);

try {
  // Only our child can announce readiness. A server already listening on the port cannot
  // accidentally become the desktop window's origin.
  const lines = createInterface({ input: vite.stdout });
  const result = await new Promise<number>((resolve, reject) => {
    vite.once("error", reject);
    vite.once("exit", (code) => resolve(code ?? 1));
    lines.on("line", (line) => {
      console.log(line);
      if (desktop || !line.includes(url)) return;
      desktop = spawn(executable, [".", ...process.argv.slice(2)], {
        stdio: "inherit",
        env: { ...process.env, DEV_SERVER_URL: url },
      });
      desktop.once("error", reject);
      desktop.once("exit", (code) => resolve(code ?? 0));
    });
  });
  process.exitCode = result;
} finally {
  stop();
}
