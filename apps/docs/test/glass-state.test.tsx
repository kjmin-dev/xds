import { useState } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { Platform } from "react-native";
import { afterAll, beforeAll, expect, test } from "vitest";
import { page } from "vitest/browser";
import {
  GlassBackdrop,
  GlassMaterial,
  GlassScene,
} from "../../../packages/ui-native/src/Glass.tsx";
import { type GlassTier, PreviewGlassTier } from "../../../packages/ui-native/src/glassPreview.ts";
import { setBlurAllowed } from "./fixtures/glass-hosts.tsx";

const os = Platform.OS;
beforeAll(() => Object.defineProperty(Platform, "OS", { value: "ios", configurable: true }));
afterAll(() => Object.defineProperty(Platform, "OS", { value: os, configurable: true }));

function Draft() {
  const [text, setText] = useState("");
  return (
    <input aria-label="Draft" value={text} onChange={(event) => setText(event.target.value)} />
  );
}

test.each(["native", "blur", "solid"] as const)(
  "%s controls keep their state and selection across material changes",
  async (requested: GlassTier) => {
    const screen = document.createElement("main");
    document.body.append(screen);
    const root = createRoot(screen);
    const render = (marked: boolean) =>
      flushSync(() =>
        root.render(
          <PreviewGlassTier value={{ requested }}>
            <GlassScene>
              {marked && <GlassBackdrop />}
              <GlassMaterial corners={0}>
                <Draft />
              </GlassMaterial>
            </GlassScene>
          </PreviewGlassTier>,
        ),
      );
    try {
      render(false);
      const input = page.getByRole("textbox", { name: "Draft" });
      await input.fill("editing details");
      const original = input.element() as HTMLInputElement;
      original.focus();
      original.setSelectionRange(2, 5);
      const check = async (tier: GlassTier) => {
        await expect.element(page.getByTestId(`glass-bar-${tier}`)).toBeVisible();
        expect(input.element()).toBe(original);
        expect(original.value).toBe("editing details");
        expect(document.activeElement).toBe(original);
        expect([original.selectionStart, original.selectionEnd]).toEqual([2, 5]);
        const systemEffect = screen.querySelector("[data-effect]")?.getAttribute("data-effect");
        const activeEffect = tier === "native" ? "regular" : "none";
        expect(systemEffect).toBe(requested === "native" ? activeEffect : undefined);
      };
      render(true);
      await check(requested);
      flushSync(() => setBlurAllowed(false));
      await check("solid");
      flushSync(() => setBlurAllowed(true));
      await check(requested);
    } finally {
      flushSync(() => root.unmount());
      screen.remove();
      setBlurAllowed(true);
    }
  },
);
