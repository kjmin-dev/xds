// What the generator would write to src/generated/captures.json for three component pages, for
// the browser tests of the preview tabs. The files are not there: the tests look at which of them
// the browser asks for, not at what they show.

import type { CapturePages, CaptureView } from "../scripts/capture-pages.ts";

const view = (
  name: string,
  platform: CaptureView["platform"],
  extra: Partial<CaptureView> = {},
) => ({
  name,
  platform,
  client: platform === "compose" ? "Compose" : "React Native",
  source: "a Release build in the iOS 26.5 Simulator (iPhone 17 Pro)",
  date: "2026-11-15",
  alt: `The ${name} capture on ${platform}.`,
  stale: false,
  stills: {
    light: { src: `/fixture/${name}/${platform}-light.webp`, width: 780, height: 560 },
    dark: { src: `/fixture/${name}/${platform}-dark.webp`, width: 780, height: 560 },
  },
  ...extra,
});

export const PAGES: CapturePages = {
  TopBar: {
    initial: "live",
    tabs: [
      { platform: "ios", label: "iOS", captures: [view("navigation", "ios")] },
      { platform: "android", label: "Android", captures: [view("navigation", "android")] },
      {
        platform: "compose",
        label: "Compose",
        captures: [view("navigation", "compose", { stale: true })],
      },
    ],
  },
  BottomSheet: {
    initial: "live",
    tabs: [
      {
        platform: "ios",
        label: "iOS",
        captures: [
          view("sheet", "ios", {
            clips: { light: "/fixture/sheet/ios-light.mp4", dark: "/fixture/sheet/ios-dark.mp4" },
          }),
        ],
      },
      { platform: "android", label: "Android", captures: [view("sheet", "android")] },
    ],
  },
  // A page with fewer platforms than the others.
  TabBar: {
    initial: "live",
    tabs: [{ platform: "compose", label: "Compose", captures: [view("navigation", "compose")] }],
  },
};
