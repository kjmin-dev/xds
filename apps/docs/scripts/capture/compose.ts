// Compose: the JVM renderer in kotlin/ui draws the screens off screen, on any OS, in a phone-sized
// window at 2x (`./gradlew :ui:renderPreview -Pcaptures=<directory>`).

import { join } from "node:path";
import { type Mode, MODES } from "../captures.ts";
import { root } from "./mobile.ts";
import { run, words } from "./process.ts";
import type { CaptureName, Raw, Taken, Workspace } from "./types.ts";

export async function takeCompose(names: CaptureName[], workspace: Workspace): Promise<Taken> {
  const kotlin = join(root, "kotlin");
  console.log("  gradlew :ui:renderPreview");
  await run(
    join(kotlin, process.platform === "win32" ? "gradlew.bat" : "gradlew"),
    // Neither a Gradle daemon nor a Kotlin one is left running after the build.
    [
      ":ui:renderPreview",
      `-Pcaptures=${workspace.raw}`,
      ...words("--console=plain --no-daemon -Pkotlin.compiler.execution.strategy=in-process"),
    ],
    { cwd: kotlin, log: join(workspace.logs, "compose-render.log") },
  );
  const still = (name: CaptureName) =>
    Object.fromEntries(
      MODES.map((mode) => [mode, join(workspace.raw, `${name}-${mode}.png`)]),
    ) as Record<Mode, string>;
  return {
    source: "an off-screen render of a 390 × 844 dp phone screen on the desktop JVM",
    shots: new Map<CaptureName, Raw>(names.map((name) => [name, { still: still(name) }])),
  };
}
