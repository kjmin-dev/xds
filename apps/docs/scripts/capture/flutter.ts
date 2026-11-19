// The Flutter widget tests already render both modes on pinned Linux. Reuse their reference
// images so the documentation and the comparison in CI show the very same pixels.
import { join } from "node:path";
import { root } from "./mobile.ts";
import type { CaptureName, Raw, Taken } from "./types.ts";

export function takeFlutter(names: CaptureName[]): Promise<Taken> {
  const goldens = join(root, "flutter/ui/test/goldens");
  const shots = new Map<CaptureName, Raw>();
  for (const name of names) {
    const stem = ["sheet", "datepicker", "daterange"].includes(name) ? `open-${name}` : name;
    shots.set(name, {
      still: {
        light: join(goldens, `${stem}-light.png`),
        dark: join(goldens, `${stem}-dark.png`),
      },
    });
  }
  return Promise.resolve({ source: "the Flutter widget tests on Linux", shots });
}
