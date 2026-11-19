import { createContext } from "react";

export type GlassTier = "native" | "blur" | "solid";
export const PreviewGlassTier = createContext<
  { requested?: GlassTier; onResolve?: (tier: GlassTier) => void } | undefined
>(undefined);
