// Renders the preview tabs with Astro before the browser tests, for the pages of
// preview-fixture.ts, so that the tests check the markup and the inline script the site ships
// rather than a copy of them. The browser loads the stylesheet and preview.ts on its own.

import { getViteConfig } from "astro/config";
import { experimental_AstroContainer } from "astro/container";
import { createServer, type Plugin } from "vite";
import type { TestProject } from "vitest/node";
import { PAGES } from "./preview-fixture.ts";

declare module "vitest" {
  export interface ProvidedContext {
    /** The preview tabs of each page of the fixture, as HTML. */
    previews: Record<string, string>;
  }
}

/** Stands for the file the generator writes, which a fresh checkout does not have. */
const fixture: Plugin = {
  name: "captures-fixture",
  enforce: "pre",
  resolveId: (source) => (source.endsWith("/generated/captures.json") ? "\0captures" : undefined),
  load: (id) => (id === "\0captures" ? `export default ${JSON.stringify(PAGES)};` : undefined),
};

export default async function setup(project: TestProject) {
  const config = await getViteConfig(
    {},
    { logLevel: "silent" },
  )({ command: "serve", mode: "test" });
  const server = await createServer({
    ...config,
    configFile: false,
    plugins: [fixture, ...(config.plugins ?? [])],
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: "custom",
  });
  try {
    const { default: PreviewTabs } = await server.ssrLoadModule(
      "/src/components/PreviewTabs.astro",
    );
    const container = await experimental_AstroContainer.create();
    const previews: Record<string, string> = {};
    for (const name of Object.keys(PAGES)) {
      previews[name] = await container.renderToString(PreviewTabs, {
        props: { name },
        slots: { default: '<p class="live-example">The live example</p>' },
      });
    }
    project.provide("previews", previews);
  } finally {
    await server.close();
  }
}
