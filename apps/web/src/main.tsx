import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./styles/app.css";

const root = document.getElementById("root");
if (!root) throw new Error("index.html is missing #root");

// `/design` is the design preview: every token and component on one page. Everything else is
// the app. Each is loaded on demand, so the preview adds nothing to the app's bundle.
const Screen = lazy(async () =>
  location.pathname === "/design"
    ? { default: (await import("./DesignPreview.tsx")).DesignPreview }
    : { default: (await import("./App.tsx")).App },
);

createRoot(root).render(
  <StrictMode>
    <Suspense>
      <Screen />
    </Suspense>
  </StrictMode>,
);
