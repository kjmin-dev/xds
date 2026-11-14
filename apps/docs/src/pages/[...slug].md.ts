// A Markdown copy of every English page, for agents and anyone who wants the text without the
// site around it: the page's address with `.md` in place of the last slash, so
// `/components/button/` is also at `/components/button.md`.

import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";

export const getStaticPaths: GetStaticPaths = async () => {
  const pages = await getCollection("docs", (entry) => !entry.id.startsWith("ko/"));
  return pages.map((entry) => ({
    params: { slug: entry.id === "index" ? "index" : entry.id },
    props: { entry },
  }));
};

/** MDX to plain Markdown: without imports, comments and the components that only a browser can show. */
const plain = (body: string) =>
  body
    .replace(/^import .* from "(@astrojs\/starlight\/components|.*\.astro)";$/gm, "")
    .replace(/^The frame above shows .*$/gm, "")
    .replace(/^\{\/\*.*\*\/\}$/gm, "")
    .replace(/^<Demo .*\/>$/gm, "")
    .replace(/<span class="swatch"[^>]*><\/span>/g, "")
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
