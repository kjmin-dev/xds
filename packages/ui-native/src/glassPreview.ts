import { createContext } from "react";

export type GlassTier = "native" | "blur" | "solid";
export type GlassPart = "bar" | "sheet";
export type GlassSheetEvent = "shown" | "entered" | "closing";
export type GlassMilestones = {
  bar?: { tier: GlassTier; atMs: number };
  sheet?: { tier: GlassTier; atMs: number };
  shownMs?: number;
  enteredMs?: number;
};

/** A bar cannot stand in for the sheet. Modal visibility and the panel's own entrance are independent. */
export function measurableGlassTier(part: GlassPart, events: GlassMilestones): GlassTier | null {
  if (part === "bar") return events.bar?.tier ?? null;
  if (events.shownMs === undefined || events.enteredMs === undefined) return null;
  return events.sheet?.tier ?? null;
}

export const PreviewGlassTier = createContext<
  | {
      requested?: GlassTier;
      onResolve?: (tier: GlassTier, part: GlassPart) => void;
      onSheetEvent?: (event: GlassSheetEvent) => void;
    }
  | undefined
>(undefined);

export {
  DISPLAY_FRAME_MS,
  GLASS_SCROLL_MS,
  glassFrameWindows,
  glassOpeningWindow,
} from "./glassFrames.ts";
