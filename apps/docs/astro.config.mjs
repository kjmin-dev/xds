import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import starlightLlmsTxt from "starlight-llms-txt";
import { demoFrames } from "./scripts/demo-frames.ts";
import { previewLink } from "./scripts/preview.ts";

// The public address of the site. `llms.txt`, the sitemap and canonical links are built from it,
// so a deployment sets DOCS_SITE. Without it the links point at the local preview server.
const site = process.env.DOCS_SITE || "http://localhost:4321";
const preview = previewLink();

export default defineConfig({
  site,
  trailingSlash: "always",
  // Fetch a page while the pointer rests on its link, so it is often in before the click.
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
  integrations: [
    starlight({
      title: "xds",
      description:
        "A cross-platform design system template: one set of design tokens, component libraries for web, desktop and mobile, and a CLI that scaffolds a project with the clients you pick.",
      defaultLocale: "root",
      locales: {
        root: { label: "English", lang: "en" },
        ko: { label: "한국어", lang: "ko" },
      },
      social: [{ icon: "github", label: "GitHub", href: "https://github.com/kjmin-dev/xds" }],
      editLink: { baseUrl: "https://github.com/kjmin-dev/xds/edit/main/apps/docs/" },
      customCss: ["./src/styles/site.css"],
      routeMiddleware: "./src/route-data.ts",
      plugins: [
        starlightLlmsTxt({
          projectName: "xds",
          description:
            "xds is a cross-platform design system template. Design tokens in DTCG format are compiled to CSS, Tailwind, TypeScript, Rust and Kotlin; the same components exist for React and Solid (web), GPUI (desktop), React Native and Compose Multiplatform; and the `xds` CLI scaffolds a project with the chosen clients and color theme.",
          // The Korean pages translate the English ones; one language is enough for a model.
          exclude: ["ko/**"],
        }),
      ],
      sidebar: [
        {
          label: "Start",
          translations: { ko: "시작하기" },
          items: [{ slug: "getting-started" }],
        },
        {
          label: "CLI",
          items: [{ autogenerate: { directory: "cli" } }],
        },
        {
          label: "Design system",
          translations: { ko: "디자인 시스템" },
          items: [{ autogenerate: { directory: "design-system" } }],
        },
        {
          label: "Tokens",
          translations: { ko: "토큰" },
          items: [{ autogenerate: { directory: "tokens" } }],
        },
        {
          label: "Components",
          translations: { ko: "컴포넌트" },
          items: [
            // Every component on one page, as the web app shows it.
            ...(preview
              ? [{ label: "Design preview", translations: { ko: "디자인 프리뷰" }, link: preview }]
              : []),
            { autogenerate: { directory: "components" } },
          ],
        },
        {
          label: "Hosting this site",
          translations: { ko: "사이트 호스팅" },
          items: [{ slug: "hosting" }],
        },
      ],
    }),
    react(),
    demoFrames(),
  ],
  vite: { plugins: [tailwindcss()] },
});
