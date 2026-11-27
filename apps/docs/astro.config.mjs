import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import starlightLlmsTxt from "starlight-llms-txt";
import { demoFrames } from "./scripts/demo-frames.ts";
import { previewLink } from "./scripts/preview.ts";
import { reactNativeWebPlugin } from "./scripts/react-native-web.ts";

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
      logo: { src: "./src/assets/xds-logo.svg", replacesTitle: true },
      description:
        "Cross-platform design system template with shared DTCG tokens, component libraries for web, desktop, and mobile, and a CLI for scaffolding.",
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
            "xds is a cross-platform design system template. DTCG design tokens compile to CSS, Tailwind, TypeScript, Rust, Kotlin, and Dart; matching component libraries ship for React, Solid, Vue, and Svelte (web), GPUI (desktop), React Native, Compose Multiplatform, and Flutter; and the `xds` CLI scaffolds a project with your chosen targets and color theme.",
          // The Korean pages translate the English ones; one language is enough for a model.
          exclude: ["ko/**"],
          // A component page's chips repeat its Platforms section, which says it in words, and
          // the index's filter buttons and legend mean nothing in text. Its table stays. Of the
          // preview tabs, the pictures of one mode stay, with their captions.
          customSelectors: {
            all: [
              ".platforms",
              ".matrix__filter",
              ".matrix__count",
              ".matrix__legend",
              ".preview__tabs",
              ".preview__badge",
              ".capture__play",
              ".capture__clip",
              '.capture__media[data-mode="dark"]',
            ],
          },
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
  // The touch-only components' examples draw @acme/ui-native with react-native-web.
  vite: { plugins: [reactNativeWebPlugin(), tailwindcss()] },
});
