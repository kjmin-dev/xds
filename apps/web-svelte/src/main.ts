import { mount } from "svelte";
import "./styles/app.css";

const root = document.getElementById("root");
if (!root) throw new Error("index.html is missing #root");

// `/design` is the design preview: every token and component on one page. Everything else is
// the app. Each is loaded on demand, so the preview adds nothing to the app's bundle.
const { default: Screen } =
  location.pathname === "/design"
    ? await import("./DesignPreview.svelte")
    : await import("./App.svelte");

mount(Screen, { target: root });
