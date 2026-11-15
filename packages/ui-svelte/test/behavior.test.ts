// The behavior tests that every web library shares, from @acme/ui-core, run against this
// package's Svelte components. Each scenario is a screen of @acme/ui-core/test/scenarios, drawn
// by the renderer of the design preview, with its state in the screen.

import { describeBehavior } from "@acme/ui-core/test/behavior";
import { SCREENS } from "@acme/ui-core/test/scenarios";
import { flushSync, mount, unmount } from "svelte";
import { afterEach } from "vitest";
import { Preview } from "../src/preview/index.ts";
import "../src/styles/index.css";

let shown: ReturnType<typeof mount> | undefined;

afterEach(async () => {
  if (shown) await unmount(shown);
  shown = undefined;
  document.body.replaceChildren();
});

describeBehavior((scenario) => {
  shown = mount(Preview, {
    target: document.body.appendChild(document.createElement("main")),
    props: { screen: SCREENS[scenario] },
  });
  // Runs the screen's first updates now, so the first key a test presses finds the scenario on
  // the page.
  flushSync();
});
