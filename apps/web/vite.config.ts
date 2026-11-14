import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss(), preloadScreen()],
  server: { port: 5173, strictPort: true },
});

/**
 * main.tsx imports the screen for the path on demand, so on its own the browser learns of the
 * screen's modules only once the entry has downloaded and run: one more round trip before
 * anything shows. This names them in the page, for the path it was opened at, so they download
 * alongside the entry.
 */
function preloadScreen(): Plugin {
  let base = "/";
  return {
    name: "preload-screen",
    apply: "build",
    configResolved(config) {
      base = config.base;
    },
    transformIndexHtml: {
      order: "post",
      handler(html, { bundle }) {
        if (!bundle) return;
        const chunks = Object.values(bundle).flatMap((output) =>
          output.type === "chunk" ? [output] : [],
        );
        // Each screen's chunk, with the chunks it imports, short of the entry already in the page.
        const modules = (screen: string) => {
          const files = new Set<string>();
          const add = (fileName: string) => {
            const chunk = chunks.find((candidate) => candidate.fileName === fileName);
            if (!chunk || chunk.isEntry || files.has(fileName)) return;
            files.add(fileName);
            chunk.imports.forEach(add);
          };
          const chunk = chunks.find((candidate) => candidate.facadeModuleId?.endsWith(screen));
          if (!chunk) throw new Error(`preload-screen: no chunk for ${screen}`);
          add(chunk.fileName);
          return [...files].map((file) => `${base}${file}`);
        };
        const design = JSON.stringify(modules("/src/DesignPreview.tsx"));
        const app = JSON.stringify(modules("/src/App.tsx"));
        // The same test as main.tsx, which picks the screen.
        const script = `<script>for (const href of location.pathname === "/design" ? ${design} : ${app}) document.head.append(Object.assign(document.createElement("link"), { rel: "modulepreload", href }));</script>`;
        // Ahead of the entry and its stylesheet: an inline script after a stylesheet waits for
        // the stylesheet to download before it runs.
        const entry = html.indexOf('<script type="module"');
        if (entry < 0) throw new Error("preload-screen: no entry script in index.html");
        return `${html.slice(0, entry)}${script}\n    ${html.slice(entry)}`;
      },
    },
  };
}
