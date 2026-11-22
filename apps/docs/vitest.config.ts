import { fileURLToPath } from "node:url";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";
import { reactNativeWebPlugin } from "./scripts/react-native-web.ts";

// The touch-only examples of the component pages, checked in the browser as the frame on the
// page draws them: the same components, through the same resolution of React Native to
// react-native-web as the site's build. And the preview tabs of the pages with pictures from the
// real clients, as Astro renders them before the tests start. The `.test.ts` files beside them
// run in Node (`node --test`).
export default defineConfig({
  plugins: [
    {
      name: "native-glass-test-hosts",
      enforce: "pre",
      transform(code, id) {
        // The docs render Glass.web.tsx. Only this regression exercises the actual native
        // material component with UIKit/Expo hosts replaced by distinct browser elements. The
        // component requires the Expo modules inside a `try`, as optional peers, so each
        // require becomes the stand-ins.
        if (!id.endsWith("/packages/ui-native/src/Glass.tsx")) return null;
        const hosts = fileURLToPath(new URL("./test/fixtures/glass-hosts.tsx", import.meta.url));
        const replaced = code.replaceAll(
          /require\("(expo|expo-blur|expo-glass-effect|expo-linear-gradient)"\)/g,
          "glassHosts",
        );
        if (replaced === code) throw new Error("Glass.tsx no longer requires the Expo modules");
        return `import * as glassHosts from ${JSON.stringify(hosts)};\n${replaced}`;
      },
    },
    reactNativeWebPlugin(),
  ],
  // The glass test replaces Glass.tsx's requires of these with its stand-ins, so nothing loads
  // them; prebundling them for the browser would fail on Expo's native-only exports.
  optimizeDeps: {
    exclude: ["expo", "expo-blur", "expo-glass-effect", "expo-linear-gradient"],
  },
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
