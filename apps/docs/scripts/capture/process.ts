// Running the tools a capture needs, logging what they print, and undoing what a run set up
// (the simulator, the emulator) even when it fails or is interrupted.

import { type ChildProcess, spawn, spawnSync } from "node:child_process";
import { closeSync, existsSync, openSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type Options = {
  cwd?: string;
  env?: Record<string, string | undefined>;
  /** A file that gets what the command prints, instead of the caller. */
  log?: string;
  /** What the command reads on standard input. */
  input?: string;
};

/** A command's failure, with the end of what it printed, which is where the reason usually is. */
function failure(
  command: string,
  args: string[],
  code: number | null,
  printed: string,
  log?: string,
) {
  const text = log && existsSync(log) ? readFileSync(log, "utf8") : printed;
  const where = log ? ` (all of its output is in ${log})` : "";
  const tail = text.trimEnd().split("\n").slice(-25).join("\n");
  return new Error(
    `${[command, ...args].join(" ")} failed (${code ?? "killed"})${where}:\n${tail}`,
  );
}

/** Runs a command to its end and returns what it printed, unless that went to `log`. */
export function run(command: string, args: string[], options: Options = {}): Promise<string> {
  const out = options.log ? openSync(options.log, "a") : "pipe";
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: { ...process.env, ...options.env },
    stdio: [options.input === undefined ? "ignore" : "pipe", out, out],
  });
  if (options.input !== undefined) child.stdin?.end(options.input);
  let printed = "";
  child.stdout?.on("data", (chunk: Buffer) => (printed += chunk));
  child.stderr?.on("data", (chunk: Buffer) => (printed += chunk));
  return new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code) => {
      if (typeof out === "number") closeSync(out);
      if (code === 0) resolve(printed);
      else reject(failure(command, args, code, printed, options.log));
    });
  });
}

/** Runs a command to its end, for the steps that undo a run: they must work in a signal handler. */
export function runSync(command: string, args: string[], options: Options = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd,
    env: { ...process.env, ...options.env },
    encoding: "utf8",
    input: options.input,
  });
}

/** Starts a command that keeps running, such as a recording or the emulator. */
export function start(command: string, args: string[], options: Options = {}): ChildProcess {
  const out = options.log ? openSync(options.log, "a") : "ignore";
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: { ...process.env, ...options.env },
    stdio: ["ignore", out, out],
  });
  if (typeof out === "number") child.on("close", () => closeSync(out));
  return child;
}

/** Waits for a command started with `start` to end, and reports whether it did in time. */
export function ended(child: ChildProcess, seconds: number): Promise<boolean> {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve(true);
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), seconds * 1000);
    child.on("close", () => {
      clearTimeout(timer);
      resolve(true);
    });
  });
}

/** Stops a command started with `start` the way Control-C would, and waits for it to finish. */
export async function stop(child: ChildProcess) {
  const end = ended(child, 30);
  child.kill("SIGINT");
  if (!(await end)) child.kill("SIGKILL");
}

/** Whether a command is on PATH. */
export function have(command: string) {
  return spawnSync(command, ["-version"], { stdio: "ignore" }).error === undefined;
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Splits a run of arguments that hold no spaces, such as a command's flags. */
export const words = (text: string) => text.split(" ");

/** Waits until `ready` returns true, polling every second, or fails after `seconds`. */
export async function waitFor(what: string, seconds: number, ready: () => Promise<boolean>) {
  for (let elapsed = 0; elapsed < seconds; elapsed++) {
    if (await ready()) return;
    await sleep(1000);
  }
  throw new Error(`Gave up waiting for ${what} after ${seconds} s`);
}

// ---------------------------------------------------------------- undoing a run

type Step = { what: string; step: () => void };
const undo: Step[] = [];

/** Takes a step off the list, and reports whether it was still on it. */
function take(entry: Step) {
  const index = undo.indexOf(entry);
  if (index !== -1) undo.splice(index, 1);
  return index !== -1;
}

function runStep(entry: Step) {
  if (!take(entry)) return;
  try {
    entry.step();
  } catch (error) {
    console.error(`Could not ${entry.what}: ${(error as Error).message}`);
  }
}

/**
 * Registers a step that undoes something the run set up. Whatever is still registered when the
 * run ends, or is stopped, runs then, last first. `now` runs the step at once, and `forget` drops
 * it, for a caller that has undone the thing another way.
 */
export function onExit(what: string, step: () => void) {
  const entry = { what, step };
  undo.push(entry);
  return { now: () => runStep(entry), forget: () => void take(entry) };
}

/** Runs every step registered with `onExit` that has not run yet. */
export function cleanUp() {
  for (let next = undo.at(-1); next; next = undo.at(-1)) runStep(next);
}

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"] as const) {
  process.on(signal, () => {
    console.error(`\nStopped by ${signal}: undoing what this run set up.`);
    cleanUp();
    process.exit(130);
  });
}

// ---------------------------------------------------------------- device ids

const ids = new Set<string>();

/**
 * Remembers a simulator's UDID or an emulator's serial, so that `scrub` can take it out of the
 * logs this run leaves behind. Neither is ever written to a file the repository keeps.
 */
export function secret(id: string) {
  ids.add(id);
  return id;
}

/** Replaces every remembered id in the files under `directory` with a placeholder. */
export function scrub(directory: string) {
  if (!existsSync(directory) || ids.size === 0) return;
  for (const entry of readdirSync(directory, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const file = join(entry.parentPath, entry.name);
    let text = readFileSync(file, "latin1");
    let changed = false;
    for (const id of ids) {
      if (!text.includes(id)) continue;
      text = text.replaceAll(id, "<device>");
      changed = true;
    }
    if (changed) writeFileSync(file, text, "latin1");
  }
}
