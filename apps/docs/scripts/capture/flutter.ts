// The Flutter widget tests already render both modes on pinned Linux. Reuse their reference
// images so the documentation and the comparison in CI show the very same pixels.
import { join } from "node:path";
import { flutterGoldenPath } from "../captures.ts";
import { root } from "./mobile.ts";
import type { CaptureName, Raw, Taken } from "./types.ts";

export function takeFlutter(names: CaptureName[]): Promise<Taken> {
  const shots = new Map<CaptureName, Raw>();
  for (const name of names) {
    shots.set(name, {
      still: {
        light: join(root, flutterGoldenPath(name, "light")),
        dark: join(root, flutterGoldenPath(name, "dark")),
      },
    });
  }
  return Promise.resolve({ source: "the Flutter widget tests on Linux", shots });
}
