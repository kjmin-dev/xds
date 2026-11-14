import { render } from "@solidjs/web";
import { Loading, lazy } from "solid-js";
import "./styles/app.css";

const root = document.getElementById("root");
if (!root) throw new Error("index.html is missing #root");

// `/design` is the design preview: every token and component on one page. Everything else is
// the app. Each is loaded on demand, so the preview adds nothing to the app's bundle.
const Screen = lazy(() =>
  location.pathname === "/design"
    ? import("./DesignPreview.tsx").then((module) => ({ default: module.DesignPreview }))
    : import("./App.tsx").then((module) => ({ default: module.App })),
);

render(
  () => (
    <Loading>
      <Screen />
    </Loading>
  ),
  root,
);
