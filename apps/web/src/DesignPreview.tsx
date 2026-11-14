// The design preview at `/design`: every token group and every component in every variant and
// state. Every web app draws the same preview, written once in @acme/ui-core/preview; this one
// draws it with @acme/ui.

import { designPreview, Preview } from "@acme/ui/preview";

// @if template
// The deployment of this repository's preview links back to the documentation, whose address
// the Preview workflow passes to the build. A project made by `xds create` has no such site.
const DOCS_SITE: string | undefined = import.meta.env.VITE_DOCS_SITE;
// @endif
const SCREEN = designPreview({
  // @if template
  links: DOCS_SITE ? [{ label: "Documentation", href: DOCS_SITE }] : [],
  // @endif
});

export function DesignPreview() {
  return <Preview screen={SCREEN} />;
}
