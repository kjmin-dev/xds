// Turns what a device or the renderer drew into the files the site serves: WebP stills 780 px
// wide (a 390 pt phone screen at 2x), and H.264 clips 600 px wide that start playing before they
// have finished loading. Stills go through cwebp: Homebrew's ffmpeg has no WebP encoder.

import { run, words } from "./process.ts";

/** The longest clip the site takes. */
const CLIP_SECONDS = 3;

export async function encodeStill(png: string, webp: string, width = 780) {
  // sharp_yuv keeps the edges of thin colored text, which plain 4:2:0 conversion smears.
  const options = words(`-quiet -q 80 -m 6 -sharp_yuv -metadata none -resize ${width} 0`);
  await run("cwebp", [...options, png, "-o", webp]);
}

/**
 * The part of a recording in which the screen moves, in seconds. Only the top of the screen is
 * watched: the preview's skeletons pulse further down for as long as they are on screen, and the
 * scrim behind the sheet darkens the top while the sheet rises.
 */
async function movement(recording: string) {
  const watch = "fps=30,crop=iw:ih*0.4:0:0,scale=240:-2,freezedetect=d=0.25";
  const printed = await run("ffmpeg", [
    "-hide_banner",
    "-nostats",
    "-i",
    recording,
    "-an",
    "-vf",
    watch,
    "-f",
    "null",
    "-",
  ]);
  const times = (key: string) =>
    [...printed.matchAll(new RegExp(`freeze_${key}: ([\\d.]+)`, "g"))].map((m) => Number(m[1]));
  const [start] = times("end");
  if (start === undefined) throw new Error(`${recording}: the screen never moved`);
  // simctl writes a frame only when the screen changes, so a recording that ends on the settled
  // sheet ends with its last movement, and there is no freeze to find.
  const end = times("start").find((time) => time > start) ?? (await duration(recording));
  return { start, end };
}

/** Cuts the moment the screen moves out of a recording, with a little rest before and after. */
export async function encodeClip(recording: string, mp4: string) {
  const { start, end } = await movement(recording);
  const from = Math.max(0, start - 0.3);
  const seconds = Math.min(end + 0.6, from + CLIP_SECONDS) - from;
  // The frame rate is made constant before the cut, and the last frame held, for the same reason:
  // the recording has no frames while the screen is still.
  await run("ffmpeg", [
    ...words("-hide_banner -loglevel error -y -i"),
    recording,
    ...words(`-ss ${from.toFixed(3)} -t ${seconds.toFixed(3)} -an -map_metadata -1`),
    ...words(
      "-vf fps=30,tpad=stop_mode=clone:stop_duration=1,scale=600:-2:flags=lanczos,format=yuv420p",
    ),
    ...words("-c:v libx264 -preset veryslow -crf 28 -profile:v high -movflags +faststart"),
    mp4,
  ]);
}

/** How long a video file plays, in seconds. */
export async function duration(file: string) {
  const printed = await run("ffprobe", [
    ...words("-v error -show_entries format=duration -of csv=p=0"),
    file,
  ]);
  return Number(printed.trim());
}
