import { createApp, defineAsyncComponent } from "vue";
import "./styles/app.css";

// `/design` is the design preview: every token and component on one page. Everything else is
// the app. Each is loaded on demand, so the preview adds nothing to the app's bundle.
const Screen = defineAsyncComponent(() =>
  location.pathname === "/design" ? import("./DesignPreview.vue") : import("./App.vue"),
);

createApp(Screen).mount("#root");
