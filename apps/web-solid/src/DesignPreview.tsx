// The design preview at `/design`: every token group and every component in every variant and
// state. Every web app draws the same preview, written once in @acme/ui-core/preview; this one
// draws it with @acme/ui-solid.

import { designPreview, Preview } from "@acme/ui-solid/preview";

const SCREEN = designPreview();

export function DesignPreview() {
  return <Preview screen={SCREEN} />;
}
