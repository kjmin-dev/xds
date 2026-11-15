// A Markdown copy of every English page, for agents and anyone who wants the text without the
// site around it: the page's address with `.md` in place of the last slash, so
// `/components/button/` is also at `/components/button.md`.

import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import { type CapturePages, capturesMarkdown } from "../../scripts/capture-pages.ts";
import { matrixMarkdown, type Platforms } from "../../scripts/platforms.ts";
import captures from "../generated/captures.json";
import data from "../generated/platforms.json";

export const getStaticPaths: GetStaticPaths = async () => {
  const pages = await getCollection("docs", (entry) => !entry.id.startsWith("ko/"));
  return pages.map((entry) => ({
    params: { slug: entry.id === "index" ? "index" : entry.id },
    props: { entry },
  }));
};

/**
 * MDX to plain Markdown: without imports, comments and the components that only a browser can
 * show. A component page says in its Platforms section, in words, what its chips show; the
 * index's table becomes a Markdown table, and the pictures in a page's preview tabs a sentence
 * that links to them. Pills keep their text.
 */
const plain = (body: string) =>
  body
    .replace(/^import .* from "(@astrojs\/starlight\/components|.*\.astro)";$/gm, "")
    .replace(/^The frame above shows .*$/gm, "")
    .replace(/^\{\/\*.*\*\/\}$/gm, "")
    .replace(/^<(Demo|PhoneDemo|Platforms) .*\/>$/gm, "")
    .replace(/^<PreviewTabs name="([^"]+)">$/gm, (_, name: string) => {
      const page = (captures as CapturePages)[name];
      return page ? capturesMarkdown(page) : "";
    })
    .replace(/^<\/PreviewTabs>$/gm, "")
    .replace(/^<ComponentMatrix \/>$/gm, () => matrixMarkdown(data as Platforms))
    .replace(/<span class="swatch"[^>]*><\/span>/g, "")
    .replace(
      /<span class="pill pill--option"[^>]*>([^<]*)<span class="sr-only">\.<\/span><\/span> /g,
      "$1: ",
    )
    .replace(/<span class="pill"[^>]*>([^<]*)<span class="sr-only">\.<\/span><\/span>/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export const GET: APIRoute = ({ props }) => {
  const { data, body } = props.entry;
  const text = plain(body ?? "");
  // A component page already opens with its summary.
  const description =
    data.description && !text.startsWith(data.description) ? `> ${data.description}\n\n` : "";
  return new Response(`# ${data.title}\n\n${description}${text}\n`, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
};
