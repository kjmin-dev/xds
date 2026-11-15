import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // The components are tested with the stylesheet they ship with: what is visible, and what
  // takes a press, depends on it. Svelte's compiler reads svelte.config.js, as apps/web-svelte's
  // does.
  plugins: [svelte(), tailwindcss()],
  test: {
    name: "browser",
    include: ["test/**/*.test.ts"],
    browser: {
      enabled: true,
      headless: true,
      // The Google Chrome installed on the machine, which GitHub's runners have too, so that
      // nothing downloads a browser. In English whatever the machine's language: the checks find
      // a day of a calendar by its English name.
      provider: playwright({
        launchOptions: { channel: "chrome" },
        contextOptions: { locale: "en-US" },
      }),
      instances: [{ browser: "chromium" }],
      screenshotFailures: false,
    },
  },
});
