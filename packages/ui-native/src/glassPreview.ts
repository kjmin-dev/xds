import { createContext } from "react";

export type GlassTier = "native" | "blur" | "solid";
export const PreviewGlassTier = createContext<
  { requested?: GlassTier; onResolve?: (tier: GlassTier) => void } | undefined
>(undefined);

export { DISPLAY_FRAME_MS, GLASS_SCROLL_MS, glassFrameWindows } from "./glassFrames.ts";
