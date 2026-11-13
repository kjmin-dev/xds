// Where the web app's design preview is, for the sidebar and the component pages to link to.
//
// Unset, PREVIEW_SITE means the web app's dev server (`mise run //web:dev`), as an unset DOCS_SITE
// means this site's. The Docs workflow always sets it from the repository variable, so it is empty
// where the repository has none, and empty means no links: a deployed site must not link to
// localhost.
const site = (process.env.PREVIEW_SITE ?? "http://localhost:5173").replace(/\/+$/, "");

/** The design preview, opened at one section when given, or `undefined` when there is none. */
export function previewLink(section?: string): string | undefined {
  if (!site) return undefined;
  return `${site}/design${section ? `#${section}` : ""}`;
}

/** The anchor the design preview gives a section, as `anchor` in apps/web/src/DesignPreview.tsx. */
export const previewAnchor = (title: string) => title.toLowerCase().replace(/[^a-z]+/g, "-");
