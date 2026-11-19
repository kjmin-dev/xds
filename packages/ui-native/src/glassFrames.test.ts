import assert from "node:assert/strict";
import { test } from "node:test";
import { DISPLAY_FRAME_MS, GLASS_SCROLL_MS, glassFrameWindows } from "./glassFrames.ts";

test("a missed callback before the first scroll stays in the original window", () => {
  const frames = glassFrameWindows([25, ...Array<number>(1200).fill(DISPLAY_FRAME_MS)]);
  assert.equal(frames.firstUpdateMs, 25);
  assert.equal(frames.firstUpdateMissed, 2);
  assert.equal(frames.dropped, 2);
  assert.equal(frames.motion.dropped, 0);
  assert.equal(frames.motion.frames, 1200);
  assert.ok(frames.motion.elapsedMs >= GLASS_SCROLL_MS - 0.000001);
  assert.equal(frames.frames, 1198);
});

test("a stall during motion is counted at its own offset in both windows", () => {
  const frames = glassFrameWindows([DISPLAY_FRAME_MS, DISPLAY_FRAME_MS, 25]);
  assert.deepEqual(frames.missed, [[17, 25]]);
  assert.deepEqual(frames.motion.missed, [[8, 25]]);
  assert.equal(frames.motion.dropped, 2);
});
