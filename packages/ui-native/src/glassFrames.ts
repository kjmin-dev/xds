// Read after the scripted scroll. UI callback intervals describe scheduling, independently of
// the compositor's presentation trace.
export const GLASS_SCROLL_MS = 10_000;
export const DISPLAY_FRAME_MS = 1000 / 120;

function frameWindow(intervals: readonly number[], start: number, duration = GLASS_SCROLL_MS) {
  let elapsedMs = 0;
  let dropped = 0;
  const samples: number[] = [];
  const missed: [number, number][] = [];
  const bySecond = Array<number>(GLASS_SCROLL_MS / 1000).fill(0);
  for (const interval of intervals.slice(start)) {
    const slots = Math.max(0, Math.round(interval / DISPLAY_FRAME_MS) - 1);
    if (slots > 0) {
      const second = Math.min(bySecond.length - 1, Math.floor(elapsedMs / 1000));
      bySecond[second] = (bySecond[second] ?? 0) + slots;
      dropped += slots;
      if (missed.length < 12)
        missed.push([Math.round(elapsedMs), Math.round(interval * 1000) / 1000]);
    }
    samples.push(interval);
    elapsedMs += interval;
    if (elapsedMs >= duration - 0.000001) break;
  }
  samples.sort((a, b) => a - b);
  return {
    elapsedMs,
    frames: samples.length,
    dropped,
    missed,
    bySecond,
    p90Ms: samples[Math.ceil(samples.length * 0.9) - 1],
    p99Ms: samples[Math.ceil(samples.length * 0.99) - 1],
  };
}

export function glassFrameWindows(intervals: readonly number[]) {
  const firstUpdateMs = intervals[0] ?? 0;
  return {
    // Retain the original ten-second window from the frame that found the scene ready.
    ...frameWindow(intervals, 0),
    firstUpdateMs,
    firstUpdateMissed: Math.max(0, Math.round(firstUpdateMs / DISPLAY_FRAME_MS) - 1),
    // The first interval precedes the first change in scroll offset. The second window
    // instead spans ten full seconds from that first change through the last scroll command.
    motion: frameWindow(intervals, 1),
  };
}

/** The opening phase runs until the sheet is shown and its entrance completes. */
export function glassOpeningWindow(intervals: readonly number[]) {
  return frameWindow(intervals, 0, Infinity);
}
