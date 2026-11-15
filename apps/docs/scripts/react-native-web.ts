// Lets Vite bundle @acme/ui-native for the browser, with react-native-web standing in for React
// Native, as Metro does when it bundles an app for the web. The site's build and the behavior
// tests of the touch-only examples both take it, so they resolve the same files.

import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import type { Plugin } from "vite";

// An absolute path, not the package name: under pnpm, @acme/ui-native and react-native-svg see
// only their own dependencies, and react-native-web is not one of them.
const reactNativeWeb = dirname(
  createRequire(import.meta.url).resolve("react-native-web/package.json"),
);

/** The libraries beside React Native that ship a `.web.js` file next to a native one. */
const LIBRARIES = ["react-native-svg", "react-native-safe-area-context"];
const IN_LIBRARY = new RegExp(`/node_modules/(${LIBRARIES.join("|")})/`);

const STUB = "\0react-native-web-stub";

/**
 * Picks the files of those libraries that work on the web. Plain Rolldown hooks, so that the
 * bundler of the dev server's dependencies can take them too.
 */
const webFiles = {
  name: "react-native-web-files",
  resolveId(id: string, importer: string | undefined) {
    // An Android-only native module that react-native-svg loads lazily and never calls on the
    // web, and Metro's asset registry, which it reads for a bundled image the icons never use.
    if (
      id.endsWith("/fabric/NativeSvgSoundModule") ||
      id === "@react-native/assets-registry/registry"
    ) {
      return STUB;
    }
    // Rolldown applies `resolve.extensions` to bare imports only, not to a relative import
    // inside node_modules, so `./elements` would be the native file rather than
    // `./elements.web.js`, and the native one pulls in React Native's Fabric code.
    if (!importer || !id.startsWith(".") || !IN_LIBRARY.test(importer)) return null;
    const base = resolve(dirname(importer), id);
    for (const candidate of [`${base}.web.js`, `${base}/index.web.js`]) {
      if (existsSync(candidate)) return candidate;
    }
    return null;
  },
  load: (id: string) =>
    id === STUB ? "export default {}; export const getAssetByID = () => undefined;" : null,
};

export function reactNativeWebPlugin(): Plugin {
  return {
    ...webFiles,
    name: "react-native-web",
    enforce: "pre",
    config: () => ({
      resolve: {
        alias: [{ find: /^react-native$/, replacement: reactNativeWeb }],
      },
      // The dev server, and so the behavior tests, bundle dependencies ahead of time without
      // Vite's plugins, so the bundler there is given the same resolution. (The libraries mix
      // ES modules with CommonJS files, so they cannot be left out of that bundle instead.)
      optimizeDeps: { rolldownOptions: { plugins: [webFiles] } },
      // Metro defines `global`, and the Animated code that react-native-web takes from React
      // Native reads it to stop an animation that is still running. Without it, opening the
      // sheet while it is still closing, or closing it while it opens, throws and empties the
      // frame.
      define: { global: "globalThis" },
    }),
  };
}
