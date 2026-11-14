import solid from "@solidjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [solid(), tailwindcss()],
  // Not 5173, so that it runs beside the React web app of the same project.
  server: { port: 5174, strictPort: true },
});
