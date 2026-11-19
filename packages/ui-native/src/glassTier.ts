import type { GlassTier } from "./glassPreview.ts";

export function glassTier(
  allowed: boolean,
  backdrop: boolean,
  native: boolean,
  preview?: GlassTier,
): GlassTier {
  if (!allowed || !backdrop || preview === "solid") return "solid";
  return native && preview !== "blur" ? "native" : "blur";
}
