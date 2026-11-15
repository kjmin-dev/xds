import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";
import { reactNativeWebPlugin } from "./scripts/react-native-web.ts";

// The touch-only examples of the component pages, checked in the browser as the frame on the
// page draws them: the same components, through the same resolution of React Native to
// react-native-web as the site's build. And the preview tabs of the pages with pictures from the
// real clients, as Astro renders them before the tests start. The `.test.ts` files beside them
// run in Node (`node --test`).
export default defineConfig({
  plugins: [reactNativeWebPlugin()],
  test: {
    name: "browser",
    include: ["test/**/*.test.tsx"],
    globalSetup: ["test/render-previews.ts"],
    browser: {
      enabled: true,
      headless: true,
      // The Google Chrome installed on the machine, which GitHub's runners have too, so that
      // nothing downloads a browser.
      provider: playwright({ launchOptions: { channel: "chrome" } }),
      instances: [{ browser: "chromium" }],
      // The screen inside the phone frame on a wide page.
      viewport: { width: 370, height: 620 },
      screenshotFailures: false,
    },
  },
});
