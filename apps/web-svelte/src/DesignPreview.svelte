<!--
  The design preview at `/design`: every token group and every component in every variant and
  state. Every web app draws the same preview, written once in @acme/ui-core/preview; this one
  draws it with @acme/ui-svelte.
-->
<script module lang="ts">
  import { designPreview, Preview } from "@acme/ui-svelte/preview";

  const SCREEN = designPreview();
</script>

<Preview screen={SCREEN} />
