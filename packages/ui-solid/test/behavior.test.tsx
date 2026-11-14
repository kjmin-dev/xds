// The behavior tests that every web library shares, from @acme/ui-core, run against this
// package's Solid components. Each scenario is a screen of @acme/ui-core/test/scenarios, drawn
// by the renderer of the design preview, with its state in the screen.

import { describeBehavior } from "@acme/ui-core/test/behavior";
import { SCREENS } from "@acme/ui-core/test/scenarios";
import { render } from "@solidjs/web";
import { afterEach } from "vitest";
import { Preview } from "../src/preview.tsx";
import "../src/styles/index.css";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.replaceChildren();
});

describeBehavior((scenario) => {
  // render() runs the screen's first updates before it returns, so the first key a test
  // presses finds the scenario on the page.
  dispose = render(
    () => <Preview screen={SCREENS[scenario]} />,
    document.body.appendChild(document.createElement("main")),
  );
});
