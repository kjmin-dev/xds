import solid from "@solidjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // The components are tested with the stylesheet they ship with: what is visible, and what
  // takes a press, depends on it. Solid's compiler is the one apps/web-solid builds with.
  plugins: [solid(), tailwindcss()],
  test: {
    name: "browser",
    include: ["test/**/*.test.tsx"],
    browser: {
      enabled: true,
      headless: true,
      // The Google Chrome installed on the machine, which GitHub's runners have too, so that
      // nothing downloads a browser.
      provider: playwright({ launchOptions: { channel: "chrome" } }),
      instances: [{ browser: "chromium" }],
      screenshotFailures: false,
    },
  },
});
