// The behavior tests that every web library shares, from @acme/ui-core, run against this
// package's Vue components. Each scenario is a screen of @acme/ui-core/test/scenarios, drawn
// by the renderer of the design preview, with its state in the screen.

import { describeBehavior } from "@acme/ui-core/test/behavior";
import { SCREENS } from "@acme/ui-core/test/scenarios";
import { afterEach } from "vitest";
import { type App, createApp, h, nextTick } from "vue";
import { Preview } from "../src/preview.ts";
import "../src/styles/index.css";

let app: App | undefined;

afterEach(() => {
  app?.unmount();
  app = undefined;
  document.body.replaceChildren();
});

describeBehavior(async (scenario) => {
  app = createApp({ render: () => h(Preview, { screen: SCREENS[scenario] }) });
  app.mount(document.body.appendChild(document.createElement("main")));
  // Once the updates the mount started are drawn, so that the first key a test presses finds
  // the scenario on the page.
  await nextTick();
});
