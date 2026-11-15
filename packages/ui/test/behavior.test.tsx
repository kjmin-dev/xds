// The behavior tests that every web library shares, from @acme/ui-core, run against this
// package's React components. Each scenario is a screen of @acme/ui-core/test/scenarios, drawn
// by the renderer of the design preview, with its state in the screen.

import { describeBehavior } from "@acme/ui-core/test/behavior";
import { SCREENS } from "@acme/ui-core/test/scenarios";
import { StrictMode } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import "../src/styles/index.css";
import { afterEach } from "vitest";
import { Preview } from "../src/preview.tsx";

let root: Root | undefined;

afterEach(() => {
  root?.unmount();
  root = undefined;
  document.body.replaceChildren();
});

describeBehavior((scenario) => {
  root = createRoot(document.body.appendChild(document.createElement("main")));
  // Rendered at once, so that the first key a test presses finds the scenario on the page.
  flushSync(() =>
    root?.render(
      <StrictMode>
        <Preview screen={SCREENS[scenario]} />
      </StrictMode>,
    ),
  );
});
